from flask import Blueprint, request, session
from flask_socketio import SocketIO, emit
import queue
import threading
import base64
import io
import os
import time
import uuid

from google.cloud import speech_v1p1beta1 as speech
from services.profile_builder import ProfileBuilder

simulate_bp = Blueprint("simulate", __name__)

# Initialize Google Cloud Speech client
speech_client = speech.SpeechClient()

# Initialize Profile Builder
profile_builder = ProfileBuilder()

# Audio config for Google Cloud Speech-to-Text
recognition_config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    sample_rate_hertz=48000, #opus default
    language_code="en-US",
    enable_automatic_punctuation=True,
    model="default",
    use_enhanced=True, #enables phone-quality model
    # Speech detection sensitivity parameters
    speech_contexts=[],
    max_alternatives=1,
    profanity_filter=False
)

streaming_config = speech.StreamingRecognitionConfig(
    config=recognition_config,
    interim_results=True,
    single_utterance=False
    # Note: Advanced voice activity detection parameters removed due to API compatibility
    # The frontend will handle silence detection instead
)

# Session management - use dict to track per-client sessions
active_sessions = {}

# --- SocketIO real-time handlers ---

def register_socketio_handlers(socketio):
    @socketio.on("connect")
    def handle_connect():
        session_id = str(uuid.uuid4())
        active_sessions[session_id] = {
            'audio_queue': queue.Queue(),
            'transcription_thread': None,
            'stop_streaming': False,
            'preparing_to_stop': False,
            'socket_id': request.sid,  # Store the socket ID for this session
            'profiling_complete': False,
            'user_profile': None
        }
        # Store session_id in Flask-SocketIO session
        session['session_id'] = session_id
        print(f"✅ WebSocket client connected with session: {session_id}")

    @socketio.on("disconnect")
    def handle_disconnect():
        session_id = session.get('session_id')
        
        if session_id and session_id in active_sessions:
            # Clean up session
            session_obj = active_sessions[session_id]
            session_obj['stop_streaming'] = True
            
            # Clear the queue
            try:
                while not session_obj['audio_queue'].empty():
                    session_obj['audio_queue'].get_nowait()
            except queue.Empty:
                pass
            
            # Wait for thread to finish (with timeout)
            if session_obj['transcription_thread'] and session_obj['transcription_thread'].is_alive():
                session_obj['transcription_thread'].join(timeout=2.0)
            
            # Remove session
            del active_sessions[session_id]
            print(f"❌ WebSocket client disconnected, cleaned up session: {session_id}")
        else:
            print("❌ WebSocket client disconnected, no session found to clean up")

    @socketio.on("audio_chunk")
    def handle_audio_chunk(data):
        """
        Receives base64-encoded audio chunk from frontend and adds it to the session's queue.
        """
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for audio chunk")
            return
            
        session_obj = active_sessions[session_id]
        if session_obj['stop_streaming']:
            print("⚠️ Received audio chunk but streaming is stopped")
            return
            
        try:
            audio_bytes = base64.b64decode(data)
            session_obj['audio_queue'].put(audio_bytes)
            print(f"📦 Received audio chunk: {len(data)} chars -> {len(audio_bytes)} bytes")
        except Exception as e:
            print(f"❌ Error processing audio chunk: {e}")

    @socketio.on("start_transcription")
    def start_transcription():
        """
        Starts a background thread that streams audio to GCP and sends back transcripts.
        """
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for start_transcription")
            return
            
        session_obj = active_sessions[session_id]
        
        # Stop any existing transcription first
        if session_obj['transcription_thread'] and session_obj['transcription_thread'].is_alive():
            print("🛑 Stopping existing transcription thread")
            session_obj['stop_streaming'] = True
            session_obj['transcription_thread'].join(timeout=2.0)
        
        # Clear the queue
        try:
            while not session_obj['audio_queue'].empty():
                session_obj['audio_queue'].get_nowait()
        except queue.Empty:
            pass
        
        # Reset streaming flag and start new thread
        session_obj['stop_streaming'] = False
        print(f"🧠 Starting transcription thread for session: {session_id}")
        session_obj['transcription_thread'] = threading.Thread(
            target=transcribe_stream_background, 
            args=(socketio, session_id)
        )
        session_obj['transcription_thread'].start()

    @socketio.on("prepare_stop_transcription")
    def prepare_stop_transcription():
        """
        Prepare to stop transcription - allows for graceful shutdown
        """
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for prepare_stop_transcription")
            return
            
        session_obj = active_sessions[session_id]
        print(f"⏳ Preparing to stop transcription for session: {session_id}")
        
        # Mark as preparing to stop (but don't stop yet)
        session_obj['preparing_to_stop'] = True
        
        # Give Google Cloud STT time to process final chunks
        # The actual stop will come from stop_transcription

    @socketio.on("stop_transcription")
    def stop_transcription():
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for stop_transcription")
            return
            
        session_obj = active_sessions[session_id]
        print(f"🛑 Stopping transcription for session: {session_id}")
        
        # Set stop flag
        session_obj['stop_streaming'] = True
        session_obj['preparing_to_stop'] = False
        
        # Don't clear the queue immediately - let it drain naturally
        # This allows final audio chunks to be processed
        
        # Wait a moment for final transcripts, then clear
        def delayed_cleanup():
            import time
            time.sleep(2)  # Give 2 seconds for final processing
            try:
                if session_id in active_sessions:
                    while not session_obj['audio_queue'].empty():
                        session_obj['audio_queue'].get_nowait()
                    print(f"🧹 Cleaned up audio queue for session: {session_id}")
            except queue.Empty:
                pass
        
        # Run cleanup in background thread
        cleanup_thread = threading.Thread(target=delayed_cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()

    @socketio.on("complete_profiling")
    def handle_complete_profiling(data):
        """Handle completion of user profiling"""
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for complete_profiling")
            return
            
        try:
            profile_data = data.get('profileData', {})
            
            # Create profile using ProfileBuilder
            profile = profile_builder.create_profile(session_id, profile_data)
            
            # Update session
            active_sessions[session_id]['profiling_complete'] = True
            active_sessions[session_id]['user_profile'] = profile
            
            # Generate interview context
            interview_context = profile_builder.generate_interview_context(session_id)
            
            socketio.emit("profiling_completed", {
                "success": True,
                "profile": profile,
                "interview_context": interview_context
            }, room=active_sessions[session_id]['socket_id'])
            
            print(f"✅ Profiling completed for session: {session_id}")
            
        except Exception as e:
            print(f"❌ Error completing profiling: {e}")
            socketio.emit("profiling_completed", {
                "success": False,
                "error": str(e)
            }, room=active_sessions[session_id]['socket_id'])

    @socketio.on("get_profile")
    def handle_get_profile():
        """Get current user profile"""
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for get_profile")
            return
            
        profile = profile_builder.get_profile(session_id)
        socketio.emit("profile_data", {
            "profile": profile
        }, room=active_sessions[session_id]['socket_id'])

# --- Streaming transcription task ---

def audio_generator(session_id):
    """Generate audio chunks for a specific session with enhanced buffering"""
    if session_id not in active_sessions:
        return
        
    session_obj = active_sessions[session_id]
    
    while not session_obj['stop_streaming'] and session_id in active_sessions:
        try:
            # Adjust timeout based on whether we're preparing to stop
            timeout = 0.5 if session_obj.get('preparing_to_stop', False) else 1.0
            chunk = session_obj['audio_queue'].get(timeout=timeout)
            
            if chunk is None:
                print("Received empty chunk - skipping")
                continue
                
            if len(chunk) < 500:  # too small might be corrupted
                print(f"Chunk is too small: {len(chunk)}")
                continue
                
            print(f"🧠 Sending chunk to GCP at {time.time()}, size: {len(chunk)}")
            yield speech.StreamingRecognizeRequest(audio_content=chunk)
            
        except queue.Empty:
            # If preparing to stop and queue is empty, break gracefully
            if session_obj.get('preparing_to_stop', False):
                print(f"⏳ Gracefully ending audio stream for session: {session_id}")
                break
            # Otherwise, continue waiting
            continue
        except Exception as e:
            print(f"❌ Error in audio generator: {e}")
            break

def transcribe_stream_background(socketio, session_id):
    """Background transcription task for a specific session"""
    if session_id not in active_sessions:
        return
        
    session_obj = active_sessions[session_id]
    
    try:
        print(f"🎯 Starting transcription stream for session: {session_id}")
        responses = speech_client.streaming_recognize(
            config=streaming_config,
            requests=audio_generator(session_id)
        )

        for response in responses:
            # Check if session still exists and streaming hasn't been stopped
            if session_id not in active_sessions or session_obj['stop_streaming']:
                print(f"🛑 Transcription stopped for session: {session_id}")
                break
                
            if not response.results:
                continue
                
            result = response.results[0]
            transcript = result.alternatives[0].transcript
            is_final = result.is_final

            # Emit transcript back to frontend for this specific session
            socketio.emit("transcript_update", {
                "transcript": transcript,
                "isFinal": is_final
            }, room=session_obj['socket_id'])
            
            print(f"📝 Transcript ({'final' if is_final else 'interim'}): {transcript}")
            
    except Exception as e:
        print(f"❌ Transcription error for session {session_id}: {e}")
    finally:
        # Clean up session thread reference
        if session_id in active_sessions:
            active_sessions[session_id]['transcription_thread'] = None
        print(f"🏁 Transcription thread finished for session: {session_id}")

