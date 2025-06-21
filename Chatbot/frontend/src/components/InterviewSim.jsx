import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

const API_BASE = process.env.REACT_APP_API_BASE;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

function InterviewSim() {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to store mutable objects that persist across renders
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    console.log("🔌 Initializing socket connection...");
    
    const initializeSocket = () => {
      // Clean up existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected");
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setIsConnected(false);
      });

      socketRef.current.on("transcript_update", ({ transcript, isFinal }) => {
        console.log(`📝 Transcript update (${isFinal ? 'final' : 'interim'}):`, transcript);
        
        if (isFinal) {
          setFinalTranscript((prev) => {
            const newFinal = prev ? prev + " " + transcript : transcript;
            console.log("📋 Final transcript updated:", newFinal);
            return newFinal;
          });
          setTranscript("");
        } else {
          setTranscript(transcript);
        }
      });
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket connection...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Clean up media resources
  const cleanupMediaResources = useCallback(() => {
    console.log("🧹 Cleaning up media resources...");
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn("⚠️ Error stopping MediaRecorder:", error);
      }
    }

    // Clean up event handlers
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    console.log("🎤 Starting recording...");
    
    if (!socketRef.current || !isConnected) {
      console.error("❌ Socket not connected");
      alert("Connection error. Please refresh the page.");
      return;
    }

    if (isRecordingRef.current) {
      console.warn("⚠️ Already recording, ignoring start request");
      return;
    }

    try {
      // Clean up any existing resources first
      cleanupMediaResources();

      // Reset states
      setTranscript("");
      setFinalTranscript("");
      setResponse("");
      setIsRecording(true);
      isRecordingRef.current = true;

      // Get user media
      console.log("🎙️ Requesting microphone access...");
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current && socketRef.current) {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64data = reader.result.split(",")[1];
              if (socketRef.current && isRecordingRef.current) {
                socketRef.current.emit("audio_chunk", base64data);
                console.log("📤 Sent audio chunk:", base64data.length, "chars");
              }
            } catch (error) {
              console.error("❌ Error processing audio chunk:", error);
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("🛑 MediaRecorder stopped");
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event.error);
      };

      // Start transcription on backend
      socketRef.current.emit("start_transcription");
      console.log("📡 Sent start_transcription signal");

      // Start recording with 250ms chunks
      mediaRecorderRef.current.start(250);
      console.log("✅ Recording started successfully");

    } catch (error) {
      console.error("❌ Error starting recording:", error);
      setIsRecording(false);
      isRecordingRef.current = false;
      cleanupMediaResources();
      
      if (error.name === 'NotAllowedError') {
        alert("Microphone access denied. Please allow microphone access and try again.");
      } else {
        alert("Error starting recording. Please try again.");
      }
    }
  };

  const stopRecording = async () => {
    console.log("🛑 Stopping recording...");
    
    if (!isRecordingRef.current) {
      console.warn("⚠️ Not recording, ignoring stop request");
      return;
    }

    // Update states immediately
    setIsRecording(false);
    isRecordingRef.current = false;

    // Stop transcription on backend first
    if (socketRef.current) {
      socketRef.current.emit("stop_transcription");
      console.log("📡 Sent stop_transcription signal");
    }

    // Clean up media resources
    cleanupMediaResources();

    // Wait a moment for final transcripts to arrive
    setTimeout(async () => {
      const finalText = finalTranscript.trim();
      console.log("📋 Processing final transcript:", finalText);
      
      if (!finalText) {
        console.warn("⚠️ No final transcript to process");
        return;
      }

      try {
        console.log("🚀 Sending request to backend...");
        const res = await fetch(`${API_BASE}/onboarding/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: finalText }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        const reply = data?.profile?.summary || data?.echo || "No response from server";
        console.log("🤖 Received AI response:", reply);
        
        setResponse(reply);
        speakText(reply);
      } catch (error) {
        console.error("❌ Error connecting to backend:", error);
        setResponse("Error connecting to backend. Please try again.");
      }
    }, 500); // Give some time for final transcripts to arrive
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => console.log("🔊 Started speaking");
      utterance.onend = () => console.log("🔇 Finished speaking");
      utterance.onerror = (event) => console.error("❌ Speech synthesis error:", event.error);
      
      speechSynthesis.speak(utterance);
    } else {
      console.warn("⚠️ Speech synthesis not supported");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaResources();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [cleanupMediaResources]);

  return (
    <div style={{ marginTop: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>🎙️ InterviewAI (Voice Mode)</h2>
      
      <div style={{ marginBottom: "1rem" }}>
        <span style={{ 
          color: isConnected ? "green" : "red", 
          fontSize: "0.9rem",
          fontWeight: "bold"
        }}>
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </span>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!isConnected}
        style={{ 
          padding: "0.5rem 1rem", 
          marginBottom: "1rem",
          backgroundColor: isRecording ? "#dc3545" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isConnected ? "pointer" : "not-allowed",
          opacity: isConnected ? 1 : 0.6
        }}
      >
        {isRecording ? "🛑 Stop Recording" : "🎤 Start Speaking"}
      </button>

      <div style={{ marginTop: "1rem" }}>
        <strong>🗣️ Live Transcript:</strong>
        <div
          style={{ 
            color: "#444", 
            marginTop: "0.5rem", 
            whiteSpace: "pre-wrap",
            minHeight: "20px",
            fontStyle: transcript ? "normal" : "italic"
          }}
        >
          {transcript || "(waiting...)"}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <strong>✅ Final Transcript:</strong>
        <div
          style={{ 
            color: "#222", 
            marginTop: "0.5rem", 
            whiteSpace: "pre-wrap",
            minHeight: "20px",
            fontStyle: finalTranscript ? "normal" : "italic"
          }}
        >
          {finalTranscript || "(waiting for input...)"}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>
        <strong>🤖 AI Response:</strong>
        <div
          style={{ 
            color: "#0077cc", 
            marginTop: "0.5rem", 
            whiteSpace: "pre-wrap",
            minHeight: "20px",
            fontStyle: response ? "normal" : "italic"
          }}
        >
          {response || "(waiting for reply...)"}
        </div>
      </div>
    </div>
  );
}

export default InterviewSim;
