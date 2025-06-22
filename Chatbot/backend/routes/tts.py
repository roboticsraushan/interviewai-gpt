from flask import Blueprint, request, jsonify, make_response
from services.gcp_tts_service import tts_service
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

tts_bp = Blueprint('tts', __name__)

@tts_bp.route('/synthesize', methods=['POST'])
def synthesize_speech():
    """
    Synthesize speech using Google Cloud TTS
    
    Expected JSON payload:
    {
        "text": "Text to synthesize",
        "voice_type": "neural2_female_indian",  # optional
        "speaking_rate": 0.9,  # optional
        "pitch": 0.0,  # optional
        "volume_gain_db": 0.0,  # optional
        "format": "base64"  # optional: "base64" or "binary"
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text')
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Extract optional parameters
        voice_type = data.get('voice_type', 'neural2_female_indian')
        speaking_rate = data.get('speaking_rate', 0.9)
        pitch = data.get('pitch', 0.0)
        volume_gain_db = data.get('volume_gain_db', 0.0)
        output_format = data.get('format', 'base64')
        
        logger.info(f"🗣️ TTS request: voice={voice_type}, rate={speaking_rate}, pitch={pitch}")
        
        # Validate parameters
        if speaking_rate < 0.25 or speaking_rate > 4.0:
            return jsonify({'error': 'Speaking rate must be between 0.25 and 4.0'}), 400
        
        if pitch < -20.0 or pitch > 20.0:
            return jsonify({'error': 'Pitch must be between -20.0 and 20.0'}), 400
        
        if volume_gain_db < -96.0 or volume_gain_db > 16.0:
            return jsonify({'error': 'Volume gain must be between -96.0 and 16.0'}), 400
        
        # Synthesize speech
        if output_format == 'base64':
            audio_data = tts_service.synthesize_speech_base64(
                text=text,
                voice_type=voice_type,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume_gain_db=volume_gain_db
            )
            
            return jsonify({
                'success': True,
                'audio_data': audio_data,
                'format': 'base64',
                'voice_type': voice_type,
                'text_length': len(text)
            })
        
        elif output_format == 'binary':
            audio_data = tts_service.synthesize_speech(
                text=text,
                voice_type=voice_type,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume_gain_db=volume_gain_db
            )
            
            # Return binary audio data
            response = make_response(audio_data)
            response.headers['Content-Type'] = 'audio/mpeg'
            response.headers['Content-Disposition'] = 'attachment; filename="speech.mp3"'
            return response
        
        else:
            return jsonify({'error': 'Invalid format. Use "base64" or "binary"'}), 400
    
    except Exception as e:
        logger.error(f"❌ TTS error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Failed to synthesize speech',
            'details': str(e)
        }), 500

@tts_bp.route('/voices', methods=['GET'])
def get_voices():
    """Get available voice configurations"""
    try:
        voices = tts_service.get_available_voices()
        return jsonify({
            'success': True,
            'voices': voices,
            'default_voice': tts_service.DEFAULT_VOICE
        })
    except Exception as e:
        logger.error(f"❌ Error getting voices: {str(e)}")
        return jsonify({
            'error': 'Failed to get voices',
            'details': str(e)
        }), 500

@tts_bp.route('/test', methods=['POST'])
def test_voices():
    """Test all available voices with a sample text"""
    try:
        data = request.get_json()
        test_text = data.get('text', "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview.")
        
        logger.info(f"🧪 Testing voices with text: {test_text[:50]}...")
        
        results = tts_service.test_voices(test_text)
        
        return jsonify({
            'success': True,
            'test_results': results,
            'test_text': test_text
        })
    
    except Exception as e:
        logger.error(f"❌ Error testing voices: {str(e)}")
        return jsonify({
            'error': 'Failed to test voices',
            'details': str(e)
        }), 500

@tts_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for TTS service"""
    try:
        # Try to synthesize a short test phrase
        test_text = "Hello"
        audio_data = tts_service.synthesize_speech_base64(test_text, voice_type='neural2_female_indian')
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'service': 'Google Cloud Text-to-Speech',
            'test_audio_size': len(audio_data)
        })
    
    except Exception as e:
        logger.error(f"❌ TTS health check failed: {str(e)}")
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500 