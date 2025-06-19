from vertexai.preview.generative_models import GenerativeModel

def run_gemini_prompt(prompt: str):
    model = GenerativeModel("gemini-2.0-flash-001")
    response = model.generate_content(prompt)
    return response.candidates[0].content.parts[0].text

