"""
Clean Python-Controlled AI Profiling Routes

This module provides REST API endpoints for AI profiling that delegates
all logic to the Python controller, giving you full control in Python.
"""

from flask import Blueprint, request, jsonify
from services.profiling_controller import (
    profiling_controller,
    create_profiling_session,
    process_profiling_message,
    get_profiling_status
)
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

profiling_bp = Blueprint('profiling', __name__)

@profiling_bp.route('/start', methods=['POST'])
def start_profiling():
    """
    Start a new Python-controlled AI profiling session
    
    Returns:
        JSON response with session info and Python instructions for frontend
    """
    try:
        # Python controller handles everything
        result = create_profiling_session()
        
        if result['success']:
            logger.info(f"🚀 Python session started: {result['session_id']}")
        else:
            logger.error(f"❌ Python session failed: {result.get('error')}")
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        logger.error(f"❌ Error starting Python profiling: {e}")
        return jsonify({
            'success': False,
            'error': 'Python controller error',
            'details': str(e)
        }), 500

@profiling_bp.route('/message', methods=['POST'])
def send_message():
    """
    Send message to Python-controlled profiling session
    
    Expected JSON: {"session_id": "uuid", "message": "user input"}
    
    Returns:
        JSON response with AI reply and Python instructions
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('session_id') or not data.get('message'):
            return jsonify({
                'success': False,
                'error': 'session_id and message are required'
            }), 400
        
        # Python controller processes everything
        result = process_profiling_message(data['session_id'], data['message'])
        
        status_code = 200
        if not result['success']:
            if 'not found' in result.get('error', '').lower():
                status_code = 404
            else:
                status_code = 500
        
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"❌ Error in Python message processing: {e}")
        return jsonify({
            'success': False,
            'error': 'Python message processing failed',
            'details': str(e)
        }), 500

@profiling_bp.route('/status/<session_id>', methods=['GET'])
def get_session_status(session_id):
    """
    Get detailed Python-controlled session status
    
    Returns:
        JSON response with session status, conversation history, and metadata
    """
    try:
        result = get_profiling_status(session_id)
        return jsonify(result), 200 if result['success'] else 404
        
    except Exception as e:
        logger.error(f"❌ Error getting Python session status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get session status',
            'details': str(e)
        }), 500

@profiling_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check for Python profiling controller
    """
    try:
        # Check if Python controller is working
        active_sessions = len(profiling_controller.active_sessions)
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'controller': 'Python ProfilingController',
            'active_sessions': active_sessions,
            'message': 'Python-controlled AI profiling is operational'
        })
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@profiling_bp.route('/cleanup', methods=['POST'])
def cleanup_sessions():
    """
    Cleanup old Python-controlled sessions
    """
    try:
        cleaned_count = profiling_controller.cleanup_old_sessions()
        
        return jsonify({
            'success': True,
            'cleaned_sessions': cleaned_count,
            'remaining_sessions': len(profiling_controller.active_sessions)
        })
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Additional Python-controlled endpoints
@profiling_bp.route('/sessions', methods=['GET'])
def list_sessions():
    """
    List all active Python-controlled sessions (for debugging)
    """
    try:
        sessions_info = []
        
        for session_id, session in profiling_controller.active_sessions.items():
            sessions_info.append({
                'session_id': session_id,
                'created_at': session.created_at.isoformat(),
                'is_complete': session.is_complete(),
                'message_count': len(session.conversation_history),
                'phase': session.conversation_state['phase']
            })
        
        return jsonify({
            'success': True,
            'total_sessions': len(profiling_controller.active_sessions),
            'sessions': sessions_info
        })
        
    except Exception as e:
        logger.error(f"❌ Error listing sessions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 