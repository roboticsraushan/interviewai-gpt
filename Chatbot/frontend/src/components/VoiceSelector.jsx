import React, { useState } from 'react';

const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Voice options with user-friendly names
  const voices = {
    'neural2_male_indian': { name: '🎭 Arjun', description: 'Male Indian (Premium)' },
    'neural2_female_indian': { name: '🎭 Priya', description: 'Female Indian (Premium)' },
    'neural2_male_indian_2': { name: '🎭 Vikram', description: 'Male Indian Alt (Premium)' },
    'neural2_female_indian_2': { name: '🎭 Meera', description: 'Female Indian Alt (Premium)' },
    'wavenet_male_indian': { name: '🎙️ Rohan', description: 'Male Indian (High Quality)' },
    'wavenet_female_indian': { name: '🎙️ Kavya', description: 'Female Indian (High Quality)' },
    'wavenet_male_indian_2': { name: '🎙️ Aditya', description: 'Male Indian Alt (High Quality)' },
    'wavenet_female_indian_2': { name: '🎙️ Ananya', description: 'Female Indian Alt (High Quality)' }
  };

  const currentVoice = voices[selectedVoice] || voices['neural2_male_indian'];

  return (
    <div className="relative">
      {/* Voice Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-all duration-200 border border-gray-600"
      >
        <span className="text-sm text-white">🗣️</span>
        <span className="text-white text-sm font-medium">
          {currentVoice.name}
        </span>
        <span className="text-gray-300 text-xs">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50">
          <div className="p-3 border-b border-gray-600">
            <h3 className="text-white text-sm font-medium">Choose AI Voice</h3>
            <p className="text-gray-400 text-xs mt-1">All voices use Indian English accent</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {Object.entries(voices).map(([voiceKey, voice]) => (
              <button
                key={voiceKey}
                onClick={() => {
                  onVoiceChange(voiceKey);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${
                  selectedVoice === voiceKey ? 'bg-blue-900 bg-opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {voice.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {voice.description}
                    </div>
                  </div>
                  {selectedVoice === voiceKey && (
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-600 bg-gray-750">
            <p className="text-xs text-gray-400">
              ✨ Premium Neural2 voices offer the highest quality
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector; 