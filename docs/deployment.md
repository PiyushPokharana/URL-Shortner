# Deployment Guide

This project is deployment-ready with containerized application runtime.

## 1) Build and run locally with Docker

```bash
docker build -t url-shortener-service:latest .
docker run --rm -p 4000:4000 --env-file .env url-shortener-service:latest
```

## 2) Required environment variables

At minimum, set these in your platform:

- APP_NAME
- NODE_ENV=production
- PORT
- CORS_ORIGIN
- POSTGRES_HOST
- POSTGRES_PORT
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- REDIS_HOST
- REDIS_PORT
- REDIS_PASSWORD
- REDIS_DB
- RATE_LIMIT_ENABLED
- RATE_LIMIT_REQUESTS_PER_MINUTE
- RATE_LIMIT_WINDOW_SECONDS
- LOG_LEVEL

## 3) Suggested managed services

- Backend runtime: Render or Railway
- PostgreSQL: Supabase or managed Postgres from your cloud
- Redis: Upstash Redis or Redis Cloud

## 4) Smoke checks after deployment

```bash
curl https://<your-backend-domain>/api/health
curl https://<your-backend-domain>/api/health/deep
```

For end-to-end behavior:

1. Create short URL using POST /api/shorten
2. Visit the returned short URL to trigger redirect
3. Verify analytics at GET /api/analytics/:shortCode
