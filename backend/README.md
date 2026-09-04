#  Smart Market Watchlist — Backend Engine

> A production-minded, high-throughput backend for a **Smart Market Watchlist** with a persistent **“Since You Last Checked”** intelligence layer that remembers what each user has already seen for each stock, detects meaningful changes, computes attention scores, and explains the supporting evidence without fabricating causality.

---

##  What Makes This Different?

A standard watchlist answers:
> *"What is the stock doing right now?"*

**This backend additionally answers:**
> *"What has meaningfully changed in this stock since **this specific user** last checked it, how significant is the change, and what evidence explains it?"*

### Core Differentiators
1. **Per-User, Per-Stock Checkpoints (`UserStockCheckpoint`):** Checkpoints represent what a specific user last acknowledged. Two different users inspecting the same stock receive personalized change summaries based on their own visit timeline.
2. **Deterministic Attention Scoring Engine ($0..100$):** Multi-factor scoring combining price moves, volume anomalies vs. 20-day rolling averages, ATR volatility shifts, news recency, and technical indicators (RSI/MACD).
3. **Auditable "Why Did It Change?" Evidence Engine:** Synthesizes structured `ChangeEvidence` records (auditable price jumps, volume ratios, news catalysts) into cautious natural language explanations without hallucinating causality.
4. **Shared Market Cache with Distributed Stampede Protection:** 10,000 users checking `NVDA` do **not** trigger 10,000 provider queries. Background workers continuously refresh the union of watched stocks into a shared cache.
5. **Freshness & Provenance Classification:** Every quote is tagged with `FRESH`, `DELAYED`, `STALE`, or `UNAVAILABLE`. Out-of-order provider responses are rejected.
6. **Provider Quota Budget Manager:** Enforces minute and daily credit budgets for external APIs (Twelve Data / Alpha Vantage) with automatic degradation to cached snapshots.

---

##  Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Runtime & Language** | **Node.js 22+ & TypeScript** | Modern ES2022, strict type safety, native performance |
| **API Framework** | **Fastify v5** | Low overhead, schema-based validation, structured logging, plugin encapsulation |
| **Database & ORM** | **PostgreSQL 16 & Prisma** | Relational integrity, foreign keys, compound indexes, ACID transactions for CAS checkpoints |
| **Hot Cache & Coordination** | **Redis 7 (ioredis)** | Cache-aside with request coalescing/locks, distributed rate limiting, and BullMQ queue backend |
| **Background Processing** | **BullMQ & Worker Loops** | Asynchronous market refreshes of actively watched stocks and background alert evaluation |
| **Market Data Providers** | **Twelve Data & Alpha Vantage + Mock Fallback** | Twelve Data batch quotes (`/quote?symbol=AAPL,MSFT`), Alpha Vantage fundamentals, and zero-config Mock Provider |
| **Observability** | **Pino & In-Memory Metrics** | Structured JSON logs with credential redaction, `/health/live`, `/health/ready`, `/metrics` |
| **Testing** | **Vitest** | Blazing fast unit and integration tests |

---

##  High-Level Architecture

```text
                               ┌─────────────────────────┐
                               │   Frontend / Client UI  │
                               └────────────┬────────────┘
                                            │ HTTPS / Bearer Token
                                            ▼
                               ┌─────────────────────────┐
                               │ Fastify Modular Monolith│
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
               ▼                            ▼                            ▼
        ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
        │ Auth Module  │             │ Watchlists   │             │ Stock & Data │
        └──────────────┘             └──────────────┘             └──────┬───────┘
                                                                         │
                                           ┌─────────────────────────────┼─────────────────────────────┐
                                           │                             │                             │
                                           ▼                             ▼                             ▼
                                    ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
                                    │  PostgreSQL  │              │ Redis Cache  │              │ BullMQ Queue │
                                    │ Source-Truth │              │ Hot Snapshot │              └──────┬───────┘
                                    └──────────────┘              └──────────────┘                     │
                                                                                                       ▼
                                                                                                ┌──────────────┐
                                                                                                │Worker Process│
                                                                                                └──────┬───────┘
                                                                                                       │
                                                                        ┌──────────────────────────────┴──────────┐
                                                                        ▼                                         ▼
                                                                ┌────────────────┐                        ┌───────────────┐
                                                                │ Twelve Data API│                        │ Mock Provider │
                                                                └────────────────┘                        └───────────────┘
```

---

##  Database Schema & Indexes

- **`User`**: `id (UUID PK)`, `email (UNIQUE)`, `name`, `password_hash`, `created_at`
- **`Watchlist`**: `id (UUID PK)`, `user_id (FK)`, `name`, `is_default`
- **`WatchlistItem`**: `id (UUID PK)`, `watchlist_id (FK)`, `instrument_id (FK)`, `position`. **UNIQUE(`watchlist_id`, `instrument_id`)**
- **`Instrument`**: `id (UUID PK)`, `symbol`, `exchange`, `name`, `currency`, `provider_symbol`. **UNIQUE(`symbol`, `exchange`)**
- **`LatestMarketSnapshot`**: `instrument_id (PK/FK)`, `price`, `open`, `high`, `low`, `volume`, `provider`, `provider_timestamp`, `freshness_status`
- **`UserStockCheckpoint`**: `user_id`, `instrument_id`, `comparison_checkpoint_at`, `checkpoint_price`, `checkpoint_volume`, `version`. **UNIQUE(`user_id`, `instrument_id`)**
- **`ChangeEvent`**: `id (UUID PK)`, `user_id`, `instrument_id`, `checkpoint_from`, `detected_at`, `attention_score`, `attention_level`, `summary`, `algorithm_version`
- **`ChangeEvidence`**: `id (UUID PK)`, `change_event_id (FK)`, `evidence_type`, `old_value`, `new_value`, `delta`, `significance_score`, `source`, `source_timestamp`, `metadata (JSONB)`
- **`Alert`**: `id (UUID PK)`, `user_id`, `instrument_id`, `type`, `target_value`, `is_triggered`, `enabled`

---

##  Meaningful Change & Attention Engine

### 1. Multi-Factor Attention Score Formula ($0..100$)

$$\text{Attention Score} = \text{Score}_{\text{price}} + \text{Score}_{\text{volume}} + \text{Score}_{\text{volatility}} + \text{Score}_{\text{news}} + \text{Score}_{\text{technical}}$$

| Factor | Calculation | Max Points |
|---|---|---|
| **Price Movement** | $\ge 8\%$ move = 40 pts, $\ge 5\%$ = 30 pts, $\ge 2\%$ = 18 pts, $\ge 0.75\%$ = 8 pts | **40** |
| **Volume Anomaly** | Current volume $\ge 2.5\times$ 20-day rolling average = 25 pts, $\ge 1.75\times$ = 15 pts | **25** |
| **News Catalysts** | Recency & count of news articles published after checkpoint (7 pts per article) | **20** |
| **Volatility / ATR** | 30-day return volatility $> 3.0\%$ or ATR expansion | **12** |
| **Technical Signals** | RSI(14) in overbought ($\ge 75$) or oversold ($\le 25$) territory | **8** |

### 2. Attention Classification Levels
- **`0 - 19`**: `NORMAL` (Calm trading, minor oscillation)
- **`20 - 39`**: `LOW` (Mild drift)
- **`40 - 59`**: `MODERATE` (Noteworthy price move or volume uptick)
- **`60 - 79`**: `HIGH` (Substantial move, volume anomaly, or catalyst)
- **`80 - 100`**: `VERY_HIGH` (Major breakout, earnings surge, extreme volume)

---

## Getting Started

### 1. Prerequisites
- **Node.js 22+**
- **Docker & Docker Compose** (for local PostgreSQL & Redis)

### 2. Quick Setup

```bash
# 1. Clone repository and enter backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start PostgreSQL and Redis via Docker Compose
docker compose up -d

# 4. Generate Prisma Client and Push Schema
npx prisma generate
npx prisma db push

# 5. Seed Database (Instruments, Demo User & Sample Checkpoints)
npm run db:seed

# 6. Run API Server (in Development Mode)
npm run dev

# 7. (Optional) Run Background Worker in a separate terminal
npm run worker
```

> **Note:** The server starts at `http://localhost:4000`. Interactive Swagger OpenAPI docs are available at **`http://localhost:4000/docs`**.

---

##  Running Automated Tests

Run the test suite with Vitest:

```bash
npm test
```

Typecheck the codebase with strict TypeScript:

```bash
npm run typecheck
```

---

##  API Reference Overview

All business endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/auth/register` — Register account & auto-create default watchlist
- `POST /api/v1/auth/login` — Authenticate & receive JWT access + refresh cookies
- `POST /api/v1/auth/refresh` — Rotate access & refresh tokens
- `POST /api/v1/auth/logout` — Invalidate session cookies
- `GET  /api/v1/auth/me` — Authenticated user profile

### Watchlists (Strict BOLA / IDOR Protected)
- `GET    /api/v1/watchlists` — List all user watchlists with items and live snapshots
- `POST   /api/v1/watchlists` — Create new watchlist
- `GET    /api/v1/watchlists/:id` — Get watchlist details
- `PATCH  /api/v1/watchlists/:id` — Rename or set as default
- `DELETE /api/v1/watchlists/:id` — Delete watchlist
- `POST   /api/v1/watchlists/:id/items` — Add stock to watchlist
- `DELETE /api/v1/watchlists/:id/items/:instrumentId` — Remove stock from watchlist
- `PATCH  /api/v1/watchlists/:id/items/reorder` — Reorder items

### Stocks & Discovery
- `GET /api/v1/stocks/search?q=NVDA` — Search stocks (local DB + Twelve Data lookup)
- `GET /api/v1/stocks/:instrumentId` — Stock details & overview

### Market Data & Technicals
- `GET /api/v1/stocks/:instrumentId/quote` — Latest price, volume, and freshness status
- `GET /api/v1/stocks/:instrumentId/history?range=1M&interval=1day` — OHLCV chart bars
- `GET /api/v1/stocks/:instrumentId/indicators?range=3M` — SMA, EMA, RSI, MACD, Bollinger Bands, ATR
- `GET /api/v1/stocks/:instrumentId/fundamentals` — Company overview & financial ratios
- `GET /api/v1/stocks/:instrumentId/news` — Deduplicated company news feed

###  "Since You Last Checked" Intelligence
- `GET  /api/v1/stocks/:instrumentId/changes-since-last-check` — Core endpoint returning attention score, breakdown, and auditable evidence since user's checkpoint
- `POST /api/v1/stocks/:instrumentId/checkpoint/acknowledge` — Monotonically advances user checkpoint, records change event in history, and resets delta
- `GET  /api/v1/stocks/:instrumentId/change-history?cursor=...&limit=10` — Cursor-paginated history of past acknowledged changes

###  Smart Dashboard
- `GET /api/v1/dashboard/changes` — Ranked watchlist summary ordering all watched stocks by attention score

###  Alerts
- `GET    /api/v1/alerts` — List user alerts
- `POST   /api/v1/alerts` — Create price/volume/move alert
- `PATCH  /api/v1/alerts/:id` — Toggle or update threshold
- `DELETE /api/v1/alerts/:id` — Remove alert

###  Health & Observability
- `GET /health/live` — Process liveness probe
- `GET /health/ready` — PostgreSQL & Redis readiness probe
- `GET /metrics` — Internal metrics registry (requests, latency, cache hits, provider rate limits)

---

##  Judge Talking Points & System Design Defense

| Question | Architectural Defense |
|---|---|
| **Why PostgreSQL?** | ACID transactions for monotonic CAS checkpoint updates, foreign keys, compound indexes (`user_id, instrument_id`), and strong consistency. |
| **Why Redis?** | Shared hot market cache, distributed rate limiting, stampede protection locks, and queue coordination without burdening the primary DB. |
| **Why Modular Monolith?** | Clean domain boundaries (`auth`, `watchlists`, `checkpoints`, `changes`, `providers`) with single-deployment velocity and zero distributed-network overhead. |
| **Why Checkpoints?** | A change is only meaningful relative to what the *specific user* already saw. Storing timestamps per `(user, instrument)` allows custom attention calculations per person. |
| **Why Deterministic Scoring?** | Mathematical rules are transparent, reproducible, low-latency, and auditable—unlike non-deterministic LLM hallucinations. |
| **Why Provider Abstraction?** | Decouples internal domain models from external API schemas. Switching from Twelve Data to Polygon or Finnhub requires zero changes to route handlers or business logic. |
