# Deployment Guide

This repo is deployment-ready for a two-process runtime:

- API service (`npm start`)
- Worker service (`npm run start:worker`)

Both services should share the same PostgreSQL and Redis.

## 1) Validate container image locally

```bash
docker build -t url-shortener-service:latest .
docker run --rm -p 4000:4000 --env-file .env url-shortener-service:latest
```

In another terminal, start worker with the same env:

```bash
npm run start:worker
```

## 2) Production environment variables

Set these for both API and worker:

- APP_NAME=url-shortener-service
- NODE_ENV=production
- PORT=4000
- TRUST_PROXY=1
- CORS_ORIGIN=https://<your-frontend-domain>
- POSTGRES_HOST
- POSTGRES_PORT
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- POSTGRES_SSL=true
- REDIS_HOST
- REDIS_PORT
- REDIS_PASSWORD
- REDIS_DB=0
- RATE_LIMIT_ENABLED=true
- RATE_LIMIT_REQUESTS_PER_MINUTE=120
- RATE_LIMIT_WINDOW_SECONDS=60
- ANALYTICS_QUEUE_NAME=analytics-clicks
- ANALYTICS_WORKER_CONCURRENCY=5
- LOG_LEVEL=info

Note: `TRUST_PROXY=1` is recommended on Render/Railway so IP-based rate limiting and logs use real client IPs.

## 3) Platform mapping

### Render

1. Create managed PostgreSQL and managed Redis.
2. Create Web Service (API):
	- Build command: `npm ci --omit=dev`
	- Start command: `npm start`
3. Create Background Worker:
	- Build command: `npm ci --omit=dev`
	- Start command: `npm run start:worker`
4. Attach identical env vars to both services.

### Railway

1. Add PostgreSQL and Redis plugins/services.
2. Create API service with start command `npm start`.
3. Create worker service from same repo with start command `npm run start:worker`.
4. Set shared variables on both services:
	- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
	- `REDIS_URL=${{Redis.REDIS_URL}}`
	- `NODE_ENV=production`
	- `TRUST_PROXY=1`
	- `POSTGRES_SSL=true`
5. Ensure both services point to the same DB/Redis connection values.

Railway note:

- This app supports Railway-native URL variables (`DATABASE_URL`, `REDIS_URL`).
- You can keep split variables (`POSTGRES_HOST`, `REDIS_HOST`, etc.) for non-Railway platforms.

## 4) Post-deploy smoke test

Use the automated script:

```bash
npm run smoke:test -- https://<your-backend-domain>
```

What it verifies:

1. `GET /api/health` returns ok
2. `GET /api/health/deep` is healthy
3. `POST /api/shorten` creates a URL
4. `GET /:shortCode` returns redirect (302)
5. `GET /api/analytics/:shortCode` is reachable

If all pass, the deployment is functionally ready.
