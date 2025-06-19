from flask import Flask
from dotenv import load_dotenv
from flask_cors import CORS  # ✅ import CORS
import os

# Load environment variables from .env file
load_dotenv()

from routes.onboarding import onboarding_bp
from routes.simulate import simulate_bp
from routes.feedback import feedback_bp

app = Flask(__name__)
CORS(app)  # ✅ Enable CORS for all routes

# Optional: Set config from env
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "default_secret_key")

# Register blueprints
app.register_blueprint(onboarding_bp, url_prefix='/onboarding')
app.register_blueprint(simulate_bp, url_prefix='/interview/simulate')
app.register_blueprint(feedback_bp, url_prefix='/interview/feedback')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
