import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from services.gemini_client import run_gemini_prompt

class ProfileBuilder:
    def __init__(self):
        self.profiles = {}  # In-memory storage for now
        
    def extract_entities(self, text: str, entity_type: str) -> Dict:
        """Extract entities from user response based on type"""
        text_lower = text.lower()
        
        if entity_type == "role":
            return self._extract_role(text_lower, text)
        elif entity_type == "experience":
            return self._extract_experience(text_lower, text)
        elif entity_type == "target_role":
            return self._extract_target_role(text_lower, text)
        elif entity_type == "target_company":
            return self._extract_target_company(text_lower, text)
        else:
            return {"extracted": text.strip(), "confidence": 0.5}
    
    def _extract_role(self, text_lower: str, original_text: str) -> Dict:
        """Extract current role information"""
        # Student patterns
        if any(keyword in text_lower for keyword in ['student', 'studying', 'college', 'university']):
            return {
                "extracted": "Student",
                "confidence": 0.9,
                "category": "student",
                "raw_text": original_text
            }
        
        # Job role patterns
        role_patterns = {
            'Software Engineer': {
                'keywords': ['software engineer', 'developer', 'programmer', 'sde', 'software developer', 'backend', 'frontend', 'full stack'],
                'confidence': 0.9
            },
            'Product Manager': {
                'keywords': ['product manager', 'pm', 'product management'],
                'confidence': 0.9
            },
            'Data Analyst': {
                'keywords': ['data analyst', 'analyst', 'data scientist'],
                'confidence': 0.8
            },
            'Designer': {
                'keywords': ['designer', 'ui designer', 'ux designer', 'product designer'],
                'confidence': 0.8
            },
            'Marketing': {
                'keywords': ['marketing', 'digital marketing', 'marketing manager'],
                'confidence': 0.8
            },
            'Sales': {
                'keywords': ['sales', 'sales manager', 'business development'],
                'confidence': 0.8
            },
            'Consultant': {
                'keywords': ['consultant', 'consulting'],
                'confidence': 0.8
            },
            'Fresher': {
                'keywords': ['fresher', 'graduate', 'recent graduate', 'new graduate'],
                'confidence': 0.9
            }
        }
        
        for role, config in role_patterns.items():
            if any(keyword in text_lower for keyword in config['keywords']):
                return {
                    "extracted": role,
                    "confidence": config['confidence'],
                    "category": "professional",
                    "raw_text": original_text
                }
        
        return {
            "extracted": original_text.strip(),
            "confidence": 0.5,
            "category": "other",
            "raw_text": original_text
        }
    
    def _extract_experience(self, text_lower: str, original_text: str) -> Dict:
        """Extract experience level information"""
        # Student year patterns
        year_patterns = ['first year', 'second year', 'third year', 'fourth year', 
                        '1st year', '2nd year', '3rd year', '4th year']
        
        for pattern in year_patterns:
            if pattern in text_lower:
                return {
                    "extracted": pattern.title(),
                    "confidence": 0.9,
                    "category": "student_year",
                    "raw_text": original_text
                }
        
        # College patterns
        colleges = ['bits', 'iit', 'nit', 'iiit', 'vit', 'manipal', 'srm', 'delhi university', 'mumbai university']
        for college in colleges:
            if college in text_lower:
                return {
                    "extracted": original_text.strip(),
                    "confidence": 0.9,
                    "category": "college",
                    "raw_text": original_text
                }
        
        # Experience patterns
        year_match = re.search(r'(\d+)\s*year', text_lower)
        if year_match:
            years = int(year_match.group(1))
            return {
                "extracted": f"{years} years",
                "confidence": 0.9,
                "category": "work_experience",
                "years": years,
                "raw_text": original_text
            }
        
        month_match = re.search(r'(\d+)\s*month', text_lower)
        if month_match:
            months = int(month_match.group(1))
            return {
                "extracted": f"{months} months",
                "confidence": 0.9,
                "category": "work_experience",
                "months": months,
                "raw_text": original_text
            }
        
        # Fresher patterns
        if any(keyword in text_lower for keyword in ['fresher', 'fresh graduate', 'no experience', '0 year']):
            return {
                "extracted": "0 years (Fresher)",
                "confidence": 0.9,
                "category": "fresher",
                "raw_text": original_text
            }
        
        return {
            "extracted": original_text.strip(),
            "confidence": 0.5,
            "category": "other",
            "raw_text": original_text
        }
    
    def _extract_target_role(self, text_lower: str, original_text: str) -> Dict:
        """Extract target role information"""
        role_patterns = {
            'Product Manager': {
                'keywords': ['product manager', 'pm', 'product management', 'product'],
                'confidence': 0.9
            },
            'Software Engineer': {
                'keywords': ['software engineer', 'sde', 'developer', 'programmer', 'software developer', 
                           'backend developer', 'frontend developer', 'full stack'],
                'confidence': 0.9
            },
            'Data Analyst': {
                'keywords': ['data analyst', 'data scientist', 'analyst', 'business analyst'],
                'confidence': 0.8
            },
            'Data Scientist': {
                'keywords': ['data scientist', 'ml engineer', 'machine learning'],
                'confidence': 0.9
            },
            'Designer': {
                'keywords': ['designer', 'ui designer', 'ux designer', 'product designer'],
                'confidence': 0.8
            },
            'Marketing Manager': {
                'keywords': ['marketing', 'digital marketing', 'marketing manager'],
                'confidence': 0.8
            },
            'Sales Manager': {
                'keywords': ['sales', 'sales manager', 'business development'],
                'confidence': 0.8
            },
            'Consultant': {
                'keywords': ['consultant', 'consulting', 'strategy consultant'],
                'confidence': 0.8
            },
            'Research Analyst': {
                'keywords': ['research analyst', 'research', 'equity research'],
                'confidence': 0.8
            }
        }
        
        for role, config in role_patterns.items():
            if any(keyword in text_lower for keyword in config['keywords']):
                return {
                    "extracted": role,
                    "confidence": config['confidence'],
                    "category": "target_role",
                    "raw_text": original_text
                }
        
        return {
            "extracted": original_text.strip(),
            "confidence": 0.5,
            "category": "other",
            "raw_text": original_text
        }
    
    def _extract_target_company(self, text_lower: str, original_text: str) -> Dict:
        """Extract target company information"""
        # Handle "no specific company" responses
        if any(phrase in text_lower for phrase in ['no specific', 'not sure', 'any company', 'open to']):
            return {
                "extracted": "Open to opportunities",
                "confidence": 0.9,
                "category": "open",
                "raw_text": original_text
            }
        
        companies = {
            'Google': ['google', 'alphabet'],
            'Microsoft': ['microsoft', 'msft'],
            'Amazon': ['amazon', 'aws'],
            'Meta': ['meta', 'facebook'],
            'Apple': ['apple'],
            'Netflix': ['netflix'],
            'Uber': ['uber'],
            'Airbnb': ['airbnb'],
            'Spotify': ['spotify'],
            'Razorpay': ['razorpay'],
            'Paytm': ['paytm'],
            'Flipkart': ['flipkart'],
            'Zomato': ['zomato'],
            'Swiggy': ['swiggy'],
            'BYJU\'S': ['byjus', 'byju'],
            'Ola': ['ola'],
            'PhonePe': ['phonepe'],
            'Zerodha': ['zerodha'],
            'Freshworks': ['freshworks'],
            'Zoho': ['zoho'],
            'Infosys': ['infosys'],
            'TCS': ['tcs', 'tata consultancy'],
            'Wipro': ['wipro'],
            'Accenture': ['accenture'],
            'Deloitte': ['deloitte'],
            'McKinsey': ['mckinsey'],
            'BCG': ['bcg', 'boston consulting'],
            'Bain': ['bain'],
            'Goldman Sachs': ['goldman sachs', 'goldman'],
            'JP Morgan': ['jp morgan', 'jpmorgan'],
            'Morgan Stanley': ['morgan stanley']
        }
        
        for company, patterns in companies.items():
            if any(pattern in text_lower for pattern in patterns):
                return {
                    "extracted": company,
                    "confidence": 0.9,
                    "category": "specific_company",
                    "raw_text": original_text
                }
        
        return {
            "extracted": original_text.strip(),
            "confidence": 0.5,
            "category": "other_company",
            "raw_text": original_text
        }
    
    def create_profile(self, session_id: str, profile_data: Dict) -> Dict:
        """Create a complete user profile"""
        profile = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "profile_data": profile_data,
            "is_complete": True,
            "metadata": {
                "profiling_completed_at": datetime.now().isoformat(),
                "version": "1.0"
            }
        }
        
        # Store profile
        self.profiles[session_id] = profile
        
        return profile
    
    def get_profile(self, session_id: str) -> Optional[Dict]:
        """Get user profile by session ID"""
        return self.profiles.get(session_id)
    
    def update_profile(self, session_id: str, updates: Dict) -> Optional[Dict]:
        """Update existing profile"""
        if session_id in self.profiles:
            self.profiles[session_id]["profile_data"].update(updates)
            self.profiles[session_id]["metadata"]["last_updated"] = datetime.now().isoformat()
            return self.profiles[session_id]
        return None
    
    def get_profile_summary(self, session_id: str) -> Optional[str]:
        """Get a formatted summary of the user profile"""
        profile = self.get_profile(session_id)
        if not profile:
            return None
        
        data = profile["profile_data"]
        
        summary = f"User Profile Summary:\n"
        summary += f"• Current Role: {data.get('role', 'Not specified')}\n"
        
        if data.get('education_details'):
            summary += f"• Education: {data['education_details']}\n"
        else:
            summary += f"• Experience Level: {data.get('experience_level', 'Not specified')}\n"
        
        summary += f"• Target Role: {data.get('target_role', 'Not specified')}\n"
        summary += f"• Target Company: {data.get('target_company', 'Not specified')}\n"
        
        return summary
    
    def generate_interview_context(self, session_id: str) -> Optional[Dict]:
        """Generate context for personalized interview questions"""
        profile = self.get_profile(session_id)
        if not profile:
            return None
        
        data = profile["profile_data"]
        
        context = {
            "user_background": {
                "current_role": data.get('role', ''),
                "experience_level": data.get('experience_level', ''),
                "education": data.get('education_details', ''),
                "is_student": 'student' in data.get('role', '').lower()
            },
            "target_position": {
                "role": data.get('target_role', ''),
                "company": data.get('target_company', ''),
                "is_specific_company": data.get('target_company', '') != 'Open to opportunities'
            },
            "interview_focus": self._determine_interview_focus(data),
            "difficulty_level": self._determine_difficulty_level(data),
            "question_categories": self._determine_question_categories(data)
        }
        
        return context
    
    def _determine_interview_focus(self, data: Dict) -> List[str]:
        """Determine what the interview should focus on"""
        focus_areas = []
        
        role = data.get('role', '').lower()
        target_role = data.get('target_role', '').lower()
        
        # Role-specific focus
        if 'student' in role:
            focus_areas.extend(['academic_projects', 'internships', 'learning_mindset'])
        elif 'fresher' in data.get('experience_level', '').lower():
            focus_areas.extend(['fresh_graduate_skills', 'projects', 'potential'])
        else:
            focus_areas.extend(['work_experience', 'achievements', 'leadership'])
        
        # Target role focus
        if 'software' in target_role or 'developer' in target_role:
            focus_areas.extend(['technical_skills', 'coding_experience', 'problem_solving'])
        elif 'product' in target_role:
            focus_areas.extend(['product_thinking', 'user_focus', 'analytical_skills'])
        elif 'data' in target_role:
            focus_areas.extend(['analytical_thinking', 'technical_skills', 'business_impact'])
        elif 'marketing' in target_role:
            focus_areas.extend(['creativity', 'market_understanding', 'communication'])
        
        return list(set(focus_areas))  # Remove duplicates
    
    def _determine_difficulty_level(self, data: Dict) -> str:
        """Determine appropriate difficulty level for questions"""
        role = data.get('role', '').lower()
        experience = data.get('experience_level', '').lower()
        
        if 'student' in role or 'fresher' in experience or '0 year' in experience:
            return 'entry_level'
        elif any(year in experience for year in ['1 year', '2 year', '3 year']):
            return 'junior'
        elif any(year in experience for year in ['4 year', '5 year', '6 year', '7 year']):
            return 'mid_level'
        else:
            return 'senior'
    
    def _determine_question_categories(self, data: Dict) -> List[str]:
        """Determine what categories of questions to ask"""
        categories = ['behavioral', 'motivation']  # Always include these
        
        target_role = data.get('target_role', '').lower()
        
        if any(tech_role in target_role for tech_role in ['software', 'developer', 'engineer', 'data']):
            categories.append('technical')
        
        if 'product' in target_role or 'manager' in target_role:
            categories.append('product_case_study')
        
        if data.get('target_company', '') != 'Open to opportunities':
            categories.append('company_specific')
        
        categories.append('situational')
        
        return categories
