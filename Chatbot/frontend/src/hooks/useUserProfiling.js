import { useState, useCallback } from 'react';

// Profiling states
const PROFILING_STATES = {
  WELCOME: 'welcome',
  CURRENT_ROLE: 'current_role',
  EXPERIENCE_LEVEL: 'experience_level',
  TARGET_ROLE: 'target_role',
  TARGET_COMPANY: 'target_company',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed'
};

// Profiling questions
const PROFILING_QUESTIONS = {
  [PROFILING_STATES.WELCOME]: "Hello! I'm InterviewAI, and I'm here to help you practice for your upcoming interview. To give you the most personalized experience, I'd like to learn a bit about you first. This will only take 2-3 minutes. Are you ready to get started?",
  
  [PROFILING_STATES.CURRENT_ROLE]: "Great! Let's start with your background. What's your current role or educational status? For example, are you a student, software engineer, product manager, or in another field?",
  
  [PROFILING_STATES.EXPERIENCE_LEVEL]: "Thanks for sharing that! Now, could you tell me about your experience level? If you're a student, what year are you in and which college? If you're working, how many years of experience do you have in your field?",
  
  [PROFILING_STATES.TARGET_ROLE]: "Perfect! Now, what specific role are you preparing for? For example, are you targeting positions like 'Product Manager', 'Software Engineer', 'Data Analyst', or something else?",
  
  [PROFILING_STATES.TARGET_COMPANY]: "Excellent! Do you have any specific companies in mind that you're targeting? For instance, 'Google', 'Microsoft', 'Razorpay', or 'Amazon'? If not, just say 'no specific company' and that's perfectly fine too.",
  
  [PROFILING_STATES.CONFIRMATION]: "Let me confirm what I've understood about your profile:"
};

export const useUserProfiling = () => {
  const [profilingState, setProfilingState] = useState(PROFILING_STATES.WELCOME);
  const [profileData, setProfileData] = useState({
    role: '',
    experience_level: '',
    target_role: '',
    target_company: '',
    education_details: ''
  });
  const [isProfilingComplete, setIsProfilingComplete] = useState(false);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState('');

  // Entity extraction functions
  const extractCurrentRole = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    // Student patterns
    if (lowerText.includes('student') || lowerText.includes('studying') || lowerText.includes('college') || lowerText.includes('university')) {
      return 'Student';
    }
    
    // Job role patterns
    const rolePatterns = {
      'Software Engineer': ['software engineer', 'developer', 'programmer', 'sde', 'software developer'],
      'Product Manager': ['product manager', 'pm', 'product management'],
      'Data Analyst': ['data analyst', 'analyst', 'data scientist'],
      'Designer': ['designer', 'ui designer', 'ux designer'],
      'Marketing': ['marketing', 'digital marketing', 'marketing manager'],
      'Sales': ['sales', 'sales manager', 'business development'],
      'Consultant': ['consultant', 'consulting'],
      'Fresher': ['fresher', 'graduate', 'recent graduate', 'new graduate']
    };
    
    for (const [role, patterns] of Object.entries(rolePatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return role;
      }
    }
    
    return text.trim(); // Return original if no pattern matches
  }, []);

  const extractExperienceLevel = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    // Student year patterns
    const yearPatterns = ['first year', 'second year', 'third year', 'fourth year', '1st year', '2nd year', '3rd year', '4th year'];
    for (const pattern of yearPatterns) {
      if (lowerText.includes(pattern)) {
        return text.trim();
      }
    }
    
    // College patterns
    const colleges = ['bits', 'iit', 'nit', 'iiit', 'vit', 'manipal', 'srm'];
    for (const college of colleges) {
      if (lowerText.includes(college)) {
        return text.trim();
      }
    }
    
    // Experience patterns
    const expPatterns = [
      { pattern: /(\d+)\s*year/g, type: 'years' },
      { pattern: /(\d+)\s*month/g, type: 'months' },
      { pattern: /fresher|fresh graduate|no experience|0 year/g, type: 'fresher' }
    ];
    
    for (const { pattern, type } of expPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        if (type === 'fresher') return '0 years';
        return match[0];
      }
    }
    
    return text.trim();
  }, []);

  const extractTargetRole = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    const rolePatterns = {
      'Product Manager': ['product manager', 'pm', 'product management', 'product'],
      'Software Engineer': ['software engineer', 'sde', 'developer', 'programmer', 'software developer', 'backend developer', 'frontend developer', 'full stack'],
      'Data Analyst': ['data analyst', 'data scientist', 'analyst', 'business analyst'],
      'Data Scientist': ['data scientist', 'ml engineer', 'machine learning'],
      'Designer': ['designer', 'ui designer', 'ux designer', 'product designer'],
      'Marketing Manager': ['marketing', 'digital marketing', 'marketing manager'],
      'Sales Manager': ['sales', 'sales manager', 'business development'],
      'Consultant': ['consultant', 'consulting', 'strategy consultant'],
      'Research Analyst': ['research analyst', 'research', 'equity research']
    };
    
    for (const [role, patterns] of Object.entries(rolePatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return role;
      }
    }
    
    return text.trim();
  }, []);

  const extractTargetCompany = useCallback((text) => {
    const lowerText = text.toLowerCase();
    
    // Handle "no specific company" responses
    if (lowerText.includes('no specific') || lowerText.includes('not sure') || lowerText.includes('any company') || lowerText.includes('open to')) {
      return 'Open to opportunities';
    }
    
    const companies = {
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
    };
    
    for (const [company, patterns] of Object.entries(companies)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return company;
      }
    }
    
    return text.trim();
  }, []);

  // Process user response based on current state
  const processUserResponse = useCallback((userResponse) => {
    const response = userResponse.trim();
    
    if (!response) return null;
    
    switch (profilingState) {
      case PROFILING_STATES.WELCOME:
        // Check for explicit negative responses
        if (response.toLowerCase().includes('no') || response.toLowerCase().includes('not ready') || response.toLowerCase().includes('maybe later')) {
          return "No problem! When you're ready to start your interview preparation, just let me know and we can begin the profiling process.";
        } else {
          // For any other response (including positive ones), proceed to the next step
          setProfilingState(PROFILING_STATES.CURRENT_ROLE);
          return PROFILING_QUESTIONS[PROFILING_STATES.CURRENT_ROLE];
        }
        
      case PROFILING_STATES.CURRENT_ROLE:
        const role = extractCurrentRole(response);
        setProfileData(prev => ({ ...prev, role }));
        
        if (role.toLowerCase().includes('student')) {
          setProfileData(prev => ({ ...prev, education_details: response }));
        }
        
        setProfilingState(PROFILING_STATES.EXPERIENCE_LEVEL);
        return PROFILING_QUESTIONS[PROFILING_STATES.EXPERIENCE_LEVEL];
        
      case PROFILING_STATES.EXPERIENCE_LEVEL:
        const experienceLevel = extractExperienceLevel(response);
        setProfileData(prev => ({ 
          ...prev, 
          experience_level: experienceLevel,
          education_details: prev.role.toLowerCase().includes('student') ? `${prev.education_details} ${response}`.trim() : prev.education_details
        }));
        
        setProfilingState(PROFILING_STATES.TARGET_ROLE);
        return PROFILING_QUESTIONS[PROFILING_STATES.TARGET_ROLE];
        
      case PROFILING_STATES.TARGET_ROLE:
        const targetRole = extractTargetRole(response);
        setProfileData(prev => ({ ...prev, target_role: targetRole }));
        
        setProfilingState(PROFILING_STATES.TARGET_COMPANY);
        return PROFILING_QUESTIONS[PROFILING_STATES.TARGET_COMPANY];
        
      case PROFILING_STATES.TARGET_COMPANY:
        const targetCompany = extractTargetCompany(response);
        setProfileData(prev => ({ ...prev, target_company: targetCompany }));
        
        setProfilingState(PROFILING_STATES.CONFIRMATION);
        return generateConfirmationMessage();
        
      case PROFILING_STATES.CONFIRMATION:
        if (response.toLowerCase().includes('yes') || response.toLowerCase().includes('correct') || response.toLowerCase().includes('right')) {
          setProfilingState(PROFILING_STATES.COMPLETED);
          setIsProfilingComplete(true);
          return generateCompletionMessage();
        } else {
          return "I'd like to make sure I have your information right. Could you please clarify what needs to be corrected? You can tell me which part is wrong and I'll ask you about it again.";
        }
        
      default:
        return "I'm not sure how to help with that. Let's continue with the profiling process.";
    }
  }, [profilingState, profileData, extractCurrentRole, extractExperienceLevel, extractTargetRole, extractTargetCompany]);

  const generateConfirmationMessage = useCallback(() => {
    const { role, experience_level, target_role, target_company, education_details } = profileData;
    
    let message = PROFILING_QUESTIONS[PROFILING_STATES.CONFIRMATION] + "\n\n";
    
    message += `• Current Role: ${role}\n`;
    
    if (education_details) {
      message += `• Education: ${education_details}\n`;
    } else {
      message += `• Experience Level: ${experience_level}\n`;
    }
    
    message += `• Target Role: ${target_role}\n`;
    message += `• Target Company: ${target_company}\n\n`;
    
    message += "Is this information correct? Please say 'yes' if everything looks good, or let me know what needs to be corrected.";
    
    return message;
  }, [profileData]);

  const generateCompletionMessage = useCallback(() => {
    const { target_role, target_company } = profileData;
    
    let message = "Perfect! I now have a complete picture of your background and goals. ";
    
    if (target_company !== 'Open to opportunities') {
      message += `I'll now conduct a personalized interview practice session tailored for the ${target_role} position at ${target_company}. `;
    } else {
      message += `I'll now conduct a personalized interview practice session tailored for ${target_role} positions. `;
    }
    
    message += "This interview will include questions specifically chosen based on your experience level and target role. ";
    message += "I'll ask you 5-7 questions over the next 10-15 minutes. Are you ready to begin your practice interview?";
    
    return message;
  }, [profileData]);

  const getCurrentQuestion = useCallback(() => {
    if (profilingState in PROFILING_QUESTIONS) {
      return PROFILING_QUESTIONS[profilingState];
    }
    return null;
  }, [profilingState]);

  const resetProfiling = useCallback(() => {
    setProfilingState(PROFILING_STATES.WELCOME);
    setProfileData({
      role: '',
      experience_level: '',
      target_role: '',
      target_company: '',
      education_details: ''
    });
    setIsProfilingComplete(false);
    setNeedsClarification(false);
    setClarificationQuestion('');
  }, []);

  return {
    // State
    profilingState,
    profileData,
    isProfilingComplete,
    needsClarification,
    clarificationQuestion,
    
    // Actions
    processUserResponse,
    getCurrentQuestion,
    resetProfiling,
    
    // Utils
    PROFILING_STATES
  };
}; 