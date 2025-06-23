import os
import io
import base64
import re
from google.cloud import texttospeech
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GCPTextToSpeechService:
    """Google Cloud Text-to-Speech service with high-quality Indian accent voices"""
    
    def __init__(self):
        """Initialize the TTS client"""
        try:
            self.client = texttospeech.TextToSpeechClient()
            logger.info("✅ Google Cloud TTS client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize TTS client: {e}")
            raise
    
    def clean_text_for_speech(self, text: str) -> str:
        """
        Clean text by removing markdown formatting and other characters
        that don't sound good when spoken by TTS
        
        Args:
            text: Raw text that may contain markdown formatting
            
        Returns:
            Cleaned text suitable for TTS
        """
        if not text:
            return text
        
        # Remove markdown bold/italic formatting
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold** -> bold
        text = re.sub(r'\*(.+?)\*', r'\1', text)      # *italic* -> italic
        text = re.sub(r'__(.+?)__', r'\1', text)      # __bold__ -> bold
        text = re.sub(r'_(.+?)_', r'\1', text)        # _italic_ -> italic
        
        # Remove markdown links but keep the text
        text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)  # [text](url) -> text
        
        # Remove markdown headers
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)  # # Header -> Header
        
        # Remove markdown code blocks
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)  # Remove code blocks
        text = re.sub(r'`(.+?)`', r'\1', text)  # `code` -> code
        
        # Remove markdown lists but keep content
        text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # - item -> item
        text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # 1. item -> item
        
        # Clean up extra whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)  # Multiple newlines -> double newline
        text = re.sub(r'\s+', ' ', text)  # Multiple spaces -> single space
        text = text.strip()
        
        return text

    # High-quality voice configurations with Indian accent
    VOICE_CONFIGS = {
        # WaveNet voices with Indian accent
        'wavenet_male_indian': {
            'language_code': 'en-IN',
            'name': 'en-IN-Wavenet-A',  # Male voice
            'ssml_gender': texttospeech.SsmlVoiceGender.MALE
        },
        'wavenet_female_indian': {
            'language_code': 'en-IN',
            'name': 'en-IN-Wavenet-B',  # Female voice
            'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
        },
        'wavenet_female_indian_2': {
            'language_code': 'en-IN',
            'name': 'en-IN-Wavenet-C',  # Another female voice
            'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
        },
        'wavenet_male_indian_2': {
            'language_code': 'en-IN',
            'name': 'en-IN-Wavenet-D',  # Another male voice
            'ssml_gender': texttospeech.SsmlVoiceGender.MALE
        },
        
        # Neural2 voices with Indian accent (highest quality)
        # Fixed gender assignments based on Google Cloud TTS documentation
        'neural2_female_indian': {
            'language_code': 'en-IN',
            'name': 'en-IN-Neural2-A',  # Female Neural2 voice (corrected)
            'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
        },
        'neural2_male_indian': {
            'language_code': 'en-IN',
            'name': 'en-IN-Neural2-B',  # Male Neural2 voice (corrected)
            'ssml_gender': texttospeech.SsmlVoiceGender.MALE
        },
        'neural2_female_indian_2': {
            'language_code': 'en-IN',
            'name': 'en-IN-Neural2-C',  # Female Neural2 voice (corrected)
            'ssml_gender': texttospeech.SsmlVoiceGender.FEMALE
        },
        'neural2_male_indian_2': {
            'language_code': 'en-IN',
            'name': 'en-IN-Neural2-D',  # Male Neural2 voice (corrected)
            'ssml_gender': texttospeech.SsmlVoiceGender.MALE
        }
    }
    
    # Default voice (Neural2 male Indian for best quality)
    DEFAULT_VOICE = 'neural2_male_indian'
    
    def synthesize_speech(
        self, 
        text: str, 
        voice_type: str = None,
        speaking_rate: float = 0.9,
        pitch: float = 0.0,
        volume_gain_db: float = 0.0
    ) -> bytes:
        """
        Synthesize speech using Google Cloud Text-to-Speech with high-quality voices
        
        Args:
            text: Text to synthesize
            voice_type: Voice type from VOICE_CONFIGS
            speaking_rate: Speaking rate (0.25-4.0, default 0.9)
            pitch: Pitch (-20.0 to 20.0, default 0.0)
            volume_gain_db: Volume gain in dB (-96.0 to 16.0, default 0.0)
            
        Returns:
            Audio content as bytes
        """
        try:
            # Use default voice if not specified
            if voice_type is None:
                voice_type = self.DEFAULT_VOICE
            
            # Clean text to remove markdown formatting before TTS
            cleaned_text = self.clean_text_for_speech(text)
            logger.info(f"🧹 Cleaned text for TTS: Original length={len(text)}, Cleaned length={len(cleaned_text)}")
            
            # Get voice configuration
            voice_config = self.VOICE_CONFIGS.get(voice_type)
            if not voice_config:
                logger.warning(f"⚠️ Unknown voice type: {voice_type}, using default")
                voice_config = self.VOICE_CONFIGS[self.DEFAULT_VOICE]
            
            # Prepare the text input with cleaned text
            synthesis_input = texttospeech.SynthesisInput(text=cleaned_text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=voice_config['language_code'],
                name=voice_config['name'],
                ssml_gender=voice_config['ssml_gender']
            )
            
            # Select the type of audio file and configure audio
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume_gain_db=volume_gain_db,
                sample_rate_hertz=24000,  # High quality sample rate
                effects_profile_id=['headphone-class-device']  # Optimize for headphones
            )
            
            logger.info(f"🗣️ Synthesizing speech with voice: {voice_config['name']}")
            logger.info(f"📝 Text: \"{text[:100]}{'...' if len(text) > 100 else ''}\"")
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            logger.info(f"✅ Speech synthesis completed. Audio size: {len(response.audio_content)} bytes")
            
            return response.audio_content
            
        except Exception as e:
            logger.error(f"❌ Error synthesizing speech: {e}")
            raise
    
    def synthesize_speech_base64(
        self, 
        text: str, 
        voice_type: str = None,
        speaking_rate: float = 0.9,
        pitch: float = 0.0,
        volume_gain_db: float = 0.0
    ) -> str:
        """
        Synthesize speech and return as base64 encoded string
        
        Returns:
            Base64 encoded audio content
        """
        try:
            audio_content = self.synthesize_speech(
                text, voice_type, speaking_rate, pitch, volume_gain_db
            )
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_content).decode('utf-8')
            
            logger.info(f"🔄 Audio converted to base64. Length: {len(audio_base64)} chars")
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"❌ Error converting audio to base64: {e}")
            raise
    
    def save_speech_to_file(
        self, 
        text: str, 
        output_path: str,
        voice_type: str = None,
        speaking_rate: float = 0.9,
        pitch: float = 0.0,
        volume_gain_db: float = 0.0
    ) -> str:
        """
        Synthesize speech and save to file
        
        Returns:
            Path to the saved file
        """
        try:
            audio_content = self.synthesize_speech(
                text, voice_type, speaking_rate, pitch, volume_gain_db
            )
            
            # Write the binary audio content to a local file
            with open(output_path, 'wb') as out:
                out.write(audio_content)
            
            logger.info(f"🎵 Audio content written to file: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Error saving speech to file: {e}")
            raise
    
    def get_available_voices(self) -> Dict[str, Any]:
        """Get available voice configurations"""
        return self.VOICE_CONFIGS
    
    def test_voices(self, text: str = "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview.") -> Dict[str, bool]:
        """
        Test synthesis with different voices
        
        Returns:
            Dictionary with voice test results
        """
        logger.info("🧪 Testing different voice configurations...")
        results = {}
        
        for voice_type, config in self.VOICE_CONFIGS.items():
            try:
                logger.info(f"\n🎙️ Testing voice: {voice_type} ({config['name']})")
                audio_content = self.synthesize_speech(text, voice_type)
                results[voice_type] = True
                logger.info(f"✅ {voice_type}: Success - {len(audio_content)} bytes")
            except Exception as e:
                results[voice_type] = False
                logger.error(f"❌ {voice_type}: Failed - {str(e)}")
        
        return results

# Create a global instance
tts_service = GCPTextToSpeechService()

# Convenience functions for backward compatibility
def synthesize_speech(text: str, voice_type: str = None, **kwargs) -> bytes:
    """Synthesize speech using the global TTS service instance"""
    return tts_service.synthesize_speech(text, voice_type, **kwargs)

def synthesize_speech_base64(text: str, voice_type: str = None, **kwargs) -> str:
    """Synthesize speech and return as base64 using the global TTS service instance"""
    return tts_service.synthesize_speech_base64(text, voice_type, **kwargs)

def get_available_voices() -> Dict[str, Any]:
    """Get available voices using the global TTS service instance"""
    return tts_service.get_available_voices()

def test_voices(text: str = None) -> Dict[str, bool]:
    """Test voices using the global TTS service instance"""
    if text is None:
        text = "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview."
    return tts_service.test_voices(text) 