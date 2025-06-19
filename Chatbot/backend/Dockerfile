FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
#optional
#ENV FLASK_ENV=development
ENV FLASK_DEBUG=1


# Run Flask app
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]

