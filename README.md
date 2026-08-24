# ThermalPulse: Smart Cold Chain & IoT Sensor Telemetry Engine

**ThermalPulse** is an enterprise-grade, high-throughput IoT sensor telemetry processing platform for biopharma cold chain monitoring, WHO/HACCP Mean Kinetic Temperature (MKT) compliance auditing, PostGIS spatial route geofencing, Arrhenius vaccine shelf-life decay prediction, multi-channel alerting, and real-time interactive telemetry visualization.

---

## 1-Click Windows Launcher (`start.bat`)

For 1-click execution on Windows, double-click [`start.bat`](file:///d:/xampp/htdocs/Thermal%20Pulse/start.bat) or run in CMD:

```cmd
start.bat
```

### Launcher Interactive Menu Options:
1. **Start Full Docker Cluster** (EMQX, Kafka, TimescaleDB, Redis, Faust Processor, Simulator, Alert Dispatcher)
2. **Start React Telemetry Dashboard UI** (Opens `http://localhost:3000`)
3. **Start Full Stack** (Cluster + React Dashboard UI)
4. **Test WHO Haynes MKT Calculation Query**
5. **Query TimescaleDB Continuous Aggregates** (1-Hour Rollup)
6. **Inspect Redis Hot Cache Snapshots**
7. **View Telemetry Packets with PostGIS Location**
8. **Stop All Docker Containers**

---

## System Architecture

```text
[ 100 IoT Sensors / Simulator ] 
          │ (JSON Telemetry Stream)
          ▼
   [ Apache Kafka (KRaft) ]
          │ (Topic: coldchain-telemetry-raw)
          ▼
[ Faust Python Stream Processor ] ───► [ Redis Hot Cache & Pub/Sub ] ───► [ Alert Dispatcher Microservice ]
          │                                                                      │ (Slack Block Kit & Telegram API)
          ▼                                                                      ▼
 [ TimescaleDB Hypertable & PostGIS ] ◄────────────────────────────────  [ Live React Dashboard UI ]
 (Daily Chunk Partitioning & Rollups)                                    (Leaflet Map, Chart.js & MKT Analytics)
          ▲
          │ (Haynes MKT & Arrhenius Queries)
 [ Laravel 12 API Backend ]
```

### Core Stack & Technologies
- **MQTT Broker**: EMQX 5.8.0 (Ports `1883`, `18083`)
- **Event Streaming**: Apache Kafka 7.6.1 KRaft Mode (Ports `9092`, `29092`)
- **Time-Series & Spatial Database**: TimescaleDB (PostgreSQL 16 + TimescaleDB + PostGIS)
- **In-Memory Hot Store & Messaging**: Redis 7.2 Alpine
- **Stream Processing Engine**: Faust Python Stream Processor (`faust-streaming`)
- **Alert Dispatcher**: Python Async Multi-Channel Worker (Slack Webhooks & Telegram Bot API)
- **API Backend**: PHP 8.2+ / Laravel 12 (Eloquent, MKT Calculator, Shelf-Life Predictor, Geofence Service, Audit Exporter)
- **Frontend Dashboard**: React + Vite + Tailwind CSS + Leaflet + Chart.js (Port `3000`)

---

## Directory Structure

```text
Thermal Pulse/
├── start.bat                       # 1-Click interactive Windows launcher batch script
├── docker-compose.yml              # Multi-container orchestration stack
├── Makefile                        # Developer CLI management shortcuts
├── README.md                       # Complete technical documentation
├── db/
│   └── init.sql                    # TimescaleDB hypertable, PostGIS geofences, MKT function, continuous aggregates
├── simulator/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── sensor_simulator.py         # 100-device IoT Kafka producer
├── stream_processor/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── faust_processor.py          # Faust streaming analytics & PostGIS spatial validation worker
├── alert_service/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── alert_dispatcher.py         # Multi-channel Slack Block Kit & Telegram Bot alert dispatcher
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/TelemetryController.php
│   │   ├── Models/Asset.php
│   │   ├── Models/ExcursionLog.php
│   │   ├── Services/AuditReportGenerator.php
│   │   ├── Services/GeofenceService.php
│   │   ├── Services/MktCalculator.php
│   │   ├── Services/RedisSnapshotService.php
│   │   └── Services/ShelfLifePredictor.php
│   ├── composer.json
│   └── routes/api.php
├── frontend/                       # React + Vite + Tailwind CSS + Leaflet + Chart.js Dashboard
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── FleetOverviewCards.jsx
│       │   ├── LiveTelemetryMap.jsx
│       │   ├── BreachAlertsStream.jsx
│       │   ├── AssetDetailModal.jsx
│       │   ├── GeofenceEditorModal.jsx
│       │   ├── TelemetryChart.jsx
│       │   ├── MktCalculatorWidget.jsx
│       │   └── ShelfLifePredictorWidget.jsx
│       └── services/
│           └── mockDataGenerator.js
└── k8s/                            # Kubernetes Helm Deployment Manifests
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        └── deployment-thermalpulse.yaml
```

---

## Database Schemas & Stored Functions

### 1. Mean Kinetic Temperature (MKT) Haynes Equation Stored Function
TimescaleDB executes the PL/pgSQL function `calculate_mkt(device_id_input, start_range, end_range)` applying the Haynes equation ($\Delta H / R = 10000.0\text{ K}$):

$$T_{\text{mkt}} = \frac{\Delta H / R}{-\ln \left( \frac{1}{n} \sum_{i=1}^n e^{-\frac{\Delta H / R}{T_i + 273.15}} \right)} - 273.15$$

### 2. Arrhenius Biopharma Vaccine Degradation Model
Evaluates cumulative thermal degradation against standard storage reference ($5^\circ\text{C}$):

$$k(T) = \exp\left( 10000.0 \cdot \left( \frac{1}{278.15} - \frac{1}{T + 273.15} \right) \right)$$

---

## API Endpoints Reference

### 1. Get WHO/HACCP Excursion Audit Summary
`GET /api/v1/assets/{deviceId}/compliance`

### 2. Export WHO Compliance Audit CSV Report
`GET /api/v1/assets/{deviceId}/export?format=csv`

### 3. Get Biopharma Vaccine Shelf-Life Prediction
`GET /api/v1/assets/{deviceId}/shelflife?nominal_days=180`

### 4. PostGIS Geofence Polygon Management
- `GET /api/v1/geofences` (List GeoJSON polygons)
- `POST /api/v1/geofences` (Create PostGIS polygon)
- `DELETE /api/v1/geofences/{id}` (Remove polygon)

### 5. Get Active Fleet Hot Snapshot State
`GET /api/v1/telemetry/live`

---

## License
MIT License. Developed for ThermalPulse Smart Cold Chain Logistics.
