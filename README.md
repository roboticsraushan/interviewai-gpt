# interviewai
InterviewAI is building the world’s most personalized AI interview coach – reinventing how individuals prepare for their careers. Unlike traditional prep tools, our product is designed as a voice-based AI coach that simulates real interviews with contextual feedback, enabling users to practice anytime, anywhere, on WhatsApp



## Google cloud Setup

### ```gcloud init```

### ``` gcloud capture instances list```

## Google Cloud ssh

### ``` gcloud compute ssh interviewai --zone us-central1-f



## Docker 


```
sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

```

### 
```
docker build -t interviewai .
docker run -p 5000:5000 --env-file .env interviewai
```


### Env variables need to set ( .env file) 
TWILIO_ACCOUNT_SID=xxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1415238886  # Twilio Voice-enabled number
MY_PHONE_NUMBER=+918340783568 # Your personal verified phone number
