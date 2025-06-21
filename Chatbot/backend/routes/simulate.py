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

simulate_bp = Blueprint("simulate", __name__)

# Initialize Google Cloud Speech client
speech_client = speech.SpeechClient()

# Audio config for Google Cloud Speech-to-Text
recognition_config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    sample_rate_hertz=48000, #opus default
    language_code="en-US",
    enable_automatic_punctuation=True,
    model="default",
    use_enhanced=True #enables phone-quality model
)

streaming_config = speech.StreamingRecognitionConfig(
    config=recognition_config,
    interim_results=True,
    single_utterance=False
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
            'socket_id': request.sid  # Store the socket ID for this session
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

    @socketio.on("stop_transcription")
    def stop_transcription():
        session_id = session.get('session_id')
        
        if not session_id or session_id not in active_sessions:
            print("❌ No valid session found for stop_transcription")
            return
            
        session_obj = active_sessions[session_id]
        print(f"🛑 Stopping transcription for session: {session_id}")
        session_obj['stop_streaming'] = True
        
        # Clear the queue
        try:
            while not session_obj['audio_queue'].empty():
                session_obj['audio_queue'].get_nowait()
        except queue.Empty:
            pass

# --- Streaming transcription task ---

def audio_generator(session_id):
    """Generate audio chunks for a specific session"""
    if session_id not in active_sessions:
        return
        
    session_obj = active_sessions[session_id]
    
    while not session_obj['stop_streaming'] and session_id in active_sessions:
        try:
            # Use timeout to avoid blocking indefinitely
            chunk = session_obj['audio_queue'].get(timeout=1.0)
            
            if chunk is None:
                print("Received empty chunk - skipping")
                continue
                
            if len(chunk) < 500:  # too small might be corrupted
                print(f"Chunk is too small: {len(chunk)}")
                continue
                
            print(f"🧠 Sending chunk to GCP at {time.time()}, size: {len(chunk)}")
            yield speech.StreamingRecognizeRequest(audio_content=chunk)
            
        except queue.Empty:
            # Timeout occurred, check if we should continue
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

            # Emit transcript back to frontend
            socketio.emit("transcript_update", {
                "transcript": transcript,
                "isFinal": is_final
            })
            
            print(f"📝 Transcript ({'final' if is_final else 'interim'}): {transcript}")
            
    except Exception as e:
        print(f"❌ Transcription error for session {session_id}: {e}")
    finally:
        # Clean up session thread reference
        if session_id in active_sessions:
            active_sessions[session_id]['transcription_thread'] = None
        print(f"🏁 Transcription thread finished for session: {session_id}")

