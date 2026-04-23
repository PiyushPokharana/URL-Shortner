# URL Shortener Project Checklist

This checklist turns the phase-wise execution plan into actionable tasks.

## Current Progress Snapshot (as of 2026-04-23)

- Completed phases: **8 / 10**
- Partially completed phases: **2 / 10**
  - Phase 8 (Deployment): Partial (assets ready, live deployment pending)
  - Phase 9 (README): Partial (polished and metrics included, final interview iteration pending)
- Not started phases: **0 / 10**

### Demo Features Implemented in This Repo

- [x] URL shortening UI form and validation
- [x] Custom alias support (in-memory uniqueness check)
- [x] Expiration input and expired URL behavior in demo
- [x] Redirect test flow in UI
- [x] Click count increment simulation
- [x] Analytics cards and chart visualization
- [x] URL management list, search, details modal, and delete action
- [x] Backend scaffold with Node.js + Express and modular src structure
- [x] Environment configuration via `.env` and `.env.example`
- [x] PostgreSQL and Redis local service setup via docker-compose
- [x] Real backend API server (Node.js/Fastify + Express routes)
- [x] PostgreSQL persistence
- [x] Redis caching
- [x] Rate limiting
- [x] Backend click analytics persistence and metrics endpoint
- [x] Optional geo data enrichment (header-based)
- [x] Queue workers (BullMQ)
- [x] Automated tests (Jest/Supertest)
- [ ] Live backend deployment (managed cloud)

## Project Timeline

- [x] Foundation (Phase 0): 1 day
- [x] Core URL Shortener (Phase 1): 2 days
- [x] Redirect + Cache (Phase 2): 2 days
- [x] Rate Limiting (Phase 3): 1 day
- [x] Analytics (Phase 4): 2-3 days
- [x] Background Workers (Phase 5): 2 days
- [ ] Advanced Engineering (Phase 6): 2 days
- [x] Testing + Load Test (Phase 7): 2 days
- [ ] Deployment (Phase 8): 2 days
- [ ] README + Project Positioning (Phase 9): Ongoing, finalize at end

---

## Phase 0 - Foundation (Day 1)

Goal: Set up a clean, production-ready base.

### Setup and Infrastructure
- [x] Initialize and name repo as `url-shortener-service`
- [x] Setup backend with Node.js + Express (or Fastify)
- [x] Setup PostgreSQL
- [x] Setup Redis
- [x] Add environment configuration via `.env`

### Project Structure
- [x] Create clean folder structure:
  - [x] `src/controllers/`
  - [x] `src/services/`
  - [x] `src/routes/`
  - [x] `src/models/`
  - [x] `src/middleware/`
  - [x] `src/utils/`
  - [x] `src/config/`

### Code Quality and Observability
- [x] Configure ESLint
- [x] Configure Prettier
- [x] Add basic logging (Winston or Pino)

### Definition of Done
- [x] Server runs successfully
- [x] PostgreSQL connection is healthy
- [x] Redis connection is healthy
- [x] Base architecture is clean and modular

---

## Phase 1 - Core URL Shortener (Day 2-3)

Goal: Build the basic working product the right way.

### API: Shorten URL
- [x] Implement `POST /shorten`
- [x] Accept request body:
  - [x] `url` (required)
  - [x] `customAlias` (optional)
  - [x] `expiry` (optional)

### Engineering Design
- [x] Implement Base62 encoding
- [x] Generate short code via auto-increment ID -> Base62 (not random)

### Database Schema
- [x] Create `urls` table with:
  - [x] `id` (PK)
  - [x] `original_url`
  - [x] `short_code` (indexed)
  - [x] `created_at`
  - [x] `expiry_at`

### Validation and Collision Handling
- [x] Check if `customAlias` already exists
- [x] Return proper error on duplicate alias

### Definition of Done
- [x] Short URL is created and persisted in DB
- [x] API returns clean success/error responses

---

## Phase 2 - Redirect + Cache (Day 4-5)

Goal: Make redirects fast with cache-first lookup.

### API: Redirect
- [x] Implement `GET /:shortCode`

### Redirect Flow
- [x] Read from Redis first
- [x] On cache miss, read from PostgreSQL
- [x] Cache DB result back into Redis

### Caching and Performance
- [x] Cache key format: `shortCode -> originalURL`
- [x] Configure Redis TTL
- [x] Add DB index on `short_code` (if not already done)
- [x] Measure redirect response time

### Logging
- [x] Log cache hits
- [x] Log cache misses
- [x] Log response time per redirect request

### Definition of Done
- [x] Redirect works correctly
- [x] Cache-hit path and cache-miss path both verified
- [x] Performance logs are visible and meaningful

---

## Phase 3 - Rate Limiting (Day 6)

Goal: Add production-safe abuse protection.

### IP-Based Limiting
- [x] Implement Redis-based per-IP counter
- [x] Key format: `ip_address`
- [x] Counter TTL: 1 minute

### Enforcement
- [x] Define request threshold per minute
- [x] Return `429 Too Many Requests` when threshold exceeded

### Definition of Done
- [x] Normal traffic passes
- [x] Burst traffic from same IP gets limited
- [x] Proper `429` responses are returned

### Verification Evidence (2026-04-22)
- [x] Automated verification script run: `node scripts/verify-rate-limit.js`
- [x] Normal traffic status sequence observed: `200, 200, 200`
- [x] Burst traffic status sequence observed: `200, 200, 429, 429, 429`
- [x] Blocked response confirmed with `429`, body `{ "message": "Too Many Requests" }`, and headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- [x] Window reset behavior confirmed (`afterResetStatus: 200`)

---

## Phase 4 - Analytics System (Day 7-9)

Goal: Track usage in a resume-worthy way.

### What to Track
- [x] Total clicks
- [x] Unique users (IP-based)
- [x] Timestamp
- [x] Optional geo data

### Architecture Decision
- [x] Avoid heavy analytics writes directly in redirect critical path
- [ ] Choose implementation path:
  - [x] Option A: Direct DB write (simple)
  - [x] Option B: Queue-based write with BullMQ (better)

### Database
- [x] Create `clicks` table:
  - [x] `id`
  - [x] `short_code`
  - [x] `ip_address`
  - [x] `timestamp`

### API
- [x] Implement `GET /analytics/:shortCode`

### Definition of Done
- [x] Click events are stored accurately
- [x] Analytics endpoint returns expected metrics

---

## Phase 5 - Background Workers (Day 10-11)

Goal: Demonstrate async processing and scalability mindset.

### Queue + Worker
- [x] Setup BullMQ with Redis
- [x] Push analytics events to queue
- [x] Implement worker to consume and store analytics

### Reliability
- [x] Add retries/backoff strategy for failed jobs
- [x] Add worker error logging

### Definition of Done
- [x] Redirect remains responsive while analytics are processed asynchronously
- [x] Queue and worker flow is stable under repeated load

### Verification Evidence (2026-04-22)
- [x] BullMQ producer implemented in `src/queues/analytics.queue.js`
- [x] Worker implemented in `src/workers/analytics.worker.js` and bootstrapped via `src/worker.js`
- [x] Redirect path now enqueues analytics jobs (non-blocking) in `src/controllers/url.controller.js`
- [x] Retry/backoff configured via env (`ANALYTICS_QUEUE_ATTEMPTS`, `ANALYTICS_QUEUE_BACKOFF_MS`)
- [x] Worker error logging implemented on failed jobs

---

## Phase 6 - Advanced Engineering (Day 12-14)

Goal: Add advanced features that separate this from basic CRUD projects.

### Advanced Features
- [x] Add Bloom filter to reduce DB hits for invalid codes
- [x] Add cron job for expired URL cleanup
- [x] Implement stronger unique visitor logic
- [ ] Add custom domain support (optional)

### Definition of Done
- [x] Invalid-code traffic is optimized
- [x] Expired records are cleaned automatically
- [x] Unique visitor counting is correct and repeatable

---

## Phase 7 - Testing + Load Test (Day 15-16)

Goal: Prove correctness and performance.

### Automated Tests
- [x] Add API tests with Jest + Supertest
- [x] Cover shorten, redirect, and analytics flows (rate-limit has dedicated verification script)

### Load Testing
- [x] Add load test scripts with k6 or Artillery
- [x] Capture and document:
  - [x] Requests per second
  - [x] Latency (p50/p95/p99 if possible)
  - [x] Error rate

### Definition of Done
- [x] Critical API flows are test-covered
- [x] Load test results are documented and reproducible

### Verification Evidence (2026-04-22)
- [x] Automated tests executed successfully via `npm test` (9 tests, 4 suites)
- [x] Load test executed via `npm run load:test`
- [x] Evidence artifacts generated: `docs/load-test-report.json`, `docs/load-test-report.md`
- [x] Observed metrics: avg RPS `3241`, latency p50 `8ms`, p95 `14ms`, p99 `16ms`, error rate `0`

---

## Phase 8 - Deployment (Day 17-18)

Goal: Deploy a real, usable service.

### Deploy Targets
- [ ] Deploy backend (Render/Railway/AWS)
- [ ] Deploy PostgreSQL (Supabase/RDS)
- [ ] Deploy Redis (Upstash/Redis Cloud)

### Deployment Assets
- [x] Add hardened `Dockerfile` (healthcheck + non-root user)
- [x] Add `.env.example`
- [x] Add deployment runbook `docs/deployment.md`
- [x] Add production smoke test script `scripts/smoke-test.js`

### Definition of Done
- [ ] Public API is reachable
- [ ] All dependent services are connected in production
- [ ] Basic smoke tests pass in production

### Verification Evidence (2026-04-23)
- [x] Deployment docs expanded for Render/Railway API + worker topology
- [x] Added `TRUST_PROXY` env support for reverse-proxy deployments
- [x] Added `npm run smoke:test -- https://<domain>` for post-deploy validation

---

## Phase 9 - README (Most Important)

Goal: Turn the project into a strong resume and interview asset.

### Must Include
- [x] Problem statement
- [x] Architecture diagram
- [x] Tech decisions (Why Redis, Why PostgreSQL)
- [x] Scaling strategy
- [x] Trade-offs
- [x] Performance metrics

### Resume/Interview Positioning
- [x] Explain read-heavy optimization strategy
- [x] Explain how Redis reduced DB load
- [x] Explain async analytics processing
- [x] Explain horizontal scalability approach

### Definition of Done
- [x] README is complete, clear, and recruiter-friendly
- [ ] You can confidently explain architecture and trade-offs in interviews

---

## Final Quality Gate (Before Marking Project Complete)

- [x] Caching is implemented and verified
- [x] Rate limiting is implemented and verified
- [x] Analytics is implemented and verified
- [x] Tests and load-test evidence are documented
- [ ] Deployment is live and stable
- [x] README is polished
