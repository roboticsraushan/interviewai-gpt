from flask import Blueprint, request, jsonify

feedback_bp = Blueprint('feedback', __name__)

# Example in-memory store for feedback (for demo/testing purposes)
feedback_storage = []

@feedback_bp.route('/', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'feedback' not in data:
        return jsonify({"error": "Missing user_id or feedback in request"}), 400

    feedback_entry = {
        "user_id": data['user_id'],
        "feedback": data['feedback']
    }
    
    feedback_storage.append(feedback_entry)

    return jsonify({"message": "Feedback received", "data": feedback_entry}), 201

@feedback_bp.route('/', methods=['GET'])
def get_feedback():
    return jsonify(feedback_storage), 200
