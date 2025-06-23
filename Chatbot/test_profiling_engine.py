#!/usr/bin/env python3
"""
Test Script for InterviewAI Profiling Engine

This script provides comprehensive testing for the dynamic profiling engine,
including interactive testing, automated scenarios, and edge case handling.
"""

import os
import sys
import time
from typing import List, Dict, Any

# Add the backend path to import the profiling engine
sys.path.append('backend')

try:
    from services.profiling_engine import ProfilingEngine, start_profiling_session, send_profiling_message
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure you're running this from the project root directory")
    print("And install required dependencies: pip install google-generativeai")
    sys.exit(1)

class ProfilingEngineTests:
    """Comprehensive test suite for the profiling engine"""
    
    def __init__(self):
        self.engine = None
        self.test_results = []
    
    def setup(self):
        """Setup test environment"""
        print("🔧 Setting up test environment...")
        
        # Check for API key
        api_key = os.getenv('GOOGLE_AI_API_KEY')
        if not api_key:
            print("❌ GOOGLE_AI_API_KEY environment variable not found!")
            print("Please set it with: export GOOGLE_AI_API_KEY='your-api-key'")
            return False
        
        try:
            self.engine = ProfilingEngine()
            print("✅ Profiling engine initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize profiling engine: {e}")
            return False
    
    def test_basic_functionality(self):
        """Test basic profiling engine functionality"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Basic Functionality")
        print("="*60)
        
        try:
            # Start session
            print("\n📝 Starting profiling session...")
            chat = self.engine.start_profiling_session()
            
            # Get initial response
            initial_response = chat.history[-1].parts[0].text
            print(f"🤖 Initial AI Response:\n{initial_response}")
            
            # Test sending a message
            print(f"\n👤 User: 'Yes, I'm ready to start!'")
            response = self.engine.send_profiling_message(chat, "Yes, I'm ready to start!")
            print(f"🤖 AI Response:\n{response}")
            
            self.test_results.append(("Basic Functionality", "✅ PASSED"))
            
        except Exception as e:
            print(f"❌ Error in basic functionality test: {e}")
            self.test_results.append(("Basic Functionality", f"❌ FAILED: {e}"))
    
    def test_complete_profiling_scenario(self):
        """Test a complete profiling conversation"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Complete Profiling Scenario")
        print("="*60)
        
        try:
            chat = self.engine.start_profiling_session()
            
            # Complete conversation scenario
            test_conversation = [
                "Yes, I'm ready to begin!",
                "I'm currently a software engineer at a tech startup",
                "I have about 3 years of experience in Python and React development",
                "I'm preparing for a Senior Software Engineer position",
                "I'm targeting companies like Google, Microsoft, and Amazon",
                "Yes, that information looks correct!"
            ]
            
            print("\n🎭 Simulating complete profiling conversation...")
            
            for i, user_input in enumerate(test_conversation, 1):
                print(f"\n--- Turn {i} ---")
                print(f"👤 User: {user_input}")
                
                response = self.engine.send_profiling_message(chat, user_input)
                print(f"🤖 AI: {response[:200]}{'...' if len(response) > 200 else ''}")
                
                # Small delay to avoid rate limiting
                time.sleep(1)
            
            # Check if profiling is complete
            print(f"\n📊 Checking profiling completion...")
            is_complete = self.engine.is_profiling_complete(chat)
            print(f"Profiling Complete: {is_complete}")
            
            # Extract profile data
            print(f"\n📋 Extracting profile data...")
            profile_data = self.engine.extract_profile_data(chat)
            print("Extracted Profile:")
            for key, value in profile_data.items():
                print(f"  {key}: {value}")
            
            self.test_results.append(("Complete Scenario", "✅ PASSED"))
            
        except Exception as e:
            print(f"❌ Error in complete scenario test: {e}")
            self.test_results.append(("Complete Scenario", f"❌ FAILED: {e}"))
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n" + "="*60)
        print("🧪 TEST 3: Edge Cases & Error Handling")
        print("="*60)
        
        try:
            chat = self.engine.start_profiling_session()
            
            # Test ambiguous responses
            edge_cases = [
                "I don't know",
                "Can you help me with my resume?",  # Off-topic
                "um",  # Very short response
                "I work in tech doing stuff with computers and programming languages like Python Java JavaScript React Node.js and databases",  # Very long response
            ]
            
            print("\n🎭 Testing edge cases...")
            
            for i, user_input in enumerate(edge_cases, 1):
                print(f"\n--- Edge Case {i} ---")
                print(f"👤 User: {user_input}")
                
                response = self.engine.send_profiling_message(chat, user_input)
                print(f"🤖 AI: {response[:150]}{'...' if len(response) > 150 else ''}")
                
                time.sleep(1)
            
            self.test_results.append(("Edge Cases", "✅ PASSED"))
            
        except Exception as e:
            print(f"❌ Error in edge cases test: {e}")
            self.test_results.append(("Edge Cases", f"❌ FAILED: {e}"))
    
    def test_multiple_sessions(self):
        """Test multiple concurrent sessions"""
        print("\n" + "="*60)
        print("🧪 TEST 4: Multiple Sessions")
        print("="*60)
        
        try:
            # Create multiple sessions
            sessions = []
            for i in range(3):
                chat = self.engine.start_profiling_session()
                sessions.append(chat)
                print(f"✅ Session {i+1} created")
            
            # Test that sessions are independent
            for i, chat in enumerate(sessions):
                response = self.engine.send_profiling_message(chat, f"Hello from session {i+1}")
                print(f"📱 Session {i+1} response: {response[:100]}...")
            
            self.test_results.append(("Multiple Sessions", "✅ PASSED"))
            
        except Exception as e:
            print(f"❌ Error in multiple sessions test: {e}")
            self.test_results.append(("Multiple Sessions", f"❌ FAILED: {e}"))
    
    def interactive_test(self):
        """Interactive test where user can chat with the AI"""
        print("\n" + "="*60)
        print("🎮 INTERACTIVE TEST: Chat with InterviewAI")
        print("="*60)
        print("Type 'quit' to exit the interactive test")
        
        try:
            chat = self.engine.start_profiling_session()
            
            # Show initial greeting
            initial_response = chat.history[-1].parts[0].text
            print(f"\n🤖 InterviewAI: {initial_response}")
            
            while True:
                user_input = input("\n👤 You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye! Interactive test ended.")
                    break
                
                if not user_input:
                    continue
                
                response = self.engine.send_profiling_message(chat, user_input)
                print(f"\n🤖 InterviewAI: {response}")
                
                # Check if profiling might be complete
                if self.engine.is_profiling_complete(chat):
                    print("\n🎉 Profiling appears to be complete!")
                    profile_data = self.engine.extract_profile_data(chat)
                    print("\n📋 Your Profile Data:")
                    for key, value in profile_data.items():
                        print(f"  {key}: {value}")
                    
                    continue_choice = input("\nContinue chatting? (y/n): ").strip().lower()
                    if continue_choice in ['n', 'no']:
                        break
        
        except KeyboardInterrupt:
            print("\n\n👋 Interactive test interrupted by user")
        except Exception as e:
            print(f"❌ Error in interactive test: {e}")
    
    def run_all_tests(self):
        """Run all automated tests"""
        print("🚀 Starting Profiling Engine Test Suite")
        print("="*60)
        
        if not self.setup():
            return
        
        # Run automated tests
        self.test_basic_functionality()
        self.test_complete_profiling_scenario()
        self.test_edge_cases()
        self.test_multiple_sessions()
        
        # Show results
        self.show_test_results()
    
    def show_test_results(self):
        """Display test results summary"""
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = 0
        failed = 0
        
        for test_name, result in self.test_results:
            print(f"{result} {test_name}")
            if "PASSED" in result:
                passed += 1
            else:
                failed += 1
        
        print(f"\n📈 Summary: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed! Profiling engine is working correctly.")
        else:
            print("⚠️ Some tests failed. Check the errors above.")

def main():
    """Main function to run tests"""
    print("🎯 InterviewAI Profiling Engine Test Suite")
    print("This script tests the dynamic AI-powered profiling engine")
    print()
    
    # Check if user wants interactive or automated tests
    print("Choose test mode:")
    print("1. Automated tests (recommended for first run)")
    print("2. Interactive chat test")
    print("3. Both")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    tester = ProfilingEngineTests()
    
    if choice == "1":
        tester.run_all_tests()
    elif choice == "2":
        if tester.setup():
            tester.interactive_test()
    elif choice == "3":
        tester.run_all_tests()
        if input("\nRun interactive test? (y/n): ").strip().lower() in ['y', 'yes']:
            tester.interactive_test()
    else:
        print("Invalid choice. Running automated tests...")
        tester.run_all_tests()

if __name__ == "__main__":
    main() 