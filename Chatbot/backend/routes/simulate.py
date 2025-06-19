from flask import Blueprint, request, jsonify

simulate_bp = Blueprint('simulate', __name__)

@simulate_bp.route('/', methods=['POST'])
def simulate_interview():
    try:
        data = request.get_json()

        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request body"}), 400

        question = data['question']

        # Simulate AI response (replace this with actual AI logic later)
        response = f"Thank you for your question: '{question}'. Here's a simulated response."

        return jsonify({
            "question": question,
            "response": response
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

