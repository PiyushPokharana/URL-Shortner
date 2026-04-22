# URL Shortener Service

A production-style URL shortener backend built with Node.js, Express, PostgreSQL, and Redis.

## Problem Statement

Build a URL shortener that is fast on read-heavy traffic, resilient under bursty usage, and engineered with clear separation of concerns so it can be evolved toward production scale.

This project demonstrates:
- Clean layered backend architecture
- Base62 short code generation from auto-increment IDs
- Redis cache-first redirect flow
- URL expiry support
- Optional geo enrichment for analytics (header-based)
- Health and deep health diagnostics
- Docker-based local dependency setup

## Architecture

![URL Shortener Architecture](./url_shortener_architecture.png)

## Tech Stack

- Node.js + Express
- PostgreSQL (persistent storage)
- Redis (cache)
- Pino + pino-http (logging)
- ESLint + Prettier
- Docker Compose (local services)

## Project Structure

```text
src/
  config/        # env, logger, postgres, redis
  controllers/   # HTTP handlers
  middleware/    # error and not-found handlers
  models/        # DB access layer
  routes/        # API route definitions
  services/      # business logic
  utils/         # helpers (base62, async handler, HTTP error)
```

## Features Implemented

- `POST /api/shorten` to create short URLs
- `GET /:shortCode` redirect endpoint
- `GET /api/:shortCode` redirect endpoint (API namespace variant)
- Optional custom alias (`customAlias`)
- Optional expiry (`expiry`)
- Cache-first redirect lookup using Redis
- DB fallback on cache miss + cache backfill
- Redis-based per-IP rate limiting with `429 Too Many Requests`
- Click analytics persistence (`clicks` table) on redirects
- `GET /api/analytics/:shortCode` metrics endpoint
- `/api/health` and `/api/health/deep` endpoints
- Automatic `urls` table initialization and indexing
- Automated API tests with Jest + Supertest
- Reproducible load-test script and report artifacts

## Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL and Redis)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start PostgreSQL and Redis:

```bash
docker compose up -d
```

4. Start the API server:

```bash
npm run dev
```

Server default port: `4000`

## Environment Variables

Defined in `.env.example`:

- `APP_NAME`
- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_SSL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_REQUESTS_PER_MINUTE`
- `RATE_LIMIT_WINDOW_SECONDS`
- `LOG_LEVEL`

Optional (supported by code):
- `REDIS_CACHE_TTL_SECONDS` (default: `3600`)

## API Quick Start

### 1) Create short URL

`POST /api/shorten`

Request body:

```json
{
  "url": "https://example.com/some/long/path",
  "customAlias": "my-link",
  "expiry": "2026-12-31T23:59:59.000Z"
}
```

Minimal request:

```json
{
  "url": "https://example.com"
}
```

Example response (`201`):

```json
{
  "message": "Short URL created",
  "data": {
    "id": 1,
    "originalUrl": "https://example.com/",
    "shortCode": "b",
    "shortUrl": "http://localhost:4000/b",
    "createdAt": "2026-04-22T10:00:00.000Z",
    "expiryAt": null
  }
}
```

### 2) Redirect

`GET /:shortCode`

Example:

```bash
curl -i http://localhost:4000/b
```

### 3) Health

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/deep
```

### 4) Analytics

`GET /api/analytics/:shortCode`

Example:

```bash
curl http://localhost:4000/api/analytics/b
```

Example analytics response:

```json
{
  "message": "Analytics fetched",
  "data": {
    "shortCode": "b",
    "originalUrl": "https://example.com/",
    "totalClicks": 120,
    "uniqueUsers": 45,
    "firstClickedAt": "2026-04-22T12:00:00.000Z",
    "lastClickedAt": "2026-04-22T16:00:00.000Z",
    "recentEvents": [
      {
        "ipAddress": "127.0.0.1",
        "countryCode": "IN",
        "countryName": "India",
        "clickedAt": "2026-04-22T16:00:00.000Z"
      }
    ]
  }
}
```

## Available Scripts

- `npm start` - run server with Node
- `npm run dev` - run with nodemon
- `npm run lint` - lint backend source (`src/**/*.js`)
- `npm run format` - format repository with Prettier
- `npm test` - run Jest + Supertest suite
- `npm run load:test` - run reproducible load test and generate `docs/load-test-report.*`

## Engineering Decisions

- Why PostgreSQL:
  - Strong consistency for URL mappings and analytics events.
  - Efficient indexing for lookup-heavy routes (`short_code` index).
- Why Redis:
  - Cache-first redirect path cuts repeated DB reads.
  - Also supports distributed rate-limiting counters.
- Why direct-write analytics first:
  - Fast to ship and verify for resume-ready baseline.
  - Redirect path remains responsive by logging analytics asynchronously (non-blocking promise).

## Scaling Strategy

- Read-heavy optimization:
  - Redirect resolves from Redis first; DB is fallback only.
- Horizontal API scaling:
  - App instances are stateless; cache and rate-limits are centralized in Redis.
- Analytics evolution path:
  - Current direct-write path can be moved to queue/worker model (BullMQ) for higher write throughput.

## Trade-offs

- IP-based unique users are a pragmatic approximation, not true user identity.
- Header-based geo enrichment is optional and best-effort; precision depends on upstream proxy/CDN headers.
- Direct DB analytics writes are simple and reliable for current scope, but queue-based writes are better for sustained high volume.

## Performance Metrics

Latest local load evidence (generated at `2026-04-22T17:42:08.029Z`) from `npm run load:test`:

- Requests/sec (avg): `3241`
- Requests/sec (p95): `3601`
- Latency p50: `8 ms`
- Latency p95: `14 ms`
- Latency p99: `16 ms`
- Non-2xx responses: `0`
- Errors: `0`

See:
- `docs/load-test-report.json`
- `docs/load-test-report.md`

## Testing Coverage

Jest + Supertest currently cover:

- `POST /api/shorten`
- `GET /:shortCode` redirect behavior and click tracking invocation
- `GET /api/analytics/:shortCode`
- Geo header extraction utility behavior

## Deployment

Deployment assets included:

- `Dockerfile`
- `.env.example`
- `docs/deployment.md`

Quick container run:

```bash
docker build -t url-shortener-service:latest .
docker run --rm -p 4000:4000 --env-file .env url-shortener-service:latest
```

## Current Status

Implemented:
- Core URL shortener
- Redirect flow with Redis cache
- Rate limiting (Redis-based, per IP)
- Expiry handling
- Health checks
- Analytics persistence + metrics endpoint (with optional geo fields)
- Automated tests (Jest + Supertest)
- Load-test script and reproducible report artifacts
- Deployment artifacts (`Dockerfile`, `.env.example`, deployment guide)

Planned (see checklist):
- Queue workers
- Managed cloud deployment (backend + Postgres + Redis)

## License

ISC
