"""
AI Profiling Controller - Python-First Architecture

This controller manages the entire profiling conversation flow in Python,
giving you full control over conversation logic, error handling, and business rules.
The frontend becomes a thin client that just displays what Python tells it to.
"""

import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import logging

from services.profiling_engine import ProfilingEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProfilingController:
    """
    Python-first profiling controller that manages conversation flow,
    business logic, and state management entirely in Python.
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, 'ProfilingSession'] = {}
        self.profiling_engine = ProfilingEngine()
        logger.info("✅ ProfilingController initialized")
    
    def create_session(self) -> Dict[str, Any]:
        """Create a new profiling session with full Python control"""
        session_id = str(uuid.uuid4())
        
        try:
            # Create new session
            session = ProfilingSession(session_id, self.profiling_engine)
            self.active_sessions[session_id] = session
            
            # Get initial AI greeting
            initial_message = session.start_conversation()
            
            logger.info(f"🚀 Created profiling session: {session_id}")
            
            return {
                'success': True,
                'session_id': session_id,
                'message': initial_message,
                'conversation_state': session.get_state(),
                'instructions': session.get_frontend_instructions()
            }
            
        except Exception as e:
            logger.error(f"❌ Error creating session: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_user_message(self, session_id: str, user_message: str) -> Dict[str, Any]:
        """Process user message with full Python business logic control"""
        if session_id not in self.active_sessions:
            return {
                'success': False,
                'error': 'Session not found',
                'action': 'restart_required'
            }
        
        session = self.active_sessions[session_id]
        
        try:
            # Python controls the entire conversation flow
            result = session.process_message(user_message)
            
            # Python decides what happens next
            response = {
                'success': True,
                'session_id': session_id,
                'ai_message': result['ai_response'],
                'conversation_state': session.get_state(),
                'instructions': session.get_frontend_instructions(),
                'profiling_complete': session.is_complete(),
            }
            
            # Add profile data if complete
            if session.is_complete():
                response['profile_data'] = session.get_profile_data()
                response['next_action'] = 'start_interview'
                logger.info(f"🎉 Profiling completed for session: {session_id}")
            
            # Python can add custom actions/instructions
            if result.get('needs_clarification'):
                response['frontend_action'] = 'highlight_input'
                response['hint'] = "Please be more specific"
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error processing message for {session_id}: {e}")
            return {
                'success': False,
                'error': str(e),
                'action': 'retry_available'
            }
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get detailed session status with Python-controlled metadata"""
        if session_id not in self.active_sessions:
            return {
                'success': False,
                'error': 'Session not found'
            }
        
        session = self.active_sessions[session_id]
        
        return {
            'success': True,
            'session_id': session_id,
            'conversation_state': session.get_state(),
            'profiling_complete': session.is_complete(),
            'profile_data': session.get_profile_data() if session.is_complete() else None,
            'conversation_history': session.get_conversation_history(),
            'session_metadata': session.get_metadata(),
            'instructions': session.get_frontend_instructions()
        }
    
    def cleanup_old_sessions(self, max_age_hours: int = 2):
        """Python-controlled session cleanup"""
        current_time = datetime.now()
        expired_sessions = []
        
        for session_id, session in self.active_sessions.items():
            if current_time - session.created_at > timedelta(hours=max_age_hours):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]
            logger.info(f"🧹 Cleaned up expired session: {session_id}")
        
        return len(expired_sessions)


class ProfilingSession:
    """
    Individual profiling session with full Python control over conversation flow
    """
    
    def __init__(self, session_id: str, profiling_engine: ProfilingEngine):
        self.session_id = session_id
        self.profiling_engine = profiling_engine
        self.created_at = datetime.now()
        self.chat_session = None
        self.conversation_history = []
        self.profile_data = None
        self.is_completed = False
        self.retry_count = 0
        self.max_retries = 3
        
        # Python-controlled conversation state
        self.conversation_state = {
            'phase': 'greeting',  # greeting, collecting, confirming, completed
            'collected_info': {},
            'current_focus': None,
            'needs_clarification': False
        }
    
    def start_conversation(self) -> str:
        """Start the AI conversation with Python control"""
        self.chat_session = self.profiling_engine.start_profiling_session()
        initial_message = self.chat_session.history[-1].parts[0].text
        
        # Python tracks the conversation
        self.conversation_history.append({
            'type': 'ai',
            'message': initial_message,
            'timestamp': datetime.now().isoformat(),
            'phase': 'greeting'
        })
        
        self.conversation_state['phase'] = 'collecting'
        return initial_message
    
    def process_message(self, user_message: str) -> Dict[str, Any]:
        """Process user message with full Python business logic"""
        
        # Python tracks user input
        self.conversation_history.append({
            'type': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat(),
            'phase': self.conversation_state['phase']
        })
        
        try:
            # Send to AI and get response
            ai_response = self.profiling_engine.send_profiling_message(
                self.chat_session, user_message
            )
            
            # Python tracks AI response
            self.conversation_history.append({
                'type': 'ai',
                'message': ai_response,
                'timestamp': datetime.now().isoformat(),
                'phase': self.conversation_state['phase']
            })
            
            # Python analyzes the conversation for business logic
            self._analyze_conversation_progress()
            
            # Check if profiling is complete (Python decides)
            if self._should_check_completion():
                self.is_completed = self.profiling_engine.is_profiling_complete(self.chat_session)
                
                if self.is_completed:
                    self.profile_data = self.profiling_engine.extract_profile_data(self.chat_session)
                    self.conversation_state['phase'] = 'completed'
            
            self.retry_count = 0  # Reset on success
            
            return {
                'ai_response': ai_response,
                'needs_clarification': self.conversation_state.get('needs_clarification', False),
                'conversation_phase': self.conversation_state['phase']
            }
            
        except Exception as e:
            self.retry_count += 1
            logger.error(f"❌ Error in conversation for {self.session_id}: {e}")
            
            if self.retry_count >= self.max_retries:
                return {
                    'ai_response': "I'm sorry, I'm having technical difficulties. Let me try to help you in a different way.",
                    'needs_clarification': True,
                    'error_recovery': True
                }
            else:
                return {
                    'ai_response': "I'm sorry, I didn't catch that. Could you please repeat?",
                    'needs_clarification': True
                }
    
    def _analyze_conversation_progress(self):
        """Python analyzes conversation to make intelligent decisions"""
        recent_messages = self.conversation_history[-4:]  # Last 2 exchanges
        
        # Python can implement custom logic here
        user_messages = [msg for msg in recent_messages if msg['type'] == 'user']
        
        if user_messages:
            last_user_message = user_messages[-1]['message'].lower()
            
            # Python detects if user needs help
            if any(word in last_user_message for word in ['help', 'confused', "don't understand"]):
                self.conversation_state['needs_clarification'] = True
            else:
                self.conversation_state['needs_clarification'] = False
    
    def _should_check_completion(self) -> bool:
        """Python decides when to check if profiling is complete"""
        # Check every few exchanges, or if conversation seems complete
        return len(self.conversation_history) >= 8 and len(self.conversation_history) % 4 == 0
    
    def get_state(self) -> Dict[str, Any]:
        """Get current conversation state (Python-controlled)"""
        return {
            'phase': self.conversation_state['phase'],
            'message_count': len(self.conversation_history),
            'is_complete': self.is_completed,
            'needs_clarification': self.conversation_state.get('needs_clarification', False),
            'last_update': datetime.now().isoformat()
        }
    
    def get_frontend_instructions(self) -> Dict[str, Any]:
        """Python tells frontend what to do"""
        instructions = {
            'show_typing_indicator': not self.is_completed,
            'placeholder_text': "Type your response...",
            'show_progress': True,
            'enable_voice': True
        }
        
        if self.conversation_state.get('needs_clarification'):
            instructions['placeholder_text'] = "Please provide more details..."
            instructions['highlight_input'] = True
        
        if self.is_completed:
            instructions['show_typing_indicator'] = False
            instructions['show_completion_celebration'] = True
            instructions['next_action'] = 'start_interview'
        
        return instructions
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get full conversation history"""
        return self.conversation_history.copy()
    
    def get_profile_data(self) -> Optional[Dict[str, Any]]:
        """Get extracted profile data"""
        return self.profile_data
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get session metadata"""
        return {
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat(),
            'duration_minutes': (datetime.now() - self.created_at).total_seconds() / 60,
            'message_count': len(self.conversation_history),
            'retry_count': self.retry_count,
            'conversation_state': self.conversation_state.copy()
        }
    
    def is_complete(self) -> bool:
        """Check if profiling is complete"""
        return self.is_completed


# Global controller instance
profiling_controller = ProfilingController()

# Convenience functions for easy usage
def create_profiling_session():
    """Create new profiling session"""
    return profiling_controller.create_session()

def process_profiling_message(session_id: str, message: str):
    """Process message in profiling session"""
    return profiling_controller.process_user_message(session_id, message)

def get_profiling_status(session_id: str):
    """Get profiling session status"""
    return profiling_controller.get_session_status(session_id) 