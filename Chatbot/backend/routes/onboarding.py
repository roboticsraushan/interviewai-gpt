from flask import Blueprint, request, jsonify
from services.profile_builder import extract_profile

onboarding_bp = Blueprint('onboarding', __name__)

@onboarding_bp.route('/', methods=['POST'])
def onboarding():
    try:
        data = request.get_json()
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"error": "Message is required"}), 400

        profile = extract_profile(message)

        return jsonify({
            "status": "success",
            "profile": profile
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

