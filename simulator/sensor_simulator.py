import json
import time
import random
from datetime import datetime, timezone
from kafka import KafkaProducer
import os

KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVER", "localhost:9092")
NUM_SENSORS = int(os.getenv("NUM_SENSORS", "100"))
INTERVAL = float(os.getenv("INTERVAL_SECONDS", "2.0"))

print(f"Connecting to Kafka at {KAFKA_BROKER}...")
producer = None
while not producer:
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
    except Exception as e:
        print(f"Waiting for Kafka connection... ({e})")
        time.sleep(2)

print("Kafka connected. Initiating sensor simulation loop...")

# Device profiles
devices = [
    {
        "id": f"CONT-SENSOR-{i:03d}",
        "type": "pharma_reefer" if i % 2 == 0 else "vaccine_storage",
        "base_temp": 4.5 if i % 2 == 0 else -20.0,
        "lat": 6.9271 + (random.uniform(-0.1, 0.1)),
        "lon": 79.8612 + (random.uniform(-0.1, 0.1)),
        "battery": random.randint(85, 100)
    }
    for i in range(1, NUM_SENSORS + 1)
]

while True:
    for dev in devices:
        # Induce occasional anomalous spikes (2% chance)
        is_spike = random.random() < 0.02
        if is_spike:
            temp = dev["base_temp"] + random.uniform(6.0, 10.0)
            door = True
        else:
            temp = round(dev["base_temp"] + random.uniform(-0.5, 0.5), 2)
            door = random.random() < 0.05

        payload = {
            "device_id": dev["id"],
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "temperature": round(temp, 2),
            "humidity": round(random.uniform(45.0, 65.0), 2),
            "door_open": door,
            "battery_level": dev["battery"],
            "latitude": round(dev["lat"], 6),
            "longitude": round(dev["lon"], 6)
        }

        producer.send("coldchain-telemetry-raw", value=payload)

    producer.flush()
    time.sleep(INTERVAL)
