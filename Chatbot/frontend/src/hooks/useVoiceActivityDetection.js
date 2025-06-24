import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceActivityDetection = ({
  onSpeechStart,
  onSpeechEnd,
  isEnabled = false,
  silenceThreshold = 1500, // ms of silence before stopping
  volumeThreshold = 0.01,  // minimum volume to detect speech
  smoothingTimeConstant = 0.8,
  fftSize = 2048,
  externalStream = null // Accept external media stream to avoid mic conflicts
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for persistent objects
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const lastSpeechTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const consecutiveSilenceFrames = useRef(0);
  const consecutiveSpeechFrames = useRef(0);

  // Initialize audio context and analyzer
  const initializeAudio = useCallback(async () => {
    try {
      console.log("🎙️ Initializing Voice Activity Detection...");
      
      let stream;
      if (externalStream) {
        console.log("🔄 Using shared microphone stream for VAD");
        stream = externalStream;
      } else {
        console.log("🎙️ Requesting new microphone access for VAD");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          }
        });
      }

      if (!externalStream) {
        mediaStreamRef.current = stream;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsInitialized(true);
      console.log("✅ Voice Activity Detection initialized");
      
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize VAD:", error);
      return false;
    }
  }, [fftSize, smoothingTimeConstant, externalStream]);

  // Calculate audio level from frequency data
  const calculateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return 0;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    const length = dataArrayRef.current.length;
    
    // Focus on speech frequency range (85Hz - 255Hz)
    const speechStart = Math.floor(85 * length / (audioContextRef.current.sampleRate / 2));
    const speechEnd = Math.floor(255 * length / (audioContextRef.current.sampleRate / 2));
    
    for (let i = speechStart; i < speechEnd; i++) {
      sum += dataArrayRef.current[i] * dataArrayRef.current[i];
    }
    
    const rms = Math.sqrt(sum / (speechEnd - speechStart));
    return rms / 255; // Normalize to 0-1
  }, []);

  // Main VAD processing loop with improved speech/silence detection
  const processAudio = useCallback(() => {
    if (!isEnabled || !isInitialized) {
      consecutiveSilenceFrames.current = 0;
      consecutiveSpeechFrames.current = 0;
      return;
    }

    const currentLevel = calculateAudioLevel();
    setAudioLevel(currentLevel);

    const now = Date.now();
    const isSpeechDetected = currentLevel > volumeThreshold;

    if (isSpeechDetected) {
      consecutiveSpeechFrames.current++;
      consecutiveSilenceFrames.current = 0;
      lastSpeechTimeRef.current = now;

      // Require multiple frames of speech before triggering speech start
      if (consecutiveSpeechFrames.current >= 3 && !isSpeakingRef.current) {
        console.log("🗣️ Speech detected - Level:", currentLevel.toFixed(4));
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        onSpeechStart?.();

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    } else {
      consecutiveSilenceFrames.current++;
      consecutiveSpeechFrames.current = 0;

      if (isSpeakingRef.current) {
        const silenceDuration = now - lastSpeechTimeRef.current;
        
        // Require consistent silence before stopping
        if (consecutiveSilenceFrames.current >= 10 && silenceDuration > silenceThreshold) {
          console.log(`🤫 Silence detected for ${silenceDuration}ms - Level: ${currentLevel.toFixed(4)}`);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          onSpeechEnd?.();
          consecutiveSilenceFrames.current = 0;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [isEnabled, isInitialized, calculateAudioLevel, volumeThreshold, silenceThreshold, onSpeechStart, onSpeechEnd]);

  // Start VAD
  const startVAD = useCallback(async () => {
    if (isListening) return;

    console.log("🎯 Starting Voice Activity Detection...");
    
    const initialized = await initializeAudio();
    if (!initialized) return;

    setIsListening(true);
    processAudio();
  }, [isListening, initializeAudio, processAudio]);

  // Stop VAD
  const stopVAD = useCallback(() => {
    console.log("🛑 Stopping Voice Activity Detection...");
    
    setIsListening(false);
    setIsSpeaking(false);
    setIsInitialized(false);
    isSpeakingRef.current = false;
    consecutiveSilenceFrames.current = 0;
    consecutiveSpeechFrames.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current && !externalStream) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, [externalStream]);

  // Auto start/stop based on isEnabled
  useEffect(() => {
    if (isEnabled && !isListening) {
      startVAD();
    } else if (!isEnabled && isListening) {
      stopVAD();
    }

    return () => {
      if (isListening) {
        stopVAD();
      }
    };
  }, [isEnabled, isListening, startVAD, stopVAD]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, [stopVAD]);

  return {
    isListening,
    isSpeaking,
    audioLevel,
    isInitialized,
    startVAD,
    stopVAD
  };
}; 