from flask import Blueprint, jsonify

follow_up_bp = Blueprint("follow_up", __name__)

@follow_up_bp.route("/options", methods=["GET"])
def follow_up_options():
    return jsonify({
        "options": [
            "Book an online consultation",
            "Find nearby pediatrician"
        ]
    })

