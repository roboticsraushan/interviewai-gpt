from backend.utils.gemini import call_gemini

def run_screening(condition):
    prompt = f"""
You are ScreeningGPT. Ask 5–8 parent-friendly, observable questions to assess {condition} in infants, using IMNCI and WHO guidelines.

Format:
[
  {{ "question": "Is the baby breathing faster than normal?", "type": "yes_no" }},
  ...
]
"""
    response = call_gemini(prompt)
    return eval(response)

