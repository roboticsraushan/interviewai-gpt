import threading
import queue
import base64
import time
from google.cloud import speech
from flask_socketio import SocketIO

audio_queue = queue.Queue()
speech_client = speech.SpeechClient()
streaming_config = speech.StreamingRecognitionConfig(
    config=speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=44100,
        language_code="en-US",
    ),
    interim_results=True,
)

def enqueue_audio_chunk(blob):
    audio_bytes = blob  # Could decode base64 or just raw binary from MediaRecorder
    audio_queue.put(audio_bytes)

def start_transcription_thread(socketio: SocketIO):
    def run():
        requests = (speech.StreamingRecognizeRequest(audio_content=chunk)
                    for chunk in iter(audio_queue.get, None))

        responses = speech_client.streaming_recognize(streaming_config, requests)

        for response in responses:
            if not response.results:
                continue

            result = response.results[0]
            text = result.alternatives[0].transcript
            is_final = result.is_final

            socketio.emit('transcript_update', {'text': text, 'isFinal': is_final})

    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()
