# 🔗 Connect AI Profiling System

## Add these 2 lines to `backend/app.py`:

### 1. Import the profiling blueprint:
```python
from routes.profiling import profiling_bp
```

### 2. Register the blueprint:
```python
app.register_blueprint(profiling_bp, url_prefix="/profiling")
```

## Your complete `backend/app.py` should look like:

```python
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
from routes.tts import tts_bp
from routes.profiling import profiling_bp  # ← ADD THIS LINE

app.register_blueprint(onboarding_bp, url_prefix="/onboarding")
app.register_blueprint(simulate_bp, url_prefix="/interview/simulate")
app.register_blueprint(feedback_bp, url_prefix="/interview/feedback")
app.register_blueprint(tts_bp, url_prefix="/tts")
app.register_blueprint(profiling_bp, url_prefix="/profiling")  # ← ADD THIS LINE

# Register WebSocket handlers
register_socketio_handlers(socketio)

# ... rest of your app.py remains the same
```

## 🎯 This will enable these AI profiling endpoints:

- `POST /profiling/start` - Start AI profiling session
- `POST /profiling/message` - Send message to AI
- `GET /profiling/status/<session_id>` - Check session status
- `POST /profiling/complete/<session_id>` - Force completion
- `GET /profiling/health` - Health check

## ✅ Your system is now fully AI-powered!

**No more hardcoded questions** - everything is dynamic and contextual! 🎉 