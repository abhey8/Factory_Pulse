# FactoryPulse AI - Manufacturing Productivity Dashboard

FactoryPulse AI is a full-stack manufacturing productivity dashboard for AI-powered CCTV events. Edge/computer-vision systems emit structured events such as `working`, `idle`, `absent`, and `product_count`; this app ingests them, stores them in MongoDB, deduplicates retries, computes productivity metrics, and exposes both REST APIs and a React dashboard.

The backend is the source of truth. The frontend consumes live backend APIs for factory, worker, workstation, and event data.

## Assignment README Checklist

This README directly addresses the required written sections:

| Requirement | Where to read |
| --- | --- |
| Edge -> Backend -> Dashboard architecture | [Architecture Overview](#architecture-overview) |
| Database schema | [Database Schema and Duplicate Strategy](#database-schema-and-duplicate-strategy) |
| Metric definitions | [Metric Definitions](#metric-definitions) |
| Assumptions and tradeoffs | [Assumptions and Tradeoffs](#assumptions-and-tradeoffs) |
| Intermittent connectivity | [Real-World Event Handling](#real-world-event-handling) |
| Duplicate events | [Real-World Event Handling](#real-world-event-handling) |
| Out-of-order timestamps | [Real-World Event Handling](#real-world-event-handling) |
| Model versioning, drift, retraining | [Model Lifecycle Extension Answers](#model-lifecycle-extension-answers) |
| Scaling from 5 cameras to 100+ cameras to multi-site | [Scaling Plan](#scaling-plan) |
| GitHub repository and web application | [Deliverables](#deliverables) |

## Features

- Single and batch event ingestion with Zod validation.
- MongoDB persistence through Mongoose models.
- Duplicate-event protection through deterministic event fingerprints.
- Worker, workstation, and factory-level metrics.
- Timestamp-based calculations that tolerate out-of-order event arrival.
- Seed/reset utilities with 6 workers, 6 workstations, and realistic shift events.
- Swagger/OpenAPI docs at `/docs`.
- React dashboard served by Express at `/`.
- Tests for validation, ingestion, duplicates, out-of-order events, and metrics.

## Product Tour

### Dashboard

![Dashboard overview](./docs/screenshots/dashboard-overview.png)

### Worker and Workstation Filters

![Worker filter](./docs/screenshots/worker-filter.png)

![Workstation filter](./docs/screenshots/workstation-filter.png)

### Search and Recent Events

![Search results](./docs/screenshots/search-results.png)

![Recent events](./docs/screenshots/recent-events.png)

### API Docs and Verification

![Swagger docs](./docs/screenshots/swagger-docs.png)

![Tests passing](./docs/screenshots/tests-passing.png)

![Build passing](./docs/screenshots/build-passing.png)

## Deliverables

- GitHub repository: `https://github.com/abhey8/Factory_Pulse`
- Web application: `https://factory-pulse-2.onrender.com/`
- API docs: `https://factory-pulse-2.onrender.com/docs/`

## Architecture Overview

```mermaid
flowchart LR
  A["AI CCTV / Edge Model"] -->|"structured events"| B["Express API"]
  B --> C["Zod Validation"]
  C --> D["Mongoose Services"]
  D --> E[("MongoDB")]
  E --> F["Metrics Engine"]
  F --> G["REST API"]
  G --> H["React Dashboard"]
  G --> I["Swagger Docs"]
```

Flow:

1. **Edge/CCTV layer** emits structured JSON events with worker, station, event type, timestamp, confidence, and optional production count.
2. **Backend ingestion API** validates payloads, checks worker/station references, computes duplicate fingerprints, and persists accepted events.
3. **MongoDB** stores workers, workstations, and raw AI events.
4. **Metrics engine** sorts events by timestamp and computes worker, workstation, and factory metrics.
5. **Dashboard/API layer** exposes metrics through REST endpoints, Swagger docs, and the React dashboard.

```mermaid
classDiagram
  class Worker {
    +String workerId
    +String name
    +Date createdAt
    +Date updatedAt
  }

  class Workstation {
    +String stationId
    +String name
    +String type
    +Date createdAt
    +Date updatedAt
  }

  class AIEvent {
    +Date occurredAt
    +String workerExternalId
    +String stationExternalId
    +EventType eventType
    +Number confidence
    +Number count
    +String eventFingerprint
    +ObjectId workerRef
    +ObjectId workstationRef
  }

  Worker "1" --> "many" AIEvent
  Workstation "1" --> "many" AIEvent
```

## Tech Stack

- Node.js, TypeScript, Express
- MongoDB, Mongoose
- Zod
- Swagger/OpenAPI
- React + Vite
- Recharts
- Vitest, Supertest, `mongodb-memory-server`
- Docker and Docker Compose support

## Project Structure

```text
src/
  app.ts, server.ts
  config/
  controllers/
  docs/
  lib/
  models/
  routes/
  services/
  validators/

frontend/
  src/app/App.tsx
  src/app/services/api.ts
  src/app/components/

scripts/
  seed.ts
  seed-if-empty.ts

tests/
docs/screenshots/
```

Key files:

- `src/services/event.service.ts`: ingestion, validation orchestration, duplicate handling, event listing.
- `src/services/metrics.service.ts`: worker, workstation, and factory metric calculations.
- `src/services/seedData.ts`: deterministic factory seed dataset.
- `frontend/src/app/services/api.ts`: central frontend API client.
- `src/docs/openapi.ts`: Swagger/OpenAPI document.

## Database Schema and Duplicate Strategy

Collections:

- `Worker`: `workerId`, `name`, timestamps.
- `Workstation`: `stationId`, `name`, `type`, timestamps.
- `AIEvent`: event timestamp, worker/station IDs, event type, confidence, count, references, and fingerprint.

Duplicate protection uses a deterministic fingerprint:

```text
normalized timestamp | worker_id | workstation_id | event_type | count
```

This prevents retry submissions from double-counting production. `confidence` is excluded because the same source event may be resent with a slightly different confidence score.

## Metric Definitions

All duration calculations use event timestamps, not insertion order.

- `working`, `idle`, and `absent` are state transitions.
- A state starts at its timestamp and lasts until the next state event for the same worker/workstation grouping.
- `product_count` events are production increments. They affect totals/rates but do not create active time.
- A final open state interval closes at the explicit `to` query parameter when provided; otherwise it closes at the max event timestamp in the filtered dataset.

Definitions:

- Worker active time: time in `working`.
- Worker idle time: time in `idle`.
- Worker utilization: `active_time_seconds / tracked_time_seconds * 100`.
- Workstation occupancy: `working` time associated with that station.
- Workstation throughput: `total_units_produced / tracked_hours`.
- Factory productive time: sum of worker active time.
- Factory production count: sum of all production counts.

## Assumptions and Tradeoffs

Assumptions:

- The AI/CCTV system emits structured events; this app does not run computer vision itself.
- `working`, `idle`, and `absent` are state transitions, not durations.
- `product_count` is an increment event and does not create active time.
- Final open intervals close at the explicit `to` filter when supplied, otherwise at the max timestamp in the filtered dataset.
- Seed data is deterministic so evaluators see repeatable metrics on first run.

Tradeoffs:

- No authentication or authorization because the assignment focuses on ingestion, metrics, and dashboard integration.
- No queue/streaming layer yet; direct HTTP ingestion is enough for the assessment scope.
- No background aggregation jobs; metrics are computed from persisted events for clarity.
- No model registry implementation yet; model lifecycle support is documented below as an extension path.

## API Overview

Swagger UI:

```text
GET /docs/
```

Core endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Dashboard |
| `GET` | `/health` | Health check |
| `GET` | `/api/bootstrap` | Workers, workstations, and factory summary |
| `GET` | `/api/workers` | List workers |
| `GET` | `/api/workstations` | List workstations |
| `POST` | `/api/events/ingest` | Ingest one event or a batch |
| `GET` | `/api/events` | List persisted events |
| `GET` | `/api/metrics/factory` | Factory metrics |
| `GET` | `/api/metrics/workers` | All worker metrics |
| `GET` | `/api/metrics/workers/:workerId` | One worker's metrics |
| `GET` | `/api/metrics/workstations` | All workstation metrics |
| `GET` | `/api/metrics/workstations/:stationId` | One workstation's metrics |
| `POST` | `/api/admin/seed` | Upsert seed data |
| `POST` | `/api/admin/reset-and-seed` | Reset and recreate seed data |
| `DELETE` | `/api/admin/events` | Delete events for testing |

Supported filters where relevant: `from`, `to`, `worker_id`, `workstation_id`, `event_type`, `limit`.

## Setup

Create environment file:

```bash
cp .env.example .env
```

Required/manual values:

```env
MONGODB_URI=<your MongoDB URI>
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

Keep real credentials in `.env`, not `.env.example`.

Install, seed, and run:

```bash
npm install
npm run frontend:install
npm run seed
npm run build
npm run dev
```

Open:

- Dashboard: http://localhost:3000/
- Swagger: http://localhost:3000/docs/
- Health: http://localhost:3000/health

Frontend hot reload:

```bash
npm run dev:backend
npm run dev:frontend
```

## Build and Test

```bash
npm run build
npm run test
```

Current verification:

- Build passes.
- Tests pass: 4 files, 17 tests.
- Docker files are included, but Docker was not installed on the development machine for local verification.

## Docker

If Docker is installed:

```bash
docker compose up --build
```

This starts the API and a MongoDB container with a persistent volume.

Reset Docker data:

```bash
docker compose down -v
docker compose up --build
```

## Deployment

The app can deploy as a single Node service. Express serves the compiled React frontend from `public/` and the API from the same origin.

Build command:

```bash
npm install && npm run frontend:install && npm run build
```

Start command:

```bash
npm run deploy:start
```

Deployment env vars:

```env
MONGODB_URI=<MongoDB Atlas or managed MongoDB URI>
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

`deploy:start` seeds only if the database is empty/incomplete, then starts the server.

## Example Requests

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/bootstrap
curl http://localhost:3000/api/metrics/factory
curl "http://localhost:3000/api/metrics/workers/W001"
curl "http://localhost:3000/api/events?worker_id=W001&limit=10"
```

Ingest one event:

```bash
curl -X POST http://localhost:3000/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-04-21T10:30:00.000Z",
    "worker_id": "W001",
    "workstation_id": "S001",
    "event_type": "product_count",
    "confidence": 0.94,
    "count": 12
  }'
```

## Real-World Event Handling

### Intermittent Connectivity

Cameras or edge devices may temporarily lose connectivity. The ingestion endpoint accepts batches, so a device can buffer events locally and send them later. The backend does not reject late timestamps.

### Duplicate Events

Retries are safe because each event receives a deterministic fingerprint from timestamp, worker, workstation, event type, and count. If the same event is sent again, it is reported as a duplicate and not inserted again.

### Out-of-Order Timestamps

Events are persisted even if they arrive late or out of order. Metrics sort by `occurredAt`, not insertion order, before calculating state durations.

## Model Lifecycle Extension Answers

### Add Model Versioning

Add fields such as `model_version`, `camera_id`, `site_id`, and optional `pipeline_version` to `AIEvent`. For a larger system, add a `ModelVersion` collection with training date, dataset notes, evaluation metrics, and deployment status.

### Detect Model Drift

Monitor confidence distributions, event frequency by camera, worker state mix, sudden station-level changes, and production count mismatch against trusted manual/ERP totals. Drift alerts can be generated by comparing these signals against rolling baselines.

### Trigger Retraining

Retraining should be triggered by evidence: drift alerts, repeated manual audit failures, layout/camera changes, new product types, or sustained confidence degradation. A practical loop would collect reviewed examples, retrain a candidate model, evaluate it against held-out shifts, then roll it out gradually.

## Scaling Plan

### 5 Cameras

The current direct HTTP ingestion API is sufficient. Add camera IDs, basic auth, request logging, and monitoring.

### 100+ Cameras

Add a queue or streaming layer between cameras and the API, such as Kafka, RabbitMQ, SQS, or a durable edge gateway. Add backpressure, dead-letter handling, stronger timestamp/camera/site indexes, and precomputed hourly or shift aggregates.

### Multi-Site

Add `site_id` across workers, workstations, cameras, and events. Add site-aware authorization, site time zones, shift definitions, regional ingestion gateways, and per-site aggregation/reporting.
