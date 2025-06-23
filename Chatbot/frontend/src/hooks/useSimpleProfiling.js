import { useState, useCallback, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

/**
 * Super Simple Profiling Hook - Python Controls Everything!
 * 
 * This hook is just a thin wrapper around Python API calls.
 * All the conversation logic, business rules, and flow control
 * happens in your Python controller.
 */
export const useSimpleProfiling = () => {
  const [sessionData, setSessionData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start Python-controlled session automatically
  useEffect(() => {
    if (!sessionData) {
      startSession();
    }
  }, []);

  // Start new Python session
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/profiling/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionData(data);
        setMessages([{
          type: 'ai',
          content: data.message,
          timestamp: Date.now()
        }]);
        console.log('✅ Python session started:', data.session_id);
      } else {
        setError(data.error);
        console.error('❌ Python session failed:', data.error);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('❌ Network error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message to Python controller
  const sendMessage = useCallback(async (userMessage) => {
    if (!sessionData?.session_id || !userMessage.trim()) {
      return "Please provide a valid message.";
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg = {
      type: 'user',
      content: userMessage.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch(`${API_BASE}/profiling/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          message: userMessage.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add AI response
        const aiMsg = {
          type: 'ai',
          content: data.ai_message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Update session data with Python's response
        setSessionData(prev => ({
          ...prev,
          ...data,
          message: data.ai_message
        }));

        console.log('✅ Python processed message');
        return data.ai_message;
      } else {
        setError(data.error);
        console.error('❌ Python message error:', data.error);
        return "I'm sorry, I encountered an error. Please try again.";
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('❌ Network error:', err);
      return "I'm sorry, there was a network error. Please try again.";
    } finally {
      setIsLoading(false);
    }
  }, [sessionData]);

  // Get Python session status
  const getStatus = useCallback(async () => {
    if (!sessionData?.session_id) return null;

    try {
      const response = await fetch(`${API_BASE}/profiling/status/${sessionData.session_id}`);
      const data = await response.json();
      
      if (data.success) {
        setSessionData(prev => ({ ...prev, ...data }));
        return data;
      }
    } catch (err) {
      console.error('❌ Status check error:', err);
    }
    return null;
  }, [sessionData]);

  // Reset everything
  const reset = useCallback(() => {
    setSessionData(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    console.log('🔄 Reset - Python will create new session');
  }, []);

  // Get current question (for compatibility)
  const getCurrentQuestion = useCallback(() => {
    const lastAiMessage = messages.filter(msg => msg.type === 'ai').pop();
    return lastAiMessage?.content || "Hello! Let's start your profiling session.";
  }, [messages]);

  // Process user response (for compatibility with existing code)
  const processUserResponse = useCallback(async (userMessage) => {
    return await sendMessage(userMessage);
  }, [sendMessage]);

  return {
    // Core state (compatible interface)
    sessionId: sessionData?.session_id,
    messages,
    isLoading,
    error,
    
    // Profiling state (from Python)
    profileData: sessionData?.profile_data,
    isProfilingComplete: sessionData?.profiling_complete || false,
    conversationState: sessionData?.conversation_state,
    
    // Python instructions for frontend
    instructions: sessionData?.instructions || {},
    
    // Compatible functions
    processUserResponse,
    getCurrentQuestion,
    resetProfiling: reset,
    
    // Additional functions
    startSession,
    sendMessage,
    getStatus,
    
    // Status helpers
    hasSession: !!sessionData?.session_id,
    hasMessages: messages.length > 0,
    isInitialized: !!sessionData,
    
    // Python-specific data
    pythonMetadata: sessionData?.session_metadata,
    conversationHistory: sessionData?.conversation_history,
    
    // Mock profilingState for compatibility
    profilingState: sessionData?.profiling_complete ? 'COMPLETED' : 'IN_PROGRESS'
  };
};

export default useSimpleProfiling; 