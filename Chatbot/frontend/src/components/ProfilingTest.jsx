import React, { useState } from 'react';

const ProfilingTest = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const startProfiling = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/profiling/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session_id);
        setMessages([{ type: 'ai', content: data.message }]);
        console.log('✅ Profiling session started:', data.session_id);
      } else {
        console.error('❌ Failed to start profiling:', data.error);
      }
    } catch (error) {
      console.error('❌ Error starting profiling:', error);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !sessionId) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${API_BASE}/profiling/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add AI response to chat
        setMessages(prev => [...prev, { type: 'ai', content: data.message }]);
        
        // Check if profiling is complete
        if (data.profiling_complete && data.profile_data) {
          setProfileData(data.profile_data);
          console.log('🎉 Profiling completed!', data.profile_data);
        }
      } else {
        console.error('❌ Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6">🧪 AI Profiling Test</h2>
      
      {/* Start Button */}
      {!sessionId && (
        <button
          onClick={startProfiling}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Starting...' : '🚀 Start AI Profiling'}
        </button>
      )}

      {/* Session Info */}
      {sessionId && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            <strong>Session ID:</strong> {sessionId.slice(0, 8)}...
          </p>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.type === 'ai'
                  ? 'bg-blue-900 bg-opacity-50 border-l-4 border-blue-500'
                  : 'bg-green-900 bg-opacity-50 border-l-4 border-green-500'
              }`}
            >
              <div className="text-sm font-medium mb-2 text-gray-300">
                {message.type === 'ai' ? '🤖 InterviewAI' : '👤 You'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      {sessionId && !profileData && (
        <div className="flex gap-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            className="flex-1 p-3 bg-gray-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !userInput.trim()}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      )}

      {/* Profile Data */}
      {profileData && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg border border-purple-500">
          <h3 className="text-lg font-bold mb-3">🎉 Profiling Complete!</h3>
          <div className="space-y-2">
            {Object.entries(profileData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-300 capitalize">
                  {key.replace('_', ' ')}:
                </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="font-medium mb-2">📋 Test Instructions:</h4>
        <ol className="text-sm text-gray-300 space-y-1">
          <li>1. Click "Start AI Profiling" to begin</li>
          <li>2. Respond to AI questions naturally</li>
          <li>3. Watch for dynamic question generation</li>
          <li>4. Complete profiling to see extracted data</li>
        </ol>
      </div>
    </div>
  );
};

export default ProfilingTest; 