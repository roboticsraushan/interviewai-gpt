import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceActivityDetection = () => {
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [vadEnabled, setVadEnabled] = useState(true);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const voiceStartTimeoutRef = useRef(null);
  
  // Configuration
  const SILENCE_THRESHOLD = -50; // dB threshold for silence
  const VOICE_START_DELAY = 300; // ms delay before starting recording
  const SILENCE_DURATION = 1500; // ms of silence before stopping
  const ANALYSIS_INTERVAL = 100; // ms between audio analysis

  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current) return -100;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Convert to decibels
    const decibels = 20 * Math.log10(rms / 255);
    return decibels;
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!vadEnabled || !analyserRef.current) return;
    
    const audioLevel = getAudioLevel();
    const isVoiceActive = audioLevel > SILENCE_THRESHOLD;
    
    if (isVoiceActive && !isVoiceDetected) {
      // Voice detected - start countdown to begin recording
      if (!voiceStartTimeoutRef.current) {
        voiceStartTimeoutRef.current = setTimeout(() => {
          setIsVoiceDetected(true);
          console.log('🎤 Voice detected - starting recording');
        }, VOICE_START_DELAY);
      }
      
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    } else if (!isVoiceActive && isVoiceDetected) {
      // Silence detected - start countdown to stop recording
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          setIsVoiceDetected(false);
          console.log('🔇 Silence detected - stopping recording');
        }, SILENCE_DURATION);
      }
      
      // Clear voice start timeout
      if (voiceStartTimeoutRef.current) {
        clearTimeout(voiceStartTimeoutRef.current);
        voiceStartTimeoutRef.current = null;
      }
    } else if (isVoiceActive && isVoiceDetected) {
      // Continue voice - clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }

    // Schedule next analysis
    animationFrameRef.current = setTimeout(analyzeAudio, ANALYSIS_INTERVAL);
  }, [vadEnabled, isVoiceDetected, getAudioLevel]);

  const startVAD = useCallback(async () => {
    try {
      console.log('🎙️ Starting Voice Activity Detection...');
      
      // Get microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Connect audio stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);
      
      setIsListening(true);
      
      // Start audio analysis
      analyzeAudio();
      
      console.log('✅ Voice Activity Detection started');
    } catch (error) {
      console.error('❌ Error starting VAD:', error);
      setIsListening(false);
    }
  }, [analyzeAudio]);

  const stopVAD = useCallback(() => {
    console.log('🛑 Stopping Voice Activity Detection...');
    
    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (voiceStartTimeoutRef.current) {
      clearTimeout(voiceStartTimeoutRef.current);
      voiceStartTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsListening(false);
    setIsVoiceDetected(false);
    
    console.log('✅ Voice Activity Detection stopped');
  }, []);

  const toggleVAD = useCallback(() => {
    setVadEnabled(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVAD();
    };
  }, [stopVAD]);

  // Auto-start VAD when enabled
  useEffect(() => {
    if (vadEnabled && !isListening) {
      startVAD();
    } else if (!vadEnabled && isListening) {
      stopVAD();
    }
  }, [vadEnabled, isListening, startVAD, stopVAD]);

  return {
    // State
    isVoiceDetected,
    isListening,
    vadEnabled,
    
    // Actions
    startVAD,
    stopVAD,
    toggleVAD,
    
    // Utils
    getAudioLevel: vadEnabled ? getAudioLevel : () => -100
  };
}; 