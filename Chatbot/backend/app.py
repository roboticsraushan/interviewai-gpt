from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Initialize Flask app with correct static path
app = Flask(__name__, static_folder="static", static_url_path="/")
CORS(app)  # Enable CORS

# Secret key (optional fallback)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "default_secret_key")

# Setup Socket.IO with CORS
socketio = SocketIO(app, cors_allowed_origins="*")

# Import and register Blueprints
from routes.onboarding import onboarding_bp
from routes.simulate import simulate_bp, register_socketio_handlers
from routes.feedback import feedback_bp

app.register_blueprint(onboarding_bp, url_prefix="/onboarding")
app.register_blueprint(simulate_bp, url_prefix="/interview/simulate")
app.register_blueprint(feedback_bp, url_prefix="/interview/feedback")

# Register WebSocket handlers
register_socketio_handlers(socketio)

# Serve React frontend build from /app/static
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    static_dir = app.static_folder
    target_path = os.path.join(static_dir, path)

    if path and os.path.exists(target_path):
        return send_from_directory(static_dir, path)
    else:
        return send_from_directory(static_dir, "index.html")

@app.route('/manifest.json')
def manifest():
    return send_from_directory(app.static_folder, 'manifest.json', mimetype='application/manifest+json')


# Start the app
if __name__ == "__main__":
    print("🚀 Starting InterviewAI Flask backend + SocketIO + React")
    socketio.run(app, host="0.0.0.0", port=5000)
