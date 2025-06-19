import json
import re
from services.gemini_client import run_gemini_prompt

def extract_profile(transcript):
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
