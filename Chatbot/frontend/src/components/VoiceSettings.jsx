import React, { useState, useEffect } from 'react';

const VoiceSettings = ({ 
  onVoiceChange, 
  currentVoice = 'neural2_female_indian',
  isAutoModeEnabled = false,
  onToggleAutoMode,
  vadSettings = {},
  onUpdateVadSettings,
  audioLevel = 0,
  vadInitialized = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState({});
  const [localVadSettings, setLocalVadSettings] = useState({
    silenceThreshold: 2000,
    volumeThreshold: 0.015,
    ...vadSettings
  });

  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE}/tts/voices`);
        const data = await response.json();
        if (data.success) {
          setAvailableVoices(data.voices);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
      }
    };

    fetchVoices();
  }, []);

  // Update local settings when props change
  useEffect(() => {
    setLocalVadSettings(prev => ({
      ...prev,
      ...vadSettings
    }));
  }, [vadSettings]);

  const handleVadSettingChange = (setting, value) => {
    const newSettings = {
      ...localVadSettings,
      [setting]: value
    };
    setLocalVadSettings(newSettings);
    onUpdateVadSettings?.(newSettings);
  };

  const getVoiceDisplayName = (voiceKey) => {
    const voice = availableVoices[voiceKey];
    if (!voice) return voiceKey;
    
    const gender = voice.ssml_gender === 1 ? 'Male' : 'Female';
    const type = voiceKey.includes('neural2') ? 'Neural2' : 'WaveNet';
    return `${gender} ${type} (${voice.name})`;
  };

  // Audio level visualization
  const AudioLevelMeter = () => (
    <div className="mt-2">
      <div className="flex items-center space-x-2 text-xs text-gray-300">
        <span>Audio Level:</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              audioLevel > localVadSettings.volumeThreshold 
                ? 'bg-green-400' 
                : 'bg-gray-600'
            }`}
            style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
          />
        </div>
        <span className={`text-xs ${
          audioLevel > localVadSettings.volumeThreshold 
            ? 'text-green-400' 
            : 'text-gray-400'
        }`}>
          {(audioLevel * 100).toFixed(1)}%
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Threshold: {(localVadSettings.volumeThreshold * 100).toFixed(1)}%
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Settings Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 bg-opacity-60 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-300 font-medium">Voice Settings</span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-xl z-50">
          <div className="p-4 space-y-4">
            
            {/* Auto Mode Toggle - Hidden */}
            {false && (
              <div className="border-b border-gray-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    🎯 Auto Voice Mode
                  </label>
                  <button
                    onClick={onToggleAutoMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      isAutoModeEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        isAutoModeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {isAutoModeEnabled 
                    ? '✅ Automatically starts/stops recording when you speak'
                    : '❌ Manual mic button control (click to start/stop)'
                  }
                </p>
                {isAutoModeEnabled && vadInitialized && <AudioLevelMeter />}
              </div>
            )}

            {/* VAD Settings - Hidden */}
            {false && isAutoModeEnabled && (
              <div className="border-b border-gray-700 pb-4">
                <h4 className="text-sm font-medium text-white mb-3">🔇 Silence Detection Settings</h4>
                
                {/* Silence Threshold */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-300 mb-1">
                    Silence Timeout: {localVadSettings.silenceThreshold}ms
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={localVadSettings.silenceThreshold}
                    onChange={(e) => handleVadSettingChange('silenceThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5s (Quick)</span>
                    <span>5s (Patient)</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    How long to wait for silence before processing speech
                  </div>
                </div>

                {/* Volume Threshold */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-300 mb-1">
                    Voice Sensitivity: {(localVadSettings.volumeThreshold * 100).toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={localVadSettings.volumeThreshold}
                    onChange={(e) => handleVadSettingChange('volumeThreshold', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Very Sensitive</span>
                    <span>Less Sensitive</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Minimum voice level needed to detect speech
                  </div>
                </div>

                {/* Processing Delay */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-300 mb-1">
                    Processing Delay: {localVadSettings.processingDelay || 1500}ms
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="100"
                    value={localVadSettings.processingDelay || 1500}
                    onChange={(e) => handleVadSettingChange('processingDelay', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5s (Fast)</span>
                    <span>3s (Careful)</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Wait time after final transcript before processing
                  </div>
                </div>
              </div>
            )}

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                🗣️ AI Voice
              </label>
              <select
                value={currentVoice}
                onChange={(e) => onVoiceChange?.(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(availableVoices).map((voiceKey) => (
                  <option key={voiceKey} value={voiceKey}>
                    {getVoiceDisplayName(voiceKey)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Neural2 voices offer the highest quality
              </p>
            </div>

            {/* Status Indicators */}
            <div className="border-t border-gray-700 pt-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${vadInitialized ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-gray-300">
                    VAD: {vadInitialized ? 'Ready' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-300">
                    Mode: Manual
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
    </div>
  );
};

export default VoiceSettings; 