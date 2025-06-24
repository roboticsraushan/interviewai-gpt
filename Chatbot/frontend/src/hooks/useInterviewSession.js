import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useSimpleProfiling } from './useSimpleProfiling';
import { useVoiceActivityDetection } from './useVoiceActivityDetection';

const API_BASE = process.env.REACT_APP_API_BASE;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

export const useInterviewSession = () => {
  // Python-controlled profiling hook (super simple!)
  const {
    profilingState,
    profileData,
    isProfilingComplete,
    processUserResponse,
    getCurrentQuestion,
    resetProfiling,
    messages: profilingMessages,
    sessionId: profilingSessionId,
    isLoading: isProfilingLoading,
    error: profilingError,
    instructions: pythonInstructions
  } = useSimpleProfiling();

  // State management
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [interviewContext, setInterviewContext] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('neural2_male_indian');
  
  // Voice Activity Detection settings
  const [isAutoModeEnabled, setIsAutoModeEnabled] = useState(false);
  const [vadSettings, setVadSettings] = useState({
    silenceThreshold: 2000, // 2 seconds of silence
    volumeThreshold: 0.015, // Slightly higher threshold for reliability
    smoothingTimeConstant: 0.8,
    fftSize: 2048,
    processingDelay: 1500 // Wait time after final transcript before processing
  });

  // Python controls all messages - we just use them directly
  const messages = profilingMessages;

  // Refs for persistent objects
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);
  const autoRecordingRef = useRef(false); // Track if we're in auto recording mode

  // Voice Activity Detection integration
  const {
    isListening: vadIsListening,
    isSpeaking: vadIsSpeaking,
    audioLevel,
    isInitialized: vadInitialized
  } = useVoiceActivityDetection({
    isEnabled: isAutoModeEnabled && !isAISpeaking, // Enable when auto mode is on and AI isn't speaking
    silenceThreshold: vadSettings.silenceThreshold,
    volumeThreshold: vadSettings.volumeThreshold,
    smoothingTimeConstant: vadSettings.smoothingTimeConstant,
    fftSize: vadSettings.fftSize,
    onSpeechStart: () => {
      console.log("🎯 VAD: Speech detected - Starting recording");
      if (!isRecordingRef.current && !isAISpeaking) {
        startRecording(true);
      }
    },
    onSpeechEnd: () => {
      console.log("🎯 VAD: Speech ended - Stopping recording");
      if (isRecordingRef.current) {
        stopRecording(true);
      }
    }
  });

  // Remove the auto-resume effect since VAD will handle this
  useEffect(() => {
    if (!isAutoModeEnabled || isAISpeaking) {
      if (isRecordingRef.current && autoRecordingRef.current) {
        console.log("🎯 Auto mode: Stopping recording due to state change");
        stopRecording(true);
        autoRecordingRef.current = false;
      }
    }
  }, [isAutoModeEnabled, isAISpeaking]);

  // Modify the auto mode effect to let VAD handle recording
  useEffect(() => {
    if (!isAutoModeEnabled && autoRecordingRef.current) {
      console.log("🎯 Auto mode disabled: Stopping recording");
      autoRecordingRef.current = false;
      if (isRecordingRef.current) {
        stopRecording(true);
      }
    } else if (isAutoModeEnabled) {
      console.log("🎯 Auto mode enabled: VAD will control recording");
      autoRecordingRef.current = true;
    }
  }, [isAutoModeEnabled]);

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
          setTranscript(""); // Clear interim transcript
          
          // In auto mode, process final transcripts after a short delay
          if (isAutoModeEnabled && autoRecordingRef.current && transcript.trim()) {
            console.log("🎯 Auto mode: Final transcript received, will process after delay");
            const processingDelay = vadSettings.processingDelay || 1500;
            setTimeout(() => {
              console.log("🎯 Auto mode: Processing final transcript:", transcript);
              processTranscriptInAutoMode(transcript);
            }, processingDelay); // Use configurable delay
          }
        } else {
          // Only update interim transcript if we're still recording
          if (isRecordingRef.current) {
            setTranscript(transcript);
          }
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

  // Process transcript in auto mode without stopping recording
  const processTranscriptInAutoMode = async (transcriptText) => {
    console.log("🎯🎯🎯 processTranscriptInAutoMode CALLED with:", transcriptText);
    console.log("🔍 Current state - isProfilingComplete:", isProfilingComplete, "isAutoModeEnabled:", isAutoModeEnabled);
    
    const textToProcess = transcriptText.trim();
    
    if (!textToProcess) {
      console.warn("⚠️ No transcript text to process in auto mode");
      return;
    }

    console.log("🎯 Auto mode: Processing transcript:", textToProcess);

    try {
      let reply;
      
      // Check if profiling is complete
      if (isProfilingComplete) {
        // Handle interview questions (existing logic)
        console.log("🚀 Auto mode: Sending interview request to backend...");
        const res = await fetch(`${API_BASE}/onboarding/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToProcess }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        reply = data?.profile?.summary || data?.echo || "No response from server";
      } else {
        // Handle profiling flow
        console.log("👤 Auto mode: Processing profiling response...");
        reply = await processUserResponse(textToProcess);
        
        // If profiling is now complete, send profile data to backend
        if (isProfilingComplete && socketRef.current) {
          console.log("✅ Auto mode: Profiling completed, sending to backend...");
          socketRef.current.emit("complete_profiling", {
            profileData: profileData
          });
        }
      }
      
      if (reply) {
        console.log("🤖 Auto mode: AI response:", reply);
        setResponse(reply);
        
        // Speak the response (isAISpeaking will be set automatically)
        await speakText(reply);
        // Note: Recording will automatically resume when isAISpeaking becomes false
        // due to the auto-resume effect we have
      }
    } catch (error) {
      console.error("❌ Auto mode: Error processing response:", error);
      const errorMessage = "I encountered an error processing your response. Please try again.";
      setResponse(errorMessage);
      await speakText(errorMessage);
    }
  };

  const startRecording = async (autoStart = false) => {
    console.log("🎤 Starting recording...");
    
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

  const stopRecording = async (autoStop = false) => {
    console.log("🛑 Stopping recording...");
    
    if (!isRecordingRef.current) {
      console.warn("⚠️ Not recording, ignoring stop request");
      return;
    }

    // Set recording state to false immediately for UI feedback
    setIsRecording(false);
    isRecordingRef.current = false;
    
    console.log("⏳ Entering grace period for final transcript processing...");

    if (socketRef.current) {
      socketRef.current.emit("prepare_stop_transcription");
      console.log("📡 Sent prepare_stop_transcription signal");
      
      // Wait for any interim transcript to potentially become final
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      socketRef.current.emit("stop_transcription");
      console.log("📡 Sent stop_transcription signal");
    }

    // Clean up media resources after a delay to allow final processing
    setTimeout(() => {
      cleanupMediaResources();
    }, 500);

    // Process final transcript
    setTimeout(() => {
      const finalText = finalTranscript.trim();
      const interimText = transcript.trim();
      
      if (finalText || interimText) {
        const textToProcess = finalText || interimText;
        console.log("✅ Processing final transcript:", textToProcess);
        
        if (isAutoModeEnabled) {
          processTranscriptInAutoMode(textToProcess);
        } else {
          processFinalTranscript(textToProcess);
        }
      } else {
        console.warn("⚠️ No transcript available");
      }
    }, 1200);
  };

  // Add the processFinalTranscript function definition
  const processFinalTranscript = async (textToProcess) => {
    if (!textToProcess) {
      console.warn("⚠️ No text to process");
      setResponse("I didn't catch that. Could you please repeat?");
      await speakText("I didn't catch that. Could you please repeat?");
      return;
    }

    console.log("✅ Processing transcript:", textToProcess);

    try {
      let reply;
      
      // Check if profiling is complete
      if (isProfilingComplete) {
        // Handle interview questions
        console.log("🚀 Sending interview request to backend...");
        const res = await fetch(`${API_BASE}/onboarding/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToProcess }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        reply = data?.profile?.summary || data?.echo || "No response from server";
      } else {
        // Handle profiling flow
        console.log("👤 Processing profiling response...");
        reply = await processUserResponse(textToProcess);
        
        // If profiling is now complete, send profile data to backend
        if (isProfilingComplete && socketRef.current) {
          console.log("✅ Profiling completed, sending to backend...");
          socketRef.current.emit("complete_profiling", {
            profileData: profileData
          });
        }
      }
      
      if (reply) {
        console.log("🤖 AI response:", reply);
        setResponse(reply);
        await speakText(reply);
      }
    } catch (error) {
      console.error("❌ Error processing response:", error);
      const errorMessage = "I encountered an error processing your response. Please try again.";
      setResponse(errorMessage);
      await speakText(errorMessage);
    }
  };

  const speakText = async (text) => {
    console.log("🔊 Attempting to speak with GCP TTS:", text);
    console.log("🔍 Text type:", typeof text, "Length:", text?.length);
    console.log("🔍 Text content (first 200 chars):", text?.substring(0, 200));
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn("⚠️ Invalid text for TTS:", text);
      setIsAISpeaking(false);
      return;
    }
    
    setIsAISpeaking(true);

    try {
      // Call backend TTS service
      const response = await fetch(`${API_BASE}/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice_type: selectedVoice, // Use user-selected voice
          speaking_rate: 0.9,
          pitch: 0.0,
          volume_gain_db: 0.0,
          format: 'base64'
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`TTS synthesis failed: ${data.error}`);
      }

      console.log("✅ GCP TTS synthesis successful");
      
      // Convert base64 to audio and play
      const audioData = `data:audio/mpeg;base64,${data.audio_data}`;
      const audio = new Audio(audioData);
      
      // Set up audio event handlers
      audio.onloadstart = () => {
        console.log("🔊 Audio loading started");
      };
      
      audio.oncanplaythrough = () => {
        console.log("🔊 Audio ready to play");
      };
      
      audio.onplay = () => {
        console.log("🔊 Started playing GCP TTS audio");
        setIsAISpeaking(true);
      };
      
      audio.onended = () => {
        console.log("🔇 Finished playing GCP TTS audio");
        setIsAISpeaking(false);
      };
      
      audio.onerror = (event) => {
        console.error("❌ Audio playback error:", event);
        setIsAISpeaking(false);
        
        // Fallback to browser speech synthesis
        console.log("🔄 Falling back to browser TTS...");
        fallbackToWebSpeech(text);
      };

      // Play the audio
      try {
        await audio.play();
        console.log("🎤 GCP TTS audio playback initiated");
      } catch (playError) {
        console.error("❌ Failed to play audio:", playError);
        setIsAISpeaking(false);
        
        // Fallback to browser speech synthesis
        console.log("🔄 Falling back to browser TTS...");
        fallbackToWebSpeech(text);
      }
      
    } catch (error) {
      console.error("❌ GCP TTS error:", error);
      setIsAISpeaking(false);
      
      // Fallback to browser speech synthesis
      console.log("🔄 Falling back to browser TTS...");
      fallbackToWebSpeech(text);
    }
  };

  // Fallback function for browser speech synthesis
  const fallbackToWebSpeech = (text) => {
    if (!('speechSynthesis' in window)) {
      console.warn("⚠️ Speech synthesis not supported");
      setIsAISpeaking(false);
      return;
    }

    console.log("🔊 Using browser TTS fallback:", text);
    setIsAISpeaking(true);

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN"; // Use Indian English
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find an Indian English voice
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      const indianVoice = voices.find(voice => 
        voice.lang === 'en-IN' || voice.lang.startsWith('en-IN')
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('india')
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && voice.default
      ) || voices[0];
      
      utterance.voice = indianVoice;
      console.log("🗣️ Using fallback voice:", indianVoice?.name || 'default');
    }

    utterance.onstart = () => {
      console.log("🔊 Started fallback TTS");
      setIsAISpeaking(true);
    };

    utterance.onend = () => {
      console.log("🔇 Finished fallback TTS");
      setIsAISpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("❌ Fallback TTS error:", event.error);
      setIsAISpeaking(false);
    };

    try {
      speechSynthesis.speak(utterance);
      console.log("🎤 Fallback TTS initiated");
    } catch (error) {
      console.error("❌ Failed to initiate fallback TTS:", error);
      setIsAISpeaking(false);
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

  // Toggle auto mode
  const toggleAutoMode = useCallback(() => {
    setIsAutoModeEnabled(prev => {
      const newValue = !prev;
      console.log(`🎯 Auto mode ${newValue ? 'enabled' : 'disabled'}`);
      
      // If disabling auto mode while recording, stop recording
      if (!newValue && isRecordingRef.current && autoRecordingRef.current) {
        stopRecording(true);
        autoRecordingRef.current = false;
      }
      
      return newValue;
    });
  }, []);

  // Update VAD settings
  const updateVadSettings = useCallback((newSettings) => {
    setVadSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  useEffect(() => {
    if (isAutoModeEnabled && !isAISpeaking) {
      if (vadIsSpeaking && !isRecordingRef.current) {
        startRecording(true);
      } else if (!vadIsSpeaking && isRecordingRef.current) {
        stopRecording(true);
      }
    }
  }, [vadIsSpeaking, isAutoModeEnabled, isAISpeaking]);

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
    selectedVoice,
    
    // Profiling state
    profilingState,
    profileData,
    isProfilingComplete,
    interviewContext,
    
    // Voice Activity Detection state
    isAutoModeEnabled,
    vadSettings,
    vadIsListening,
    vadIsSpeaking,
    audioLevel,
    vadInitialized,
    
    // Actions
    startRecording,
    stopRecording,
    speakText,
    initializeAudio,
    resetProfiling,
    setSelectedVoice,
    toggleAutoMode,
    updateVadSettings,
    
    // Python instructions
    pythonInstructions,
    
    // Loading/Error states
    isProfilingLoading,
    profilingError
  };
}; 