from fastapi import FastAPI, Request, Form
from fastapi.responses import PlainTextResponse
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")
MY_PHONE = os.getenv("MY_PHONE_NUMBER")

client = Client(TWILIO_SID, TWILIO_TOKEN)

@app.post("/whatsapp-webhook")
async def whatsapp_webhook(Body: str = Form(...)):
    message = Body.strip().lower()
    
    if "call me" in message or "ping" in message:
        client.calls.create(
            to="+917022612623",
            from_="+15809521280",
            twiml="""
            <Response>
                <Say voice="Polly.Joanna">Hello! This is a callback triggered by your WhatsApp message.</Say>
            </Response>
            """
        )
        return PlainTextResponse("Calling you now!")
    
    return PlainTextResponse("No action.")

