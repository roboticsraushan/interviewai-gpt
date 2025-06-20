from flask import Blueprint, request, jsonify
from services.profile_builder import extract_profile

onboarding_bp = Blueprint('onboarding', __name__)

@onboarding_bp.route('/', methods=['POST'])
def onboarding():
    data = request.get_json()
    transcript = data.get("message", "")

    if not transcript:
        return jsonify({"error": "Empty message"}), 400

    profile_data = extract_profile(transcript)

    if "error" in profile_data:
        return jsonify({"echo": profile_data["raw_response"]})  # fallback

    # Create a summary string from extracted fields
    summary = f"You are a {profile_data['role']} with {profile_data['experience']} experience, aiming to {profile_data['goal']}."

    return jsonify({
        "profile": {
            "summary": summary
        }
    })
