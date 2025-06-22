import React, { useState, useEffect } from 'react';

const VoiceSettings = ({ onVoiceChange, currentVoice = 'neural2_female_indian' }) => {
  const [voices, setVoices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testingVoice, setTestingVoice] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Voice display names and descriptions
  const VOICE_INFO = {
    neural2_female_indian: {
      name: 'Priya (Neural2)',
      description: 'Premium female Indian voice - highest quality',
      type: 'Neural2',
      gender: 'Female'
    },
    neural2_male_indian: {
      name: 'Arjun (Neural2)',
      description: 'Premium male Indian voice - highest quality',
      type: 'Neural2',
      gender: 'Male'
    },
    neural2_female_indian_2: {
      name: 'Meera (Neural2)',
      description: 'Alternative premium female Indian voice',
      type: 'Neural2',
      gender: 'Female'
    },
    neural2_male_indian_2: {
      name: 'Vikram (Neural2)',
      description: 'Alternative premium male Indian voice',
      type: 'Neural2',
      gender: 'Male'
    },
    wavenet_female_indian: {
      name: 'Kavya (WaveNet)',
      description: 'High-quality female Indian voice',
      type: 'WaveNet',
      gender: 'Female'
    },
    wavenet_male_indian: {
      name: 'Rohan (WaveNet)',
      description: 'High-quality male Indian voice',
      type: 'WaveNet',
      gender: 'Male'
    },
    wavenet_female_indian_2: {
      name: 'Ananya (WaveNet)',
      description: 'Alternative high-quality female Indian voice',
      type: 'WaveNet',
      gender: 'Female'
    },
    wavenet_male_indian_2: {
      name: 'Aditya (WaveNet)',
      description: 'Alternative high-quality male Indian voice',
      type: 'WaveNet',
      gender: 'Male'
    }
  };

  // Load available voices
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/tts/voices`);
        
        if (!response.ok) {
          throw new Error(`Failed to load voices: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setVoices(data.voices);
          console.log('✅ Loaded TTS voices:', Object.keys(data.voices));
        } else {
          throw new Error('Failed to load voices from API');
        }
      } catch (err) {
        console.error('❌ Error loading voices:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadVoices();
  }, [API_BASE]);

  // Test a voice
  const testVoice = async (voiceType) => {
    try {
      setIsTesting(true);
      setTestingVoice(voiceType);
      
      const testText = "Hello! I'm InterviewAI. This is how I'll sound during our interview practice session.";
      
      const response = await fetch(`${API_BASE}/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testText,
          voice_type: voiceType,
          speaking_rate: 0.9,
          format: 'base64'
        })
      });

      if (!response.ok) {
        throw new Error(`TTS test failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`TTS synthesis failed: ${data.error}`);
      }

      // Play the test audio
      const audioData = `data:audio/mpeg;base64,${data.audio_data}`;
      const audio = new Audio(audioData);
      
      audio.onended = () => {
        setIsTesting(false);
        setTestingVoice(null);
      };
      
      audio.onerror = (event) => {
        console.error('❌ Audio test playback error:', event);
        setIsTesting(false);
        setTestingVoice(null);
      };

      await audio.play();
      console.log(`🎤 Testing voice: ${voiceType}`);
      
    } catch (err) {
      console.error('❌ Error testing voice:', err);
      setIsTesting(false);
      setTestingVoice(null);
      setError(`Failed to test voice: ${err.message}`);
    }
  };

  // Handle voice selection
  const handleVoiceSelect = (voiceType) => {
    onVoiceChange(voiceType);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎙️ Voice Settings</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Loading voices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎙️ Voice Settings</h3>
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4">
          <p className="text-red-300">❌ {error}</p>
          <p className="text-red-200 text-sm mt-2">Using browser fallback voices instead.</p>
        </div>
      </div>
    );
  }

  const voiceTypes = Object.keys(voices);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🎙️ Voice Settings</h3>
      <p className="text-gray-300 text-sm mb-6">
        Choose your preferred AI voice for interview practice. All voices use Indian English accent.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {voiceTypes.map((voiceType) => {
          const voiceInfo = VOICE_INFO[voiceType] || {
            name: voiceType,
            description: 'Voice configuration',
            type: 'Unknown',
            gender: 'Unknown'
          };

          const isSelected = currentVoice === voiceType;
          const isTestingThis = testingVoice === voiceType;

          return (
            <div
              key={voiceType}
              className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650'
              }`}
              onClick={() => handleVoiceSelect(voiceType)}
            >
              {/* Voice Type Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  voiceInfo.type === 'Neural2' 
                    ? 'bg-purple-900 text-purple-200' 
                    : 'bg-blue-900 text-blue-200'
                }`}>
                  {voiceInfo.type} • {voiceInfo.gender}
                </span>
                
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>

              {/* Voice Info */}
              <h4 className="text-white font-medium mb-1">{voiceInfo.name}</h4>
              <p className="text-gray-300 text-sm mb-4">{voiceInfo.description}</p>

              {/* Test Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testVoice(voiceType);
                }}
                disabled={isTesting}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  isTesting && isTestingThis
                    ? 'bg-yellow-600 text-yellow-100 cursor-not-allowed'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                {isTesting && isTestingThis ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-200 mr-2"></div>
                    Playing...
                  </span>
                ) : (
                  '🔊 Test Voice'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {voiceTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">No voices available</p>
        </div>
      )}

      {/* Premium Voice Notice */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-900 to-blue-900 bg-opacity-50 rounded-lg border border-purple-500">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-3">✨</span>
          <h4 className="text-white font-medium">Premium AI Voices</h4>
        </div>
        <p className="text-purple-200 text-sm">
          You're using high-quality Google Cloud Text-to-Speech with Neural2 and WaveNet voices, 
          specifically trained for Indian English pronunciation and optimized for interview scenarios.
        </p>
      </div>
    </div>
  );
};

export default VoiceSettings; 