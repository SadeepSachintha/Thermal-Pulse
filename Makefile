.PHONY: up down logs status db-shell test-mkt test-shelflife live-fleet hourly-summary redis-inspect telemetry-sample dev-frontend clean

up:
	docker compose up -d --build

down:
	docker compose down -v

logs:
	docker compose logs -f

status:
	docker compose ps

db-shell:
	docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db

test-mkt:
	docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT calculate_mkt('CONT-SENSOR-001', NOW() - INTERVAL '1 hour', NOW());"

hourly-summary:
	docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT * FROM telemetry_hourly_summary ORDER BY bucket DESC LIMIT 10;"

redis-inspect:
	docker compose exec redis redis-cli HGETALL device:CONT-SENSOR-001:latest

telemetry-sample:
	docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT recorded_at, device_id, temperature, door_open, ST_AsText(location) FROM sensor_telemetry ORDER BY recorded_at DESC LIMIT 10;"

dev-frontend:
	cd frontend && cmd /c npm run dev

clean:
	docker compose down --remove-orphans -v
