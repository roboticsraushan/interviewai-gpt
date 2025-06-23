#!/usr/bin/env python3
"""
Debug script for TTS service to identify the 400 error
"""

import sys
import os

# Add the backend path to import the services
sys.path.append('.')

try:
    from services.gcp_tts_service import tts_service
    print("✅ TTS service imported successfully")
except ImportError as e:
    print(f"❌ Failed to import TTS service: {e}")
    sys.exit(1)

def test_tts_service():
    """Test the TTS service with various inputs"""
    
    print("🧪 Testing TTS Service Debug")
    print("=" * 50)
    
    # Test 1: Basic functionality
    print("\n1️⃣ Testing basic TTS functionality...")
    try:
        test_text = "Hello! This is a test."
        audio_data = tts_service.synthesize_speech_base64(test_text)
        print(f"✅ Basic TTS works. Audio size: {len(audio_data)} chars")
    except Exception as e:
        print(f"❌ Basic TTS failed: {e}")
        return False
    
    # Test 2: Test with empty text (might be the issue)
    print("\n2️⃣ Testing with empty text...")
    try:
        audio_data = tts_service.synthesize_speech_base64("")
        print(f"⚠️ Empty text succeeded: {len(audio_data)} chars")
    except Exception as e:
        print(f"❌ Empty text failed (expected): {e}")
    
    # Test 3: Test with None text
    print("\n3️⃣ Testing with None text...")
    try:
        audio_data = tts_service.synthesize_speech_base64(None)
        print(f"⚠️ None text succeeded: {len(audio_data)} chars")
    except Exception as e:
        print(f"❌ None text failed (expected): {e}")
    
    # Test 4: Test with invalid voice type
    print("\n4️⃣ Testing with invalid voice type...")
    try:
        audio_data = tts_service.synthesize_speech_base64(
            "Hello", voice_type="invalid_voice"
        )
        print(f"✅ Invalid voice handled: {len(audio_data)} chars")
    except Exception as e:
        print(f"❌ Invalid voice failed: {e}")
    
    # Test 5: Test with invalid parameters
    print("\n5️⃣ Testing with invalid parameters...")
    try:
        audio_data = tts_service.synthesize_speech_base64(
            "Hello", 
            speaking_rate=10.0,  # Invalid: >4.0
            pitch=50.0,          # Invalid: >20.0
            volume_gain_db=100.0 # Invalid: >16.0
        )
        print(f"⚠️ Invalid params succeeded: {len(audio_data)} chars")
    except Exception as e:
        print(f"❌ Invalid params failed (expected): {e}")
    
    return True

def test_api_request_format():
    """Test the exact request format from frontend"""
    
    print("\n🔍 Testing Frontend Request Format")
    print("=" * 50)
    
    # Simulate the exact request from frontend
    request_data = {
        "text": "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview.",
        "voice_type": "neural2_male_indian",
        "speaking_rate": 0.9,
        "pitch": 0.0,
        "volume_gain_db": 0.0,
        "format": "base64"
    }
    
    print(f"📝 Request data: {request_data}")
    
    # Test each parameter validation
    try:
        text = request_data.get('text')
        if not text:
            print("❌ Text validation would fail: empty text")
            return False
        
        voice_type = request_data.get('voice_type', 'neural2_female_indian')
        speaking_rate = request_data.get('speaking_rate', 0.9)
        pitch = request_data.get('pitch', 0.0)
        volume_gain_db = request_data.get('volume_gain_db', 0.0)
        
        # Validate ranges (same as in routes/tts.py)
        if speaking_rate < 0.25 or speaking_rate > 4.0:
            print(f"❌ Speaking rate validation would fail: {speaking_rate}")
            return False
        
        if pitch < -20.0 or pitch > 20.0:
            print(f"❌ Pitch validation would fail: {pitch}")
            return False
        
        if volume_gain_db < -96.0 or volume_gain_db > 16.0:
            print(f"❌ Volume gain validation would fail: {volume_gain_db}")
            return False
        
        print("✅ All parameter validations pass")
        
        # Try the actual synthesis
        audio_data = tts_service.synthesize_speech_base64(
            text=text,
            voice_type=voice_type,
            speaking_rate=speaking_rate,
            pitch=pitch,
            volume_gain_db=volume_gain_db
        )
        
        print(f"✅ Synthesis successful! Audio size: {len(audio_data)} chars")
        return True
        
    except Exception as e:
        print(f"❌ Synthesis failed: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def check_environment():
    """Check if required environment variables are set"""
    
    print("\n🌍 Checking Environment")
    print("=" * 50)
    
    # Check for Google Cloud credentials
    gcp_key_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if gcp_key_path:
        print(f"✅ GOOGLE_APPLICATION_CREDENTIALS set: {gcp_key_path}")
        if os.path.exists(gcp_key_path):
            print(f"✅ Credentials file exists")
        else:
            print(f"❌ Credentials file not found: {gcp_key_path}")
    else:
        print("⚠️ GOOGLE_APPLICATION_CREDENTIALS not set")
        print("   This might cause authentication issues")
    
    # Check other environment variables
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
    if project_id:
        print(f"✅ GOOGLE_CLOUD_PROJECT set: {project_id}")
    else:
        print("⚠️ GOOGLE_CLOUD_PROJECT not set (may be optional)")

if __name__ == "__main__":
    print("🔍 TTS Debug Analysis")
    print("=" * 50)
    
    # Check environment first
    check_environment()
    
    # Test TTS service
    if test_tts_service():
        print("\n✅ TTS service is working")
    else:
        print("\n❌ TTS service has issues")
    
    # Test API request format
    if test_api_request_format():
        print("\n✅ API request format is correct")
    else:
        print("\n❌ API request format has issues")
    
    print("\n" + "=" * 50)
    print("🔍 Debug Analysis Complete")
    
    print("\n💡 Common causes of 400 errors:")
    print("1. Empty or missing 'text' parameter")
    print("2. Invalid parameter values (out of range)")
    print("3. Missing Google Cloud credentials")
    print("4. Invalid JSON format in request")
    print("5. Content-Type header missing or incorrect")
    
    print("\n🔧 To fix the 400 error:")
    print("1. Check if text is actually being sent from frontend")
    print("2. Verify selectedVoice variable is defined")
    print("3. Check browser dev tools for the actual request")
    print("4. Add console.log to see what's being sent") 