import os
import json
import time
import redis
import requests

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

print(f"Initializing Multi-Channel Alert Dispatcher listening to Redis at {REDIS_HOST}...")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe("breach_alerts")

def send_slack_notification(payload):
    if not SLACK_WEBHOOK_URL:
        return

    device_id = payload.get("device_id", "UNKNOWN")
    event_type = payload.get("type", "EXCURSION_ALERT")
    temp_val = payload.get("value", "N/A")
    threshold = payload.get("threshold", "8.0")
    timestamp = payload.get("timestamp", "")
    lat = payload.get("latitude", "N/A")
    lng = payload.get("longitude", "N/A")

    slack_block = {
        "text": f"🚨 *CRITICAL COLD CHAIN EXCURSION*: {device_id}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 Critical Thermal Excursion: {device_id}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Asset ID:*\n`{device_id}`"},
                    {"type": "mrkdwn", "text": f"*Event Type:*\n*{event_type}*"},
                    {"type": "mrkdwn", "text": f"*Recorded Value:*\n`{temp_val}°C`"},
                    {"type": "mrkdwn", "text": f"*Threshold Limit:*\n`{threshold}°C`"},
                    {"type": "mrkdwn", "text": f"*Location:*\n`LAT {lat}, LNG {lng}`"},
                    {"type": "mrkdwn", "text": f"*Timestamp:*\n{timestamp}"}
                ]
            },
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": "⚡ ThermalPulse v2.0 Smart Cold Chain Telemetry Engine"}
                ]
            }
        ]
    }

    try:
        res = requests.post(SLACK_WEBHOOK_URL, json=slack_block, timeout=5)
        print(f"[SLACK DISPATCH] Status: {res.status_code}")
    except Exception as e:
        print(f"[SLACK DISPATCH ERROR] {e}")

def send_telegram_notification(payload):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return

    device_id = payload.get("device_id", "UNKNOWN")
    event_type = payload.get("type", "EXCURSION_ALERT")
    temp_val = payload.get("value", "N/A")
    threshold = payload.get("threshold", "8.0")
    timestamp = payload.get("timestamp", "")

    message_text = (
        f"🚨 *THERMALPULSE EXCURSION ALERT*\n\n"
        f"📦 *Asset:* `{device_id}`\n"
        f"⚠️ *Type:* {event_type}\n"
        f"🌡️ *Temperature:* `{temp_val}°C` (Limit: `{threshold}°C`)\n"
        f"🕒 *Time:* `{timestamp}`\n\n"
        f"⚡ _Immediate WHO Cold Chain Audit Recommended_"
    )

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    telegram_payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": "Markdown"
    }

    try:
        res = requests.post(url, json=telegram_payload, timeout=5)
        print(f"[TELEGRAM DISPATCH] Status: {res.status_code}")
    except Exception as e:
        print(f"[TELEGRAM DISPATCH ERROR] {e}")

print("Subscribed to Redis channel 'breach_alerts'. Awaiting real-time excursion events...")

for message in pubsub.listen():
    if message["type"] == "message":
        try:
            payload = json.loads(message["data"])
            device_id = payload.get("device_id", "UNKNOWN")
            event_type = payload.get("type", "EXCURSION_ALERT")
            
            print(f"[DISPATCHING MULTI-CHANNEL ALERTS] Device: {device_id} | Type: {event_type}")

            # 1. Custom Webhook Dispatch
            if ALERT_WEBHOOK_URL:
                try:
                    requests.post(ALERT_WEBHOOK_URL, json=payload, timeout=5)
                except Exception as err:
                    print(f"[WEBHOOK ERROR] {err}")

            # 2. Slack Block Kit Dispatch
            send_slack_notification(payload)

            # 3. Telegram Bot API Dispatch
            send_telegram_notification(payload)

        except Exception as parse_err:
            print(f"Error parsing breach payload: {parse_err}")
