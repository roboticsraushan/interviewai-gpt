from flask import Blueprint, request, jsonify
from models.gemini_vertex import triage_with_gemini

screen_bp = Blueprint("screen", __name__)

@screen_bp.route("/api/triage", methods=["POST"])
def triage():
    data = request.get_json()
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "Message is required"}), 400

    try:
        result = triage_with_gemini(user_input)
        print(f"[DEBUG] reslut with screen : {result}")
        return jsonify({"result": result})
    except Exception as e:
        print(f"[ERROR] : {e}")
        return jsonify({"error": str(e)}), 500
