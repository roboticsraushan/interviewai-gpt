# Stage 1: Build React frontend
FROM node:18 as builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend . 
RUN npm run build

# Stage 2: Flask backend
FROM python:3.10-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y gcc g++ libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/. .

# Copy frontend build from builder
COPY --from=builder /frontend/build ./static

# Flask config
ENV FLASK_APP=app.py
ENV FLASK_RUN_PORT=5000
ENV FLASK_ENV=0

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
