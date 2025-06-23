"""
InterviewAI Profiling Engine

This module provides a dynamic profiling system that uses Google's Gemini model
to intelligently gather user profile information through natural conversation.
The engine asks contextual questions and adapts based on user responses.
"""

import google.generativeai as genai
import os
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Profiling Context - System Prompt for Gemini
PROFILING_CONTEXT = """
You are InterviewAI, a professional interview preparation assistant. Your primary role is to gather essential profile information from users to provide personalized interview practice sessions.

**Your Objective:**
Collect the following 4 key pieces of information through natural conversation:
1. **Current Role/Status** - What is their current position or educational status?
2. **Experience Level** - How many years of experience do they have? (If student, which year/college?)
3. **Target Role** - What specific position are they preparing for?
4. **Target Company** - Which company/companies are they targeting? (Can be "Open to opportunities")

**Session Flow & Guidelines:**

**INITIAL GREETING:**
- Start with a warm, professional introduction
- Explain that you'll gather some information to personalize their experience
- Ask if they're ready to begin (2-3 minutes process)

**SEQUENTIAL QUESTIONING:**
- Ask ONE question at a time
- Wait for their response before moving to the next topic
- Follow this order: Current Role → Experience → Target Role → Target Company

**QUESTION STYLE:**
- Keep questions conversational and clear
- Provide examples when helpful (e.g., "like Software Engineer, Product Manager, etc.")
- Be encouraging and supportive

**RESPONSE HANDLING:**
- If answer is clear: acknowledge and move to next question
- If ambiguous: politely ask for clarification
- If off-topic: gently redirect back to profiling
- If they seem confused: provide helpful context

**CONFIRMATION PHASE:**
- Once all 4 pieces are collected, summarize their profile
- Ask for confirmation: "Is this information correct?"
- If confirmed: congratulate and explain next steps
- If not confirmed: ask what needs to be corrected

**IMPORTANT CONSTRAINTS:**
- Stay strictly focused on profiling - no general chat
- Don't provide interview advice during profiling
- Don't ask multiple questions in one response
- Be concise but warm in your communication
- If they ask unrelated questions, politely redirect

**COMPLETION SIGNAL:**
When profiling is complete and confirmed, end with:
"Perfect! I now have everything I need. Let's begin your personalized interview practice session!"

Remember: You're building rapport while efficiently gathering information. Be professional but approachable.
"""

class ProfilingEngine:
    """
    Dynamic profiling engine that uses Gemini to gather user profile information
    through intelligent conversation without hardcoded questions.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the profiling engine with Gemini API.
        
        Args:
            api_key: Google AI API key (if not provided, uses environment variable)
        """
        self.api_key = api_key or os.getenv('GOOGLE_AI_API_KEY')
        if not self.api_key:
            raise ValueError("Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass api_key parameter.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Initialize model
        self.model = genai.GenerativeModel('gemini-2.0-flash-001')
        
        logger.info("✅ Profiling Engine initialized successfully")
    
    def start_profiling_session(self) -> genai.ChatSession:
        """
        Initialize a new profiling chat session with the profiling context.
        
        Returns:
            ChatSession: Initialized chat session ready for profiling
        """
        try:
            # Start chat session with the profiling context as system prompt
            chat_session = self.model.start_chat(history=[])
            
            # Send the profiling context as the first message to establish the role
            initial_response = chat_session.send_message(
                f"SYSTEM: {PROFILING_CONTEXT}\n\nUser has just joined. Start the profiling session."
            )
            
            logger.info("🚀 Profiling session started successfully")
            logger.info(f"📝 Initial AI response: {initial_response.text[:100]}...")
            
            return chat_session
            
        except Exception as e:
            logger.error(f"❌ Error starting profiling session: {e}")
            raise
    
    def send_profiling_message(self, chat_session: genai.ChatSession, user_input: str) -> str:
        """
        Send user input to the profiling session and get AI response.
        
        Args:
            chat_session: Active chat session
            user_input: User's message/response
            
        Returns:
            str: AI's response to the user input
        """
        try:
            # Send user message to the chat session
            response = chat_session.send_message(user_input)
            
            logger.info(f"👤 User: {user_input}")
            logger.info(f"🤖 AI: {response.text[:100]}...")
            
            return response.text
            
        except Exception as e:
            logger.error(f"❌ Error sending profiling message: {e}")
            return "I apologize, but I encountered an error. Could you please try again?"
    
    def extract_profile_data(self, chat_session: genai.ChatSession) -> Dict[str, Any]:
        """
        Extract structured profile data from the conversation history.
        
        Args:
            chat_session: Active chat session
            
        Returns:
            Dict containing extracted profile information
        """
        try:
            # Ask Gemini to extract and structure the profile data
            extraction_prompt = """
            Based on our conversation, please extract the user's profile information in the following JSON format:
            {
                "current_role": "their current position or student status",
                "experience_level": "years of experience or education details",
                "target_role": "position they're preparing for",
                "target_company": "company they're targeting or 'Open to opportunities'",
                "profiling_complete": true/false
            }
            
            Only return the JSON, no additional text.
            """
            
            response = chat_session.send_message(extraction_prompt)
            
            # Parse the JSON response
            import json
            try:
                profile_data = json.loads(response.text)
                logger.info("✅ Profile data extracted successfully")
                return profile_data
            except json.JSONDecodeError:
                logger.warning("⚠️ Could not parse profile data as JSON")
                return {
                    "current_role": "Unknown",
                    "experience_level": "Unknown", 
                    "target_role": "Unknown",
                    "target_company": "Unknown",
                    "profiling_complete": False
                }
                
        except Exception as e:
            logger.error(f"❌ Error extracting profile data: {e}")
            return {
                "current_role": "Unknown",
                "experience_level": "Unknown",
                "target_role": "Unknown", 
                "target_company": "Unknown",
                "profiling_complete": False
            }
    
    def is_profiling_complete(self, chat_session: genai.ChatSession) -> bool:
        """
        Check if profiling is complete by analyzing the conversation.
        
        Args:
            chat_session: Active chat session
            
        Returns:
            bool: True if profiling is complete, False otherwise
        """
        try:
            # Ask Gemini to assess if profiling is complete
            completion_check = """
            Based on our conversation, have you successfully gathered all 4 pieces of information:
            1. Current Role/Status
            2. Experience Level
            3. Target Role
            4. Target Company
            
            AND has the user confirmed this information is correct?
            
            Respond with only "COMPLETE" or "INCOMPLETE".
            """
            
            response = chat_session.send_message(completion_check)
            is_complete = "COMPLETE" in response.text.upper()
            
            logger.info(f"📊 Profiling completion status: {'Complete' if is_complete else 'Incomplete'}")
            return is_complete
            
        except Exception as e:
            logger.error(f"❌ Error checking profiling completion: {e}")
            return False

# Convenience functions for easy usage
def start_profiling_session() -> genai.ChatSession:
    """
    Convenience function to start a profiling session.
    
    Returns:
        ChatSession: Initialized profiling session
    """
    engine = ProfilingEngine()
    return engine.start_profiling_session()

def send_profiling_message(chat_session: genai.ChatSession, user_input: str) -> str:
    """
    Convenience function to send a message in a profiling session.
    
    Args:
        chat_session: Active chat session
        user_input: User's message
        
    Returns:
        str: AI's response
    """
    engine = ProfilingEngine()
    return engine.send_profiling_message(chat_session, user_input)

def is_profiling_complete(chat_session: genai.ChatSession) -> bool:
    """
    Convenience function to check if profiling is complete.
    
    Args:
        chat_session: Active chat session
        
    Returns:
        bool: True if profiling is complete
    """
    engine = ProfilingEngine()
    return engine.is_profiling_complete(chat_session)

def extract_profile_data(chat_session: genai.ChatSession) -> Dict[str, Any]:
    """
    Convenience function to extract profile data.
    
    Args:
        chat_session: Active chat session
        
    Returns:
        Dict: Profile data
    """
    engine = ProfilingEngine()
    return engine.extract_profile_data(chat_session)

# Example Usage and Testing
if __name__ == "__main__":
    """
    Example demonstration of the profiling engine in action.
    This shows how the engine dynamically generates questions without hardcoding.
    """
    
    print("🎯 InterviewAI Profiling Engine Demo")
    print("=" * 50)
    
    try:
        # Initialize the profiling engine
        engine = ProfilingEngine()
        
        # Start a profiling session
        print("\n1️⃣ Starting profiling session...")
        chat = engine.start_profiling_session()
        
        # Get the initial greeting (this is dynamically generated by Gemini)
        initial_response = chat.history[-1].parts[0].text
        print(f"\n🤖 InterviewAI: {initial_response}")
        
        # Simulate user interactions
        print("\n2️⃣ Simulating user interactions...")
        
        # Example interaction 1: User says they're ready
        user_input_1 = "Yes, I'm ready to start!"
        print(f"\n👤 User: {user_input_1}")
        response_1 = engine.send_profiling_message(chat, user_input_1)
        print(f"🤖 InterviewAI: {response_1}")
        
        # Example interaction 2: User provides current role
        user_input_2 = "I'm currently a software engineer at a startup"
        print(f"\n👤 User: {user_input_2}")
        response_2 = engine.send_profiling_message(chat, user_input_2)
        print(f"🤖 InterviewAI: {response_2}")
        
        # Example interaction 3: User provides experience
        user_input_3 = "I have about 3 years of experience in backend development"
        print(f"\n👤 User: {user_input_3}")
        response_3 = engine.send_profiling_message(chat, user_input_3)
        print(f"🤖 InterviewAI: {response_3}")
        
        # Example interaction 4: User provides target role
        user_input_4 = "I'm looking for a senior software engineer position"
        print(f"\n👤 User: {user_input_4}")
        response_4 = engine.send_profiling_message(chat, user_input_4)
        print(f"🤖 InterviewAI: {response_4}")
        
        # Example interaction 5: User provides target company
        user_input_5 = "I'm interested in working at Google or Microsoft"
        print(f"\n👤 User: {user_input_5}")
        response_5 = engine.send_profiling_message(chat, user_input_5)
        print(f"🤖 InterviewAI: {response_5}")
        
        # Example interaction 6: User confirms information
        user_input_6 = "Yes, that looks correct!"
        print(f"\n👤 User: {user_input_6}")
        response_6 = engine.send_profiling_message(chat, user_input_6)
        print(f"🤖 InterviewAI: {response_6}")
        
        # Check if profiling is complete
        print("\n3️⃣ Checking profiling completion...")
        is_complete = engine.is_profiling_complete(chat)
        print(f"📊 Profiling Complete: {is_complete}")
        
        # Extract structured profile data
        print("\n4️⃣ Extracting profile data...")
        profile_data = engine.extract_profile_data(chat)
        print("📋 Extracted Profile Data:")
        for key, value in profile_data.items():
            print(f"   {key}: {value}")
        
        print("\n✅ Demo completed successfully!")
        print("\nKey Features Demonstrated:")
        print("- Dynamic question generation (no hardcoded questions)")
        print("- Natural conversation flow")
        print("- Context-aware responses")
        print("- Intelligent information extraction")
        print("- Completion detection")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        print("Make sure you have set the GOOGLE_AI_API_KEY environment variable")

    print("\n" + "=" * 50)
    print("🎯 End of Demo") 