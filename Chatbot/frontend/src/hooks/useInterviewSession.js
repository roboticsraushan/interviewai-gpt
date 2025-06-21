import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useUserProfiling } from './useUserProfiling';

const API_BASE = process.env.REACT_APP_API_BASE;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

export const useInterviewSession = () => {
  // User profiling hook
  const {
    profilingState,
    profileData,
    isProfilingComplete,
    processUserResponse,
    getCurrentQuestion,
    resetProfiling,
    PROFILING_STATES
  } = useUserProfiling();

  // State management
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [interviewContext, setInterviewContext] = useState(null);
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: getCurrentQuestion() || "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview. To give you the most personalized experience, I'd like to learn a bit about you first. This will only take 2-3 minutes. Are you ready to get started?",
      timestamp: Date.now()
    }
  ]);

  // Refs for persistent objects
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    console.log("🔌 Initializing socket connection...");
    
    const initializeSocket = () => {
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

      socketRef.current.on("profiling_completed", ({ success, profile, interview_context, error }) => {
        console.log("✅ Profiling completed:", { success, profile, interview_context });
        if (success) {
          setInterviewContext(interview_context);
          console.log("🎯 Interview context set:", interview_context);
        } else {
          console.error("❌ Profiling completion error:", error);
        }
      });
    };

    initializeSocket();

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
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn("⚠️ Error stopping MediaRecorder:", error);
      }
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.onerror = null;
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize audio context for mobile
  const initializeAudio = useCallback(() => {
    if (!audioInitialized) {
      console.log("🎵 Initializing audio for mobile...");
      
      // Create a silent audio context to enable audio on mobile
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        speechSynthesis.speak(utterance);
        speechSynthesis.cancel();
      }
      
      setAudioInitialized(true);
      console.log("✅ Audio initialized");
    }
  }, [audioInitialized]);

  const startRecording = async () => {
    console.log("🎤 Starting recording...");
    
    // Initialize audio on first user interaction (required for mobile)
    initializeAudio();
    
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
      cleanupMediaResources();

      // Reset states
      setTranscript("");
      setFinalTranscript("");
      setResponse("");
      setIsRecording(true);
      isRecordingRef.current = true;

      console.log("🎙️ Requesting microphone access...");
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Mobile-compatible MediaRecorder options
      const options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        options.mimeType = 'audio/aac';
      }
      
      console.log("🎙️ Using MediaRecorder with:", options);
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

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

      socketRef.current.emit("start_transcription");
      console.log("📡 Sent start_transcription signal");

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

    setIsRecording(false);
    isRecordingRef.current = false;

    if (socketRef.current) {
      socketRef.current.emit("stop_transcription");
      console.log("📡 Sent stop_transcription signal");
    }

    cleanupMediaResources();

    // Wait for final transcripts and process
    setTimeout(async () => {
      const finalText = finalTranscript.trim();
      console.log("📋 Processing final transcript:", finalText);
      
      if (!finalText) {
        console.warn("⚠️ No final transcript to process");
        return;
      }

      // Add user message to chat
      const userMessage = {
        type: 'user',
        content: finalText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      try {
        let reply;
        
        // Check if profiling is complete
        if (isProfilingComplete) {
          // Handle interview questions (existing logic)
          console.log("🚀 Sending interview request to backend...");
          const res = await fetch(`${API_BASE}/onboarding/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: finalText }),
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const data = await res.json();
          reply = data?.profile?.summary || data?.echo || "No response from server";
        } else {
          // Handle profiling flow
          console.log("👤 Processing profiling response...");
          reply = processUserResponse(finalText);
          
          // If profiling is now complete, send profile data to backend
          if (profilingState === PROFILING_STATES.COMPLETED && socketRef.current) {
            console.log("✅ Profiling completed, sending to backend...");
            socketRef.current.emit("complete_profiling", {
              profileData: profileData
            });
          }
        }
        
        if (reply) {
          console.log("🤖 AI response:", reply);
          setResponse(reply);
          
          // Add AI message to chat
          const aiMessage = {
            type: 'ai',
            content: reply,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiMessage]);
          
          speakText(reply);
        }
      } catch (error) {
        console.error("❌ Error processing response:", error);
        const errorMessage = "Error processing your response. Please try again.";
        setResponse(errorMessage);
        
        const aiMessage = {
          type: 'ai',
          content: errorMessage,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    }, 500);
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      console.warn("⚠️ Speech synthesis not supported");
      return;
    }

    console.log("🔊 Attempting to speak:", text);
    setIsAISpeaking(true);

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Mobile-specific: Wait for voices to load
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Mobile-optimized settings
      utterance.lang = "en-US";
      utterance.rate = 0.8; // Slightly slower for mobile
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a specific voice for better mobile compatibility
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer English voices
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.default
        ) || voices.find(voice => 
          voice.lang.startsWith('en')
        ) || voices[0];
        
        utterance.voice = englishVoice;
        console.log("🗣️ Using voice:", englishVoice.name);
      }
      
      utterance.onstart = () => {
        console.log("🔊 Started speaking");
        setIsAISpeaking(true);
      };
      
      utterance.onend = () => {
        console.log("🔇 Finished speaking");
        setIsAISpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error("❌ Speech synthesis error:", event.error);
        setIsAISpeaking(false);
        
        // Mobile fallback: Try again after a short delay
        if (event.error === 'network' || event.error === 'synthesis-failed') {
          console.log("🔄 Retrying speech synthesis...");
          setTimeout(() => {
            speechSynthesis.speak(utterance);
          }, 500);
        }
      };
      
      // Mobile-specific: Add a small delay before speaking
      setTimeout(() => {
        try {
          speechSynthesis.speak(utterance);
          console.log("🎤 Speech synthesis initiated");
        } catch (error) {
          console.error("❌ Failed to initiate speech:", error);
          setIsAISpeaking(false);
        }
      }, 100);
    };

    // Check if voices are loaded (important for mobile)
    if (speechSynthesis.getVoices().length === 0) {
      console.log("⏳ Waiting for voices to load...");
      speechSynthesis.addEventListener('voiceschanged', speak, { once: true });
      
      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(() => {
        if (speechSynthesis.getVoices().length === 0) {
          console.log("⚠️ No voices loaded, attempting anyway...");
        }
        speak();
      }, 1000);
    } else {
      speak();
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

  return {
    // State
    transcript,
    finalTranscript,
    response,
    isRecording,
    isConnected,
    isAISpeaking,
    audioInitialized,
    messages,
    
    // Profiling state
    profilingState,
    profileData,
    isProfilingComplete,
    interviewContext,
    
    // Actions
    startRecording,
    stopRecording,
    speakText,
    initializeAudio,
    resetProfiling
  };
}; 