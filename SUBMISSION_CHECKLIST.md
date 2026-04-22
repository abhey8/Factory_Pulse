# Submission Checklist

## Implemented

- Express + TypeScript backend with modular routes, controllers, services, validators, and shared MongoDB connection.
- Mongoose models for `Worker`, `Workstation`, and `AIEvent`.
- Seed data for 6 workers, 6 workstations, and 101 realistic shift events.
- AI event ingestion at `POST /api/events/ingest` for single events and batches.
- Zod validation for event payloads and metric query parameters.
- Duplicate protection using deterministic event fingerprints.
- Event listing at `GET /api/events` with filters.
- Worker, workstation, and factory metrics endpoints.
- Timestamp-based duration calculations that tolerate out-of-order arrival.
- Admin seed/reset/clear utilities.
- Swagger/OpenAPI docs at `/docs/`.
- React dashboard at `/`, connected to live backend APIs.
- Bootstrap endpoint at `GET /api/bootstrap`.
- Dockerfile and Docker Compose setup with persistent MongoDB volume.
- Healthcheck endpoint and Docker healthcheck.
- Vitest/Supertest coverage for ingestion, validation, metrics, shell, and bootstrap behavior.

## How To Run

### Non-Docker

```bash
cp .env.example .env
npm install
npm run frontend:install
npm run seed
npm run build
npm run dev
```

Requires MongoDB to be running at the configured `MONGODB_URI` in `.env`. For local MongoDB, use `mongodb://localhost:27017/factory_productivity`.

Open:

- http://localhost:3000/
- http://localhost:3000/docs/
- http://localhost:3000/health

### Docker

```bash
docker compose up --build
```

Reset the Docker MongoDB volume:

```bash
docker compose down -v
docker compose up --build
```

## Self-Check Commands

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/admin/seed
curl http://localhost:3000/api/bootstrap
curl http://localhost:3000/api/metrics/factory
curl http://localhost:3000/api/metrics/workers
curl http://localhost:3000/api/metrics/workstations
```

## Assumptions

- `working`, `idle`, and `absent` are state transitions.
- A state starts at its timestamp and lasts until the next state event for the same worker/workstation pair.
- Metrics sort by event timestamp, not insertion order.
- `product_count` events are production increments and do not define active time.
- Final open state intervals close at `to` when provided, otherwise at the max timestamp in the filtered dataset.
- Duplicate retries are detected using a deterministic fingerprint from timestamp, worker, workstation, event type, and count.
- Seed data is intentionally deterministic so evaluator checks are repeatable.

## Intentionally Simplified

- No authentication or authorization.
- No queue or streaming ingestion layer.
- No camera/site/model-version tables yet.
- No background aggregation jobs.
- Frontend is focused on the core productivity dashboard and keeps advanced drilldowns intentionally light.
- MongoDB is used through Mongoose, with Docker Compose providing a local database.
