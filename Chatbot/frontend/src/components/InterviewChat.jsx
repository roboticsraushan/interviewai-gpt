import React, { useState, useRef, useEffect } from "react";
import micLogo from "../assets/mic_logo.png";
import jobs_logo from "../assets/jobs.png";
import einstein_logo from "../assets/einstein.png";

const InterviewChat = ({
  messages = [],
  isRecording,
  isConnected,
  onStartRecording,
  onStopRecording,
  currentTranscript = "",
  isAISpeaking = false
}) => {
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate listening animation
  useEffect(() => {
    if (isRecording) {
      setIsListening(true);
    } else {
      const timer = setTimeout(() => setIsListening(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  // Reverse messages for newest at ai
  const reversedMessages = [...messages].reverse();

  return (
    <div className="min-h-screen max-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-8" 
         style={{ backgroundColor: 'black' }}>
      
      {/* Main Container - Horizontally Centered */}
      <div className="w-full max-w-4xl flex flex-col h-full">
        
        {/* Header */}
        <div className="flex-shrink-0 text-center py-6">
          <div className="flex items-center justify-center space-x-4 mb-2">
            {/* Header content removed - connection status moved to bottom right */}
          </div>
        </div>

        {/* AI Agent Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center py-8">
          <div className="relative flex items-center justify-center">
            {/* Animated border when AI is speaking */}
            <div className={`w-36 h-36 rounded-full p-1 transition-all duration-300 ${
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

        {/* Chat Messages Container - Bordered and Scrollable */}
        <div className="flex-1 mx-4 mb-24">
          <div 
            className="h-full border-2 border-gray-600 rounded-2xl bg-gray-800 bg-opacity-50 backdrop-blur-sm overflow-y-auto p-6"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #374151'
            }}
          >
            {/* Messages in reverse chronological order (newest at top) */}
            <div className="space-y-6">
              {/* Current transcript bubble at top if recording */}
              {currentTranscript && (
                                 <div className="flex justify-end">
                   <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                     <div className="flex-shrink-0 flex items-center justify-center">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                         <span className="text-white text-xs font-bold">YOU</span>
                       </div>
                     </div>
                    <div className="px-4 py-3 bg-blue-500 text-white rounded-2xl rounded-tr-sm shadow-lg opacity-75">
                      <div className="text-xs text-blue-100 mb-1 font-medium flex items-center">
                        <span>YOU (speaking...)</span>
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

            
              
              {/* Welcome message if no messages */}
              {reversedMessages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">
                    🎙️ Ready to start your interview practice?
                  </div>
                  <div className="text-gray-500 text-sm">
                    Click the microphone button below to begin speaking
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

                {/* Fixed Bottom Microphone Button */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex flex-col items-center space-y-4">
            {/* Microphone Button */}
            <button
              onClick={handleRecordingToggle}
              disabled={!isConnected}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform ${
                isRecording 
                  ? 'bg-red-500 bg-opacity-50 hover:bg-red-600 hover:bg-opacity-60 animate-pulse scale-105 shadow-red-500/30' 
                  : 'bg-blue-600 bg-opacity-50 hover:bg-blue-700 hover:bg-opacity-60 hover:scale-105 shadow-blue-600/30'
              } ${!isConnected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
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
          overflow: hidden;
          height: 100vh;
          max-height: 100vh;
        }
        
        #root {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
};

export default InterviewChat; 