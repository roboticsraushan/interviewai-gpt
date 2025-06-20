import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const API_BASE = process.env.REACT_APP_API_BASE;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

let mediaRecorder;
let stream;
let socket;

function InterviewSim() {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.on("transcript_update", ({ transcript, isFinal }) => {
      if (isFinal) {
        setFinalTranscript((prev) => prev + " " + transcript);
        setTranscript("");
      } else {
        setTranscript(transcript);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    setTranscript("");
    setFinalTranscript("");
    setResponse("");
    setIsRecording(true);

    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    socket.emit("start_transcription");

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          socket.emit("audio_chunk", base64data);
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.start(250);
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.ondataavailable = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    mediaRecorder = null;
    stream = null;
    socket.emit("stop_transcription");

    const finalText = finalTranscript.trim();
    if (!finalText) return;

    try {
      const res = await fetch(`${API_BASE}/onboarding/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalText }),
      });

      const data = await res.json();
      const reply =
        data?.profile?.summary || data?.echo || "No response from server";
      setResponse(reply);
      speakText(reply);
    } catch (error) {
      setResponse("Error connecting to backend.");
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ marginTop: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>🎙️ InterviewAI (Voice Mode)</h2>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}
      >
        {isRecording ? "🛑 Stop Recording" : "🎤 Start Speaking"}
      </button>

      <div style={{ marginTop: "1rem" }}>
        <strong>🗣️ Live Transcript:</strong>
        <div
          style={{ color: "#444", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}
        >
          {transcript || "(waiting...)"}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <strong>✅ Final Transcript:</strong>
        <div
          style={{ color: "#222", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}
        >
          {finalTranscript || "(waiting for input...)"}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>
        <strong>🤖 AI Response:</strong>
        <div
          style={{ color: "#0077cc", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}
        >
          {response || "(waiting for reply...)"}
        </div>
      </div>
    </div>
  );
}

export default InterviewSim;
