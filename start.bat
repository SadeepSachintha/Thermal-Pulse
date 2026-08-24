@echo off
TITLE ThermalPulse - Smart Cold Chain ^& IoT Telemetry Engine
COLOR 0B

:MENU
cls
echo =======================================================================
echo          THERMALPULSE: SMART COLD CHAIN ^& TELEMETRY ENGINE
echo =======================================================================
echo.
echo  [1] Start Full Docker Cluster (EMQX, Kafka, TimescaleDB, Redis, Faust)
echo  [2] Start React Telemetry Dashboard UI (http://localhost:3000)
echo  [3] Start Full Stack (Docker Cluster + React Dashboard UI)
echo  [4] Test WHO Haynes MKT Calculation Query
echo  [5] Query TimescaleDB Continuous Aggregates (1-Hour Rollup)
echo  [6] Inspect Redis Hot Cache Snapshots
echo  [7] View Latest Telemetry Packets with PostGIS Location
echo  [8] Stop All Docker Containers
echo  [9] Exit
echo.
echo =======================================================================
set /p choice=Select an option [1-9]: 

if "%choice%"=="1" goto START_DOCKER
if "%choice%"=="2" goto START_FRONTEND
if "%choice%"=="3" goto START_STACK
if "%choice%"=="4" goto TEST_MKT
if "%choice%"=="5" goto HOURLY_SUMMARY
if "%choice%"=="6" goto REDIS_INSPECT
if "%choice%"=="7" goto TELEMETRY_SAMPLE
if "%choice%"=="8" goto STOP_DOCKER
if "%choice%"=="9" goto EXIT

echo Invalid selection. Please try again.
pause
goto MENU

:START_DOCKER
echo.
echo Checking Docker Desktop daemon connection...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not currently running!
    echo Please launch Docker Desktop from your Start Menu, wait until it starts, and try again.
    echo.
    pause
    goto MENU
)
echo.
echo Starting Docker Compose microservices...
docker compose up -d --build
echo.
pause
goto MENU

:START_FRONTEND
echo.
echo Launching React + Vite Telemetry Dashboard...
start http://localhost:3000
cd frontend
cmd /c npm run dev
pause
goto MENU

:START_STACK
echo.
echo Checking Docker Desktop daemon connection...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Docker Desktop is not currently running.
    echo Launching frontend in Simulator Mode...
    echo.
) else (
    echo Starting Docker Compose cluster...
    docker compose up -d --build
    echo.
)
echo Launching React Dashboard...
start http://localhost:3000
cd frontend
cmd /c npm run dev
pause
goto MENU

:TEST_MKT
echo.
echo Executing WHO Haynes MKT Stored Procedure Test...
docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT calculate_mkt('CONT-SENSOR-001', NOW() - INTERVAL '1 hour', NOW());"
echo.
pause
goto MENU

:HOURLY_SUMMARY
echo.
echo Querying TimescaleDB Continuous Aggregate View...
docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT * FROM telemetry_hourly_summary ORDER BY bucket DESC LIMIT 10;"
echo.
pause
goto MENU

:REDIS_INSPECT
echo.
echo Inspecting Redis Hot Snapshot State for device CONT-SENSOR-001...
docker compose exec redis redis-cli HGETALL device:CONT-SENSOR-001:latest
echo.
pause
goto MENU

:TELEMETRY_SAMPLE
echo.
echo Fetching latest 10 telemetry records with PostGIS spatial point data...
docker compose exec timescaledb psql -U thermal_user -d thermal_pulse_db -c "SELECT recorded_at, device_id, temperature, door_open, ST_AsText(location) FROM sensor_telemetry ORDER BY recorded_at DESC LIMIT 10;"
echo.
pause
goto MENU

:STOP_DOCKER
echo.
echo Stopping all Docker containers...
docker compose down
echo.
pause
goto MENU

:EXIT
echo Exiting ThermalPulse launcher.
exit
