# URL Shortener Project Checklist

This checklist turns the phase-wise execution plan into actionable tasks.

## Current Progress Snapshot (as of 2026-04-22)

- Completed phases: **3 / 10**
- Partially completed phases: **1 / 10**
  - Phase 4 (Analytics): Partial (frontend dashboard simulation)
- Not started phases: **6 / 10**

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
- [ ] Rate limiting
- [ ] Queue workers (BullMQ)
- [ ] Automated tests (Jest/Supertest)
- [ ] Deployment artifacts (`Dockerfile`, `.env.example`) and live backend

## Project Timeline

- [x] Foundation (Phase 0): 1 day
- [x] Core URL Shortener (Phase 1): 2 days
- [ ] Redirect + Cache (Phase 2): 2 days
- [ ] Rate Limiting (Phase 3): 1 day
- [ ] Analytics (Phase 4): 2-3 days
- [ ] Background Workers (Phase 5): 2 days
- [ ] Advanced Engineering (Phase 6): 2 days
- [ ] Testing + Load Test (Phase 7): 2 days
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
- [ ] Implement Redis-based per-IP counter
- [ ] Key format: `ip_address`
- [ ] Counter TTL: 1 minute

### Enforcement
- [ ] Define request threshold per minute
- [ ] Return `429 Too Many Requests` when threshold exceeded

### Definition of Done
- [ ] Normal traffic passes
- [ ] Burst traffic from same IP gets limited
- [ ] Proper `429` responses are returned

---

## Phase 4 - Analytics System (Day 7-9)

Goal: Track usage in a resume-worthy way.

### What to Track
- [ ] Total clicks
- [ ] Unique users (IP-based)
- [ ] Timestamp
- [ ] Optional geo data

### Architecture Decision
- [ ] Avoid heavy analytics writes directly in redirect critical path
- [ ] Choose implementation path:
  - [ ] Option A: Direct DB write (simple)
  - [ ] Option B: Queue-based write with BullMQ (better)

### Database
- [ ] Create `clicks` table:
  - [ ] `id`
  - [ ] `short_code`
  - [ ] `ip_address`
  - [ ] `timestamp`

### API
- [ ] Implement `GET /analytics/:shortCode`

### Definition of Done
- [ ] Click events are stored accurately
- [ ] Analytics endpoint returns expected metrics

---

## Phase 5 - Background Workers (Day 10-11)

Goal: Demonstrate async processing and scalability mindset.

### Queue + Worker
- [ ] Setup BullMQ with Redis
- [ ] Push analytics events to queue
- [ ] Implement worker to consume and store analytics

### Reliability
- [ ] Add retries/backoff strategy for failed jobs
- [ ] Add worker error logging

### Definition of Done
- [ ] Redirect remains responsive while analytics are processed asynchronously
- [ ] Queue and worker flow is stable under repeated load

---

## Phase 6 - Advanced Engineering (Day 12-14)

Goal: Add advanced features that separate this from basic CRUD projects.

### Advanced Features
- [ ] Add Bloom filter to reduce DB hits for invalid codes
- [ ] Add cron job for expired URL cleanup
- [ ] Implement stronger unique visitor logic
- [ ] Add custom domain support (optional)

### Definition of Done
- [ ] Invalid-code traffic is optimized
- [ ] Expired records are cleaned automatically
- [ ] Unique visitor counting is correct and repeatable

---

## Phase 7 - Testing + Load Test (Day 15-16)

Goal: Prove correctness and performance.

### Automated Tests
- [ ] Add API tests with Jest + Supertest
- [ ] Cover shorten, redirect, rate limit, and analytics flows

### Load Testing
- [ ] Add load test scripts with k6 or Artillery
- [ ] Capture and document:
  - [ ] Requests per second
  - [ ] Latency (p50/p95/p99 if possible)
  - [ ] Error rate

### Definition of Done
- [ ] Critical API flows are test-covered
- [ ] Load test results are documented and reproducible

---

## Phase 8 - Deployment (Day 17-18)

Goal: Deploy a real, usable service.

### Deploy Targets
- [ ] Deploy backend (Render/Railway/AWS)
- [ ] Deploy PostgreSQL (Supabase/RDS)
- [ ] Deploy Redis (Upstash/Redis Cloud)

### Deployment Assets
- [ ] Add `Dockerfile`
- [ ] Add `.env.example`

### Definition of Done
- [ ] Public API is reachable
- [ ] All dependent services are connected in production
- [ ] Basic smoke tests pass in production

---

## Phase 9 - README (Most Important)

Goal: Turn the project into a strong resume and interview asset.

### Must Include
- [ ] Problem statement
- [ ] Architecture diagram
- [ ] Tech decisions (Why Redis, Why PostgreSQL)
- [ ] Scaling strategy
- [ ] Trade-offs
- [ ] Performance metrics

### Resume/Interview Positioning
- [ ] Explain read-heavy optimization strategy
- [ ] Explain how Redis reduced DB load
- [ ] Explain async analytics processing
- [ ] Explain horizontal scalability approach

### Definition of Done
- [ ] README is complete, clear, and recruiter-friendly
- [ ] You can confidently explain architecture and trade-offs in interviews

---

## Final Quality Gate (Before Marking Project Complete)

- [ ] Caching is implemented and verified
- [ ] Rate limiting is implemented and verified
- [ ] Analytics is implemented and verified
- [ ] Tests and load-test evidence are documented
- [ ] Deployment is live and stable
- [ ] README is polished
