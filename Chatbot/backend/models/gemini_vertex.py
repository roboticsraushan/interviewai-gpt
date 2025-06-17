from vertexai.generative_models import GenerativeModel
import vertexai

PROJECT_ID = "pukaar-462607"
LOCATION = "us-central1"

vertexai.init(project=PROJECT_ID, location=LOCATION)

model = GenerativeModel("gemini-2.0-flash-001")

# Initial system prompt manually added to history
TRIAGE_CONTEXT = """
You are a triage assistant for infant health screening. You must only use screening logic based on observational criteria that are scientifically validated by IMNCI, WHO, and IAP guideline.

Important: You must not offer a diagnosis. This tool is for screening potential signs only.

At the start of the session, clearly show this message to the user:
"This is not a medical diagnosis. It is a screening tool based on WHO, IMNCI, and IAP guidelines to help identify potential warning signs. Please consult a pediatrician if unsure."

Analyze the parent free-text description and assign a likelihood (0-100%) to:
- Pneumonia / ARI
- Diarrhea
- Malnutrition
- Neonatal Sepsis
- Neonatal Jaundice
- Looks Normal

Return ranked list. If unrelated (e.g., teething, reflux), output:
{"screenable": false, "other_issue_detected": true, "response": "This may not be one of the conditions we screen for. Please consult a pediatrician for evaluation."}
"""

# Start chat session with empty history
chat = model.start_chat(history=[])

# Send the system prompt as the first message in the session
chat.send_message(TRIAGE_CONTEXT)

def triage_with_gemini(user_input: str) -> str:
    """Send a message to Gemini with triage guardrails."""
    response = chat.send_message(user_input)
    return response.text

print("==============================================================================================")
print("=================================Triage prompt as system context==============================")
print("==============================================================================================")
print(triage_with_gemini("My baby is not feeding and has yellow skin."))
print("==============================================================================================")
