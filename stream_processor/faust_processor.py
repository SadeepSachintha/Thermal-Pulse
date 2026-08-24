import os
import faust
import psycopg2
from datetime import datetime
import json
import redis

# Configuration
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVER", "kafka:29092")
DB_HOST = os.getenv("DB_HOST", "timescaledb")
DB_USER = os.getenv("DB_USER", "thermal_user")
DB_PASS = os.getenv("DB_PASSWORD", "thermal_password")
DB_NAME = os.getenv("DB_NAME", "thermal_pulse_db")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")

r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

# Define Faust App
app = faust.App(
    "thermal-pulse-processor",
    broker=f"kafka://{KAFKA_BROKER}",
    value_serializer="json",
)

class TelemetryPayload(faust.Record, serializer="json"):
    device_id: str
    recorded_at: str
    temperature: float
    humidity: float
    door_open: bool
    battery_level: int
    latitude: float
    longitude: float

raw_topic = app.topic("coldchain-telemetry-raw", value_type=TelemetryPayload)

# Threshold rules for validation
DEFAULT_MAX_TEMP = 8.0
DEFAULT_MIN_TEMP = 2.0

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME
    )

@app.agent(raw_topic)
async def process_telemetry(stream):
    conn = get_db_connection()
    cursor = conn.cursor()

    async for event in stream:
        # 1. Update Hot-State in Redis (In-memory latest snapshot)
        r.hset(
            f"device:{event.device_id}:latest",
            mapping={
                "device_id": event.device_id,
                "temp": event.temperature,
                "humidity": event.humidity,
                "door": "1" if event.door_open else "0",
                "battery": event.battery_level,
                "lat": event.latitude,
                "lng": event.longitude,
                "updated_at": event.recorded_at
            }
        )

        # Add to global set of active devices for fast fleet querying
        r.sadd("active_devices", event.device_id)

        # 2. Persist to TimescaleDB Hypertable with PostGIS Location Point
        cursor.execute(
            """
            INSERT INTO sensor_telemetry 
            (recorded_at, device_id, temperature, humidity, door_open, battery_level, latitude, longitude, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326));
            """,
            (
                event.recorded_at,
                event.device_id,
                event.temperature,
                event.humidity,
                event.door_open,
                event.battery_level,
                event.latitude,
                event.longitude,
                event.longitude,
                event.latitude
            )
        )

        # 3. Real-Time Excursion Detection & Threshold Tripping
        if event.temperature > DEFAULT_MAX_TEMP:
            cursor.execute(
                """
                INSERT INTO excursion_logs 
                (device_id, excursion_type, recorded_value, threshold_limit, started_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (event.device_id, "TEMP_SPIKE", event.temperature, DEFAULT_MAX_TEMP, event.recorded_at, True)
            )
            # Push instant breach event to Redis Pub/Sub for WebSockets / Alert Dispatcher
            r.publish("breach_alerts", json.dumps({
                "device_id": event.device_id,
                "type": "CRITICAL_TEMPERATURE_SPIKE",
                "value": event.temperature,
                "threshold": DEFAULT_MAX_TEMP,
                "latitude": event.latitude,
                "longitude": event.longitude,
                "timestamp": event.recorded_at
            }))

        # 4. PostGIS Geofence Spatial Validation Check
        cursor.execute(
            """
            SELECT COUNT(*) 
            FROM geofences 
            WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(%s, %s), 4326));
            """,
            (event.longitude, event.latitude)
        )
        in_geofence = cursor.fetchone()[0] > 0

        if not in_geofence:
            # Device is outside designated safe zones
            r.publish("breach_alerts", json.dumps({
                "device_id": event.device_id,
                "type": "GEOFENCE_BREACH",
                "latitude": event.latitude,
                "longitude": event.longitude,
                "timestamp": event.recorded_at
            }))

        conn.commit()
