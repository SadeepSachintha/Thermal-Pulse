-- Enable TimescaleDB & PostGIS Extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Static Asset Registry
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'pharma_reefer', 'vaccine_storage', 'cold_room'
    temp_min_celsius NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
    temp_max_celsius NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
    humidity_max_percent NUMERIC(5, 2) NOT NULL DEFAULT 65.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Time-series Telemetry Hypertable
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    recorded_at TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    temperature NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL,
    door_open BOOLEAN DEFAULT FALSE,
    battery_level SMALLINT NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    location GEOMETRY(Point, 4326)
);

-- Convert to Hypertable partitioned by 1-day intervals
SELECT create_hypertable('sensor_telemetry', 'recorded_at', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_device_time ON sensor_telemetry (device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_location ON sensor_telemetry USING GIST (location);

-- 3. Geofence Zones & Transit Corridors
CREATE TABLE IF NOT EXISTS geofences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL, -- 'SAFE_HUB', 'COLD_CORRIDOR', 'RESTRICTED_ZONE'
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Excursion Logs Table
CREATE TABLE IF NOT EXISTS excursion_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    excursion_type VARCHAR(50) NOT NULL, -- 'TEMP_SPIKE', 'TEMP_DROP', 'DOOR_EXCURSION', 'GEOFENCE_BREACH'
    recorded_value NUMERIC(5, 2) NOT NULL,
    threshold_limit NUMERIC(5, 2) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Mean Kinetic Temperature (MKT) Haynes Formula Stored Function
-- ΔH/R = 10000 K (standard activation energy constant for pharmaceuticals)
CREATE OR REPLACE FUNCTION calculate_mkt(device_id_input VARCHAR, start_range TIMESTAMPTZ, end_range TIMESTAMPTZ)
RETURNS NUMERIC AS $$
DECLARE
    delta_h_over_r CONSTANT NUMERIC := 10000.0;
    sum_exp NUMERIC;
    sample_count BIGINT;
    mkt_kelvin NUMERIC;
    mkt_celsius NUMERIC;
BEGIN
    SELECT 
        COUNT(*),
        SUM(EXP(-delta_h_over_r / (temperature + 273.15)))
    INTO sample_count, sum_exp
    FROM sensor_telemetry
    WHERE device_id = device_id_input 
      AND recorded_at BETWEEN start_range AND end_range;

    IF sample_count = 0 OR sum_exp = 0 THEN
        RETURN NULL;
    END IF;

    mkt_kelvin := delta_h_over_r / (-LN(sum_exp / sample_count));
    mkt_celsius := mkt_kelvin - 273.15;

    RETURN ROUND(mkt_celsius, 2);
END;
$$ LANGUAGE plpgsql;

-- 6. TimescaleDB Continuous Aggregates View (1-Hour Bucket Rollup)
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly_summary
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', recorded_at) AS bucket,
    device_id,
    COUNT(*) as sample_count,
    MIN(temperature) as min_temp,
    MAX(temperature) as max_temp,
    AVG(temperature) as avg_temp,
    AVG(humidity) as avg_humidity
FROM sensor_telemetry
GROUP BY bucket, device_id;

-- 7. Seed Core Pharma Assets
INSERT INTO assets (id, name, asset_type, temp_min_celsius, temp_max_celsius, humidity_max_percent)
VALUES 
('REEFER-LK-001', 'Colombo Pharma Transit 01', 'pharma_reefer', 2.00, 8.00, 60.00),
('COLDROOM-HUB-04', 'Central Vaccine Vault B', 'vaccine_storage', -25.00, -15.00, 50.00),
('TRUCK-KANDY-09', 'Perishable Freight Unit 9', 'cold_room', 0.00, 4.00, 75.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Safe Logistics Hub Geofence (Colombo Transit Hub Polygon)
INSERT INTO geofences (name, zone_type, boundary)
VALUES (
    'Colombo Western Cold Hub',
    'SAFE_HUB',
    ST_GeomFromText('POLYGON((79.8400 6.9000, 79.9000 6.9000, 79.9000 6.9600, 79.8400 6.9600, 79.8400 6.9000))', 4326)
);
