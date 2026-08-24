import os
import json
import time
import redis
import requests

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL", "")

print(f"Initializing Alert Dispatcher listening to Redis at {REDIS_HOST}...")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)
pubsub = r.pubsub()
pubsub.subscribe("breach_alerts")

print("Subscribed to Redis channel 'breach_alerts'. Awaiting real-time excursion events...")

for message in pubsub.listen():
    if message["type"] == "message":
        try:
            payload = json.loads(message["data"])
            device_id = payload.get("device_id", "UNKNOWN")
            event_type = payload.get("type", "EXCURSION_ALERT")
            timestamp = payload.get("timestamp", "")
            
            print(f"[CRITICAL ALERT DISPATCHED] Device: {device_id} | Type: {event_type} | Time: {timestamp}")
            
            # Forward payload to external Webhook / Alerting endpoint if configured
            if WEBHOOK_URL:
                try:
                    response = requests.post(WEBHOOK_URL, json=payload, timeout=5)
                    print(f"Webhook delivered. Status code: {response.status_code}")
                except Exception as req_err:
                    print(f"Failed to post to Webhook: {req_err}")

        except Exception as parse_err:
            print(f"Error parsing breach payload: {parse_err}")
