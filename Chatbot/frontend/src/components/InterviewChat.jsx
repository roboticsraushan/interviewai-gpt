import React, { useState, useRef, useEffect } from "react";
import micLogo from "../assets/mic_logo.png";
import jobs_logo from "../assets/jobs.png";
import einstein_logo from "../assets/einstein.png";
import VoiceSettings from "./VoiceSettings";

const InterviewChat = ({
  messages = [],
  isRecording,
  isConnected,
  onStartRecording,
  onStopRecording,
  currentTranscript = "",
  isAISpeaking = false,
  isProfilingComplete = false,
  profilingState = null,
  // Voice Activity Detection props
  isAutoModeEnabled = false,
  vadSettings = {},
  vadIsListening = false,
  vadIsSpeaking = false,
  audioLevel = 0,
  vadInitialized = false,
  onToggleAutoMode,
  onUpdateVadSettings,
  selectedVoice,
  onVoiceChange
}) => {
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);

  // Auto scroll to bottom when new messages arrive or when transcript updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentTranscript]);

  // Enhanced listening animation with VAD support
  useEffect(() => {
    if (isAutoModeEnabled) {
      // In auto mode, use VAD speaking state
      setIsListening(vadIsSpeaking);
      setIsProcessingTranscript(false);
    } else {
      // In manual mode, use recording state
      if (isRecording) {
        setIsListening(true);
        setIsProcessingTranscript(false);
      } else {
        const timer = setTimeout(() => {
          setIsListening(false);
          // Show processing state briefly after recording stops
          if (currentTranscript) {
            setIsProcessingTranscript(true);
            setTimeout(() => setIsProcessingTranscript(false), 3000);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isRecording, currentTranscript, isAutoModeEnabled, vadIsSpeaking]);

  const handleRecordingToggle = () => {
    // Only allow manual control when auto mode is disabled
    if (!isAutoModeEnabled) {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  // Helper function to get recording status message
  const getRecordingStatus = () => {
    if (isAISpeaking) return "AI is speaking...";
    if (isProcessingTranscript) return "Processing your response...";
    
    // Remove auto mode status messages
    if (!isConnected) return "Connecting...";
    if (isRecording) return "Listening... (Speak clearly)";
    return "Ready to listen";
  };

  // Helper function to get status color
  const getStatusColor = () => {
    if (isAISpeaking) return "text-purple-300";
    if (isProcessingTranscript) return "text-yellow-300";
    
    // Remove auto mode colors
    if (!isConnected) return "text-red-300";
    if (isRecording) return "text-green-300";
    return "text-gray-300";
  };

  // Helper function to get indicator color and animation
  const getIndicatorStyle = () => {
    if (isAISpeaking) return 'bg-purple-400 animate-pulse';
    if (isProcessingTranscript) return 'bg-yellow-400 animate-pulse';
    
    // Remove auto mode styles
    if (!isConnected) return 'bg-red-400';
    if (isRecording) return 'bg-green-400 animate-pulse';
    return 'bg-gray-400';
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col items-center px-4 py-4" 
         style={{ backgroundColor: 'black' }}>
      
      {/* Main Container - Horizontally Centered */}
      <div className="w-full max-w-4xl flex flex-col h-full max-h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 text-center py-6">
          <div className="flex items-center justify-center space-x-4 mb-2">
            {/* Profiling Status Indicator */}
            {!isProfilingComplete && (
              <div className="bg-yellow-500 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-200 font-medium">
                    Building your profile...
                  </span>
                </div>
              </div>
            )}
            {isProfilingComplete && (
              <div className="bg-green-500 bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-green-200 font-medium">
                    Profile complete - Interview ready!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Agent Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center py-4">
          <div className="relative flex items-center justify-center">
            {/* Animated border when AI is speaking */}
            <div className={`w-28 h-28 rounded-full p-1 transition-all duration-300 ${
              isAISpeaking 
                ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse shadow-2xl' 
                : 'bg-gradient-to-r from-gray-400 to-gray-600'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={einstein_logo}
                  alt="AI Agent"
                  className="w-full h-full rounded-full object-cover object-center"
                />
              </div>
            </div>
            
            {/* Voice indicator dots */}
            {isListening && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
          
          {/* <p className="text-gray-300 text-lg font-semibold mt-6">AI Agent</p> */}
        </div>

        {/* Chat Messages Container - Fixed Height Scrollable */}
        <div className="mx-4 mb-24" style={{ height: '250px' }}>
          <div 
            className="h-full border-2 border-gray-400 rounded-2xl bg-white flex flex-col overflow-hidden shadow-lg"
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-gray-300 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-700 text-sm font-medium">Interview Chat</h3>
                <div className="text-xs text-gray-500">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            {/* Scrollable Messages Container */}
            <div 
              className="flex-1 overflow-y-auto p-6 chat-scroll"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6',
                maxHeight: '100%'
              }}
            >
              {/* Messages in chronological order (oldest at top, newest at bottom) */}
              <div className="space-y-6">
                {/* Welcome message if no messages */}
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-600 text-lg mb-4">
                      🎙️ Ready to start your interview practice?
                    </div>
                    <div className="text-gray-500 text-sm">
                      Click the microphone button below to begin speaking
                    </div>
                  </div>
                )}

                {/* Current transcript bubble at bottom if recording */}
                {currentTranscript && (
                  <div className="flex justify-end">
                    <div className="flex items-start space-x-3 max-w-xs lg:max-w-md flex-row-reverse space-x-reverse">
                      <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">YOU</span>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-blue-500 text-white rounded-2xl rounded-tr-sm shadow-lg opacity-75">
                        <div className="text-xs text-blue-100 mb-1 font-medium flex items-center">
                          <span>{getRecordingStatus()}</span>
                          <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed">{currentTranscript}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

                {/* Fixed Bottom Microphone Button */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex flex-col items-center space-y-4">
            {/* Status Indicator */}
            <div className="bg-black bg-opacity-60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getIndicatorStyle()}`} />
                <span className={`text-xs font-medium ${getStatusColor()}`}>
                  {getRecordingStatus()}
                </span>
              </div>
            </div>
            
            {/* Helpful Tips - Show when not recording */}
            {!isRecording && !isAISpeaking && !isProcessingTranscript && (
              <div className="bg-blue-900 bg-opacity-40 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-600 max-w-xs">
                <div className="text-xs text-blue-200 text-center">
                  💡 <strong>Tip:</strong> Speak clearly, then wait 1-2 seconds before stopping recording for best results
                </div>
              </div>
            )}

            {/* Voice Settings */}
            <VoiceSettings
              currentVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              isAutoModeEnabled={isAutoModeEnabled}
              onToggleAutoMode={onToggleAutoMode}
              vadSettings={vadSettings}
              onUpdateVadSettings={onUpdateVadSettings}
              audioLevel={audioLevel}
              vadInitialized={vadInitialized}
            />
            
            {/* Microphone Button */}
            <button
              onClick={handleRecordingToggle}
              disabled={!isConnected}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${
                isRecording 
                  ? 'bg-red-500 bg-opacity-50 hover:bg-red-600 hover:bg-opacity-60 animate-pulse scale-105 shadow-red-500/30' 
                  : 'bg-blue-600 bg-opacity-50 hover:bg-blue-700 hover:bg-opacity-60 hover:scale-105 shadow-blue-600/30'
              } ${
                !isConnected 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-lg'
              }`}
            >
              <div className="w-full h-full flex items-center justify-center p-1">
                <img 
                  src={micLogo} 
                  alt={isRecording ? "Stop Recording" : "Start Recording"} 
                  className={`object-contain transition-all duration-300 ${
                    isRecording ? 'w-2 h-2 opacity-90' : 'w-3 h-3 opacity-80'
                  }`} 
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </div>
            </button>
            
            {/* Status Text */}
            <div className="bg-black bg-opacity-60 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-sm text-white font-medium text-center">
                {!isConnected ? (
                  "🔴 Connecting..."
                ) : isRecording ? (
                  "🎙️ Listening... Tap to stop"
                ) : (
                  "💬 Tap to start speaking"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status - Bottom Right */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-black bg-opacity-70 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-600">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {/* <span className="text-xs text-gray-300 font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span> */}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden !important;
          height: 100vh;
          max-height: 100vh;
          position: fixed;
          width: 100%;
        }
        
        #root {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden !important;
          position: fixed;
          width: 100%;
          top: 0;
          left: 0;
        }
        
        /* Custom scrollbar for chat container only */
        .chat-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default InterviewChat; 