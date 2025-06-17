from backend.utils.gemini import call_gemini

def run_triage(user_input):
    prompt = f"""
You are TriageGPT, screening infant symptoms using IMNCI/WHO/IAP.

Input: {user_input}

Return JSON:
{{
    "respiratory": 30,
    "diarrhea": 10,
    "malnutrition": 10,
    "sepsis": 20,
    "jaundice": 5,
    "looks_normal": 25,
    "outside_scope": false
}}
"""
    response = call_gemini(prompt)
    return eval(response)

