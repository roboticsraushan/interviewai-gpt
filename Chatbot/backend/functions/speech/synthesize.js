const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Create a client
const client = new textToSpeech.TextToSpeechClient();

// Available Voices:
// Neural2 (Highest Quality):
// Priya - Premium female voice
// Arjun - Premium male voice
// Meera - Alternative female voice
// Vikram - Alternative male voice
// WaveNet (High Quality):
// Kavya - High-quality female voice
// Rohan - High-quality male voice
// Ananya - Alternative female voice
// Aditya - Alternative male voice


// High-quality voice configurations with Indian accent
const VOICE_CONFIGS = {
  // WaveNet voices with Indian accent
  wavenet_male_indian: {
    languageCode: 'en-IN',
    name: 'en-IN-Wavenet-A', // Male voice
    ssmlGender: 'MALE'
  },
  wavenet_female_indian: {
    languageCode: 'en-IN',
    name: 'en-IN-Wavenet-B', // Female voice
    ssmlGender: 'FEMALE'
  },
  wavenet_female_indian_2: {
    languageCode: 'en-IN',
    name: 'en-IN-Wavenet-C', // Another female voice
    ssmlGender: 'FEMALE'
  },
  wavenet_male_indian_2: {
    languageCode: 'en-IN',
    name: 'en-IN-Wavenet-D', // Another male voice
    ssmlGender: 'MALE'
  },
  
  // Neural2 voices with Indian accent (highest quality)
  neural2_male_indian: {
    languageCode: 'en-IN',
    name: 'en-IN-Neural2-A', // Male Neural2 voice
    ssmlGender: 'MALE'
  },
  neural2_female_indian: {
    languageCode: 'en-IN',
    name: 'en-IN-Neural2-B', // Female Neural2 voice
    ssmlGender: 'FEMALE'
  },
  neural2_male_indian_2: {
    languageCode: 'en-IN',
    name: 'en-IN-Neural2-C', // Another male Neural2 voice
    ssmlGender: 'MALE'
  },
  neural2_female_indian_2: {
    languageCode: 'en-IN',
    name: 'en-IN-Neural2-D', // Another female Neural2 voice
    ssmlGender: 'FEMALE'
  }
};

// Default voice (Neural2 female Indian for best quality)
const DEFAULT_VOICE = VOICE_CONFIGS.neural2_male_indian;

/**
 * Synthesize speech using Google Cloud Text-to-Speech with high-quality voices
 * @param {string} text - Text to synthesize
 * @param {string} voiceType - Voice type from VOICE_CONFIGS (optional)
 * @param {number} speakingRate - Speaking rate (0.25-4.0, default 1.0)
 * @param {number} pitch - Pitch (-20.0 to 20.0, default 0.0)
 * @returns {Buffer} Audio buffer
 */
async function synthesizeSpeech(text, voiceType = DEFAULT_VOICE, speakingRate = 0.9, pitch = 0.0) {
  try {
    // Get voice configuration
    const voiceConfig = VOICE_CONFIGS[voiceType] || DEFAULT_VOICE;
    
    // Construct the request
    const request = {
      input: { text: text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speakingRate,
        pitch: pitch,
        volumeGainDb: 0.0,
        sampleRateHertz: 24000, // High quality sample rate
        effectsProfileId: ['headphone-class-device'] // Optimize for headphones
      },
    };

    console.log(`🗣️ Synthesizing speech with voice: ${voiceConfig.name}`);
    console.log(`📝 Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    
    console.log(`✅ Speech synthesis completed. Audio size: ${response.audioContent.length} bytes`);
    
    return response.audioContent;
  } catch (error) {
    console.error('❌ Error synthesizing speech:', error);
    throw error;
  }
}

/**
 * Synthesize speech and save to file
 * @param {string} text - Text to synthesize
 * @param {string} outputPath - Output file path
 * @param {string} voiceType - Voice type (optional)
 * @param {number} speakingRate - Speaking rate (optional)
 * @param {number} pitch - Pitch (optional)
 */
async function synthesizeSpeechToFile(text, outputPath, voiceType, speakingRate, pitch) {
  try {
    const audioContent = await synthesizeSpeech(text, voiceType, speakingRate, pitch);
    
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(outputPath, audioContent, 'binary');
    
    console.log(`🎵 Audio content written to file: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ Error saving speech to file:', error);
    throw error;
  }
}

/**
 * Get available voice configurations
 */
function getAvailableVoices() {
  return VOICE_CONFIGS;
}

/**
 * Test synthesis with different voices
 */
async function testVoices(text = "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview.") {
  console.log('🧪 Testing different voice configurations...');
  
  for (const [voiceType, config] of Object.entries(VOICE_CONFIGS)) {
    try {
      console.log(`\n🎙️ Testing voice: ${voiceType} (${config.name})`);
      const audioContent = await synthesizeSpeech(text, voiceType);
      console.log(`✅ ${voiceType}: Success - ${audioContent.length} bytes`);
    } catch (error) {
      console.error(`❌ ${voiceType}: Failed - ${error.message}`);
    }
  }
}

module.exports = {
  synthesizeSpeech,
  synthesizeSpeechToFile,
  getAvailableVoices,
  testVoices,
  VOICE_CONFIGS,
  DEFAULT_VOICE
};
