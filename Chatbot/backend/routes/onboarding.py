from flask import Blueprint, request, jsonify
from services.profile_builder import ProfileBuilder
from services.gemini_client import run_gemini_prompt
import json
import re

onboarding_bp = Blueprint('onboarding', __name__)

# Initialize ProfileBuilder
profile_builder = ProfileBuilder()

def extract_profile_legacy(transcript):
    """Legacy function for backward compatibility with existing interview flow"""
    prompt = f"""
You are an assistant that extracts structured data from user text.

The user will describe their professional background and goals. Your task is to extract:
- role (e.g. Software Engineer, Data Scientist)
- experience (e.g. 3 years, 5+ years)
- goal (e.g. Prepare for FAANG interviews)

Respond ONLY in this strict JSON format, no explanation:

{{
  "role": "...",
  "experience": "...",
  "goal": "..."
}}

Here is the input:

"{transcript}"
"""
    result = run_gemini_prompt(prompt)

    # Remove Markdown-style code block if present
    cleaned = re.sub(r"^```json|```$", "", result.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "error": "Failed to parse Gemini output as JSON",
            "raw_response": result
        }

@onboarding_bp.route('/', methods=['POST'])
def onboarding():
    data = request.get_json()
    transcript = data.get("message", "")

    if not transcript:
        return jsonify({"error": "Empty message"}), 400

    # Use legacy extraction for backward compatibility with existing interview flow
    profile_data = extract_profile_legacy(transcript)

    if "error" in profile_data:
        return jsonify({"echo": profile_data["raw_response"]})  # fallback

    # Create a summary string from extracted fields
    summary = f"You are a {profile_data['role']} with {profile_data['experience']} experience, aiming to {profile_data['goal']}."

    return jsonify({
        "profile": {
            "summary": summary
        }
    })
