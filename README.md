# URL Shortener Service

A production-style URL shortener backend built with Node.js, Express, PostgreSQL, and Redis.

This project demonstrates:
- Clean layered backend architecture
- Base62 short code generation from auto-increment IDs
- Redis cache-first redirect flow
- URL expiry support
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
- `/api/health` and `/api/health/deep` endpoints
- Automatic `urls` table initialization and indexing

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

## Available Scripts

- `npm start` - run server with Node
- `npm run dev` - run with nodemon
- `npm run lint` - lint backend source (`src/**/*.js`)
- `npm run format` - format repository with Prettier

## Current Status

Implemented:
- Core URL shortener
- Redirect flow with Redis cache
- Expiry handling
- Health checks

Planned (see checklist):
- Rate limiting
- Analytics persistence and endpoint
- Queue workers
- Automated tests
- Deployment assets

## License

ISC
