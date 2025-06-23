"""
Flask routes for AI-powered profiling using Vertex AI and Gemini
"""

from flask import Blueprint, request, jsonify, session
from services.profiling_controller import (
    profiling_controller,
    create_profiling_session,
    process_profiling_message,
    get_profiling_status
)
import logging
import traceback
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

profiling_bp = Blueprint('profiling', __name__)

# Python controller handles everything now
logger.info("✅ Using Python-controlled profiling system")

@profiling_bp.route('/start', methods=['POST'])
def start_profiling():
    """
    Start a new AI profiling session (Python-controlled)
    
    Returns:
        JSON response with session_id, AI greeting, and Python instructions
    """
    try:
        # Python controller handles everything
        result = create_profiling_session()
        
        if result['success']:
            logger.info(f"🚀 Python-controlled session started: {result['session_id']}")
            return jsonify(result)
        else:
            logger.error(f"❌ Failed to start Python session: {result.get('error')}")
            return jsonify(result), 500
        
    except Exception as e:
        logger.error(f"❌ Error in Python profiling start: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to start Python-controlled profiling',
            'details': str(e)
        }), 500

@profiling_bp.route('/message', methods=['POST'])
def send_message():
    """
    Send a message to Python-controlled profiling session
    
    Expected JSON:
    {
        "session_id": "uuid",
        "message": "user's message"
    }
    
    Returns:
        JSON response with AI reply, Python instructions, and profiling status
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        session_id = data.get('session_id')
        user_message = data.get('message')
        
        if not session_id or not user_message:
            return jsonify({
                'success': False,
                'error': 'session_id and message are required'
            }), 400
        
        # Python controller processes everything
        result = process_profiling_message(session_id, user_message)
        
        if result['success']:
            logger.info(f"💬 Python session {session_id}: {user_message[:30]}... → {result.get('ai_message', '')[:30]}...")
            return jsonify(result)
        else:
            logger.error(f"❌ Python session error: {result.get('error')}")
            return jsonify(result), 404 if 'not found' in result.get('error', '').lower() else 500
        
    except Exception as e:
        logger.error(f"❌ Error in Python message processing: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Failed to process message in Python controller',
            'details': str(e)
        }), 500

@profiling_bp.route('/status/<session_id>', methods=['GET'])
def get_session_status(session_id):
    """
    Get Python-controlled profiling session status
    
    Returns:
        JSON response with detailed session status and Python metadata
    """
    try:
        # Python controller provides detailed status
        result = get_profiling_status(session_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
        
    except Exception as e:
        logger.error(f"❌ Error getting Python session status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get Python session status',
            'details': str(e)
        }), 500

@profiling_bp.route('/complete/<session_id>', methods=['POST'])
def complete_profiling(session_id):
    """
    Manually complete a profiling session and extract final profile data
    
    Returns:
        JSON response with extracted profile data
    """
    try:
        if session_id not in active_sessions:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        session_data = active_sessions[session_id]
        chat_session = session_data['chat_session']
        
        # Extract profile data
        profile_data = profiling_engine.extract_profile_data(chat_session)
        
        # Mark as completed
        session_data['completed'] = True
        session_data['profile_data'] = profile_data
        
        logger.info(f"✅ Completed profiling session: {session_id}")
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'profile_data': profile_data,
            'profiling_complete': True
        })
        
    except Exception as e:
        logger.error(f"❌ Error completing profiling: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to complete profiling',
            'details': str(e)
        }), 500

@profiling_bp.route('/sessions', methods=['GET'])
def list_sessions():
    """
    List all active profiling sessions (for debugging)
    
    Returns:
        JSON response with session information
    """
    try:
        sessions_info = []
        
        for session_id, session_data in active_sessions.items():
            sessions_info.append({
                'session_id': session_id,
                'completed': session_data.get('completed', False),
                'has_profile_data': 'profile_data' in session_data
            })
        
        return jsonify({
            'success': True,
            'active_sessions': len(active_sessions),
            'sessions': sessions_info
        })
        
    except Exception as e:
        logger.error(f"❌ Error listing sessions: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to list sessions',
            'details': str(e)
        }), 500

@profiling_bp.route('/cleanup', methods=['POST'])
def cleanup_sessions():
    """
    Clean up completed or old sessions
    
    Returns:
        JSON response with cleanup results
    """
    try:
        initial_count = len(active_sessions)
        
        # Remove completed sessions
        completed_sessions = [
            sid for sid, data in active_sessions.items() 
            if data.get('completed', False)
        ]
        
        for session_id in completed_sessions:
            del active_sessions[session_id]
        
        final_count = len(active_sessions)
        cleaned = initial_count - final_count
        
        logger.info(f"🧹 Cleaned up {cleaned} completed sessions")
        
        return jsonify({
            'success': True,
            'cleaned_sessions': cleaned,
            'remaining_sessions': final_count
        })
        
    except Exception as e:
        logger.error(f"❌ Error cleaning up sessions: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup sessions',
            'details': str(e)
        }), 500

@profiling_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check for the profiling service
    
    Returns:
        JSON response with service health status
    """
    try:
        # Test basic functionality
        if profiling_engine:
            # Try to create a test session (but don't store it)
            test_chat = profiling_engine.start_profiling_session()
            health_status = "healthy"
        else:
            health_status = "unhealthy - engine not initialized"
        
        return jsonify({
            'success': True,
            'status': health_status,
            'active_sessions': len(active_sessions),
            'engine_available': profiling_engine is not None
        })
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500 