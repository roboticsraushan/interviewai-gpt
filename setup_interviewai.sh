#!/bin/bash

# Exit on error
set -e
# adding fuzzy finder
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# Update & install core packages
echo "Updating system and installing packages..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm postgresql postgresql-contrib nginx git

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv ~/myvenv
source ~/myvenv/bin/activate

# Clone the GitHub repo
#echo "Cloning InterviewAI repo..."
#cd ~
#git clone https://github.com/YOUR_USERNAME/interviewai-mvp.git

# Install backend dependencies
echo "Installing backend Python dependencies..."
cd ~/interviewai-gpt/Chatbot/backend
pip install -r req.txt

# Build frontend
echo "Installing and building frontend..."
cd ../frontend
npm install
npm run build

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root /home/$USER/interviewai-gpt/Chatbot/frontend/build;
        index index.html index.htm;
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Setup complete!"
echo "👉 Activate your Python environment: source ~/myvenv/bin/activate"
echo "👉 Then run Gunicorn: gunicorn -b 127.0.0.1:5000 app:app (from backend dir)"

