from flask import Blueprint
from flask_socketio import emit
import queue
import threading
import base64
import io
import os
import time

from google.cloud import speech_v1p1beta1 as speech

simulate_bp = Blueprint("simulate", __name__)

# Initialize Google Cloud Speech client
speech_client = speech.SpeechClient()

# Audio config for Google Cloud Speech-to-Text
recognition_config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
    sample_rate_hertz=16000,
    language_code="en-US",
    enable_automatic_punctuation=True,
    model="default",
)

streaming_config = speech.StreamingRecognitionConfig(
    config=recognition_config,
    interim_results=True,
)

# Thread-safe queue for incoming audio chunks
audio_queue = queue.Queue()

# Track background transcription thread
transcription_thread = None

# --- SocketIO real-time handlers ---

def register_socketio_handlers(socketio):
    @socketio.on("connect")
    def handle_connect():
        print("✅ WebSocket client connected")

    @socketio.on("disconnect")
    def handle_disconnect():
        print("❌ WebSocket client disconnected")

    @socketio.on("audio_chunk")
    def handle_audio_chunk(data):
        """
        Receives base64-encoded audio chunk from frontend and adds it to the queue.
        """
        print("\nReceived audio chunk  : ", type(data), len(data))
        audio_bytes = base64.b64decode(data)
        audio_queue.put(audio_bytes)

    @socketio.on("start_transcription")
    def start_transcription():
        """
        Starts a background thread that streams audio to GCP and sends back transcripts.
        """
        global transcription_thread
        if transcription_thread is None or not transcription_thread.is_alive():
            print("🧠 Starting transcription thread")
            transcription_thread = threading.Thread(target=transcribe_stream_background, args=(socketio,))
            transcription_thread.start()

# --- Streaming transcription task ---

def audio_generator():
    while True:
        chunk = audio_queue.get()
        print("🧠 sending chunk to gcp at",  time.time(), " size : ", len(chunk))
        yield speech.StreamingRecognizeRequest(audio_content=chunk)

def transcribe_stream_background(socketio):
    try:
        responses = speech_client.streaming_recognize(
            config=streaming_config,
            requests=audio_generator()
        )

        for response in responses:
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
    except Exception as e:
        print(f"❌ Transcription error: {e}")
