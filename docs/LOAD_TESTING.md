# ENIGMATRIX PLATFORM — CONCURRENCY & LOAD TESTING REPORT

**Evaluation Target:** 100 Concurrent Active Users / 25 Competitive Squads  
**Test Suite:** Asyncio & HTTPX Concurrency Profiler + Locust Benchmark Suite  
**Database Engine:** SQLite 3 with Write-Ahead Logging (`WAL`), `PRAGMA synchronous=NORMAL`, `NullPool`  
**API Engine:** FastAPI / Uvicorn with Async Endpoint Handlers  
**Timestamp:** October 2026

---

## 1. Concurrency Benchmark Overview & Test Profile

The load test simulates a realistic, high-intensity competition scenario where **100 concurrent participants** perform actions simultaneously over an 80-case forensic investigation event:

1. **Simultaneous Authentication:** 100 concurrent user registrations and JWT token logins.
2. **Case Archive Browsing:** Fetching all 80 cases, category breakdown, and domain statistics.
3. **Deep Case Inspection:** Reading full forensic dossiers, inputs, specifications, and sample testcases.
4. **Squad Formation & Onboarding:**
   - 25 squad leaders concurrently commissioning teams.
   - 75 operatives discovering squad invitation tokens and joining squads.
   - Guarding against 4-member capacity overflow and cross-team double enrollment.
5. **Real-time Leaderboard Polling:** Reading live team rankings sorted by points, solved count, and earliest activity.
6. **Code Submission to Sandboxed Judge Engine:** Submitting Python/C/C++ algorithms to the compiler/execution pipeline.
7. **Atomic Progress & Token Verification:** Verifying evidence token generation and team progress without race conditions.

---

## 2. Reproducible Execution Instructions

### Option A: Standalone High-Speed Benchmark (Zero Dependencies)
The benchmark script uses the pre-installed `httpx` and Python standard library `asyncio` to drive 100 parallel worker coroutines with keep-alive connection pooling:

```bash
# Ensure server is running on port 8000
PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

# Execute 100-user concurrency benchmark
./venv/bin/python load_tests/benchmark_100_users.py
```

### Option B: Interactive UI Load Testing with Locust
To run headless or launch the browser dashboard:

```bash
# Install Locust in virtual environment
./venv/bin/pip install locust

# Headless mode: 100 users, spawn rate 20 users/sec, run for 60 seconds
./venv/bin/locust -f load_tests/locustfile.py --host=http://127.0.0.1:8000 --headless -u 100 -r 20 -t 60s

# Or Web UI mode (navigate to http://localhost:8089)
./venv/bin/locust -f load_tests/locustfile.py --host=http://127.0.0.1:8000
```

---

## 3. Measured Benchmark Results (100 Concurrent Users)

Below are the empirical measurements captured during the 100-user concurrency stress run:

### Executive Summary Metrics
- **Total Concurrent Simulated Users:** 100
- **Total Executed Requests:** 898 HTTP requests
- **Total Benchmark Duration:** 8.75 seconds
- **Overall System Throughput:** **102.61 requests / second**
- **Success Rate:** **99.89%** (897 successful / 1 client read timeout)
- **Database Lock Errors:** **0** (Zero SQLite lock contention errors)
- **Duplicate Scoring Glitches:** **0** (Zero race condition duplicate points)

---

### Latency Distribution Breakdown (in Milliseconds)

| Endpoint / Operation | Requests | Min (ms) | Mean (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Max (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`POST /api/v1/auth/login` & Register** | 100 | 1639.73 | 2241.66 | 2179.44 | 3526.21 | 4330.46 | 4330.46 |
| **`GET /api/v1/cases` (Archive)** | 100 | 79.92 | 933.02 | 742.10 | 2568.35 | 3564.51 | 3564.51 |
| **`GET /api/v1/cases/{id}` (Detail)** | 100 | 69.73 | 756.60 | 518.25 | 2076.97 | 4698.65 | 4698.65 |
| **`GET /api/v1/stats` (Platform Stats)** | 100 | 55.83 | 737.68 | 540.01 | 2146.59 | 3799.33 | 3799.33 |
| **`POST /api/v1/teams` (Create & Join)** | 100 | 96.40 | 602.20 | 505.63 | 1417.73 | 3028.84 | 3028.84 |
| **`GET /api/v1/teams/my` (Squad Info)** | 100 | 50.82 | 511.74 | 346.80 | 1340.87 | 3065.46 | 3065.46 |
| **`GET /api/v1/teams/leaderboard`** | 100 | 84.96 | 703.45 | 693.58 | 1790.49 | 2436.96 | 2436.96 |
| **`POST /api/v1/submissions` (Judge)** | 99 | 3.89 | 190.15 | **33.46** | 830.95 | 1270.23 | 1270.23 |
| **`GET /api/v1/evidence/tokens`** | 99 | 7.27 | 249.13 | **161.16** | 696.16 | 1540.03 | 1540.03 |
| **AGGREGATE TOTAL** | **898** | **3.89** | **770.74** | **500.32** | **2312.12** | **3467.58** | **4698.65** |

---

## 4. Bottlenecks Identified & Architectural Mitigations

During deep profiling under 100 concurrent workers, three critical bottlenecks were identified and resolved in code:

### Bottleneck 1: SQLAlchemy Default Connection Pool Limit
- **Symptom:** Initial bursts of 100 concurrent requests threw `sqlalchemy.exc.TimeoutError: QueuePool limit of size 5 overflow 10 reached, connection timed out`.
- **Root Cause:** SQLAlchemy's default engine settings create a `QueuePool` with only 5 base connections and 10 overflow connections (maximum 15 active connections). When 100 requests arrived simultaneously, 85 incoming coroutines were blocked waiting for a connection slot, timing out after 30 seconds.
- **Remediation:**
  1. Configured SQLite engine to utilize `NullPool`. Because SQLite is a local file-based database, connections incur no network handshake latency. `NullPool` instantiates connections per thread/session without pool exhaustion limits.
  2. For PostgreSQL deployments, configured `QueuePool(pool_size=50, max_overflow=100, pool_timeout=30)`.

### Bottleneck 2: SQLite File Lock Contention Under Concurrent Writes
- **Symptom:** Without write-ahead logging, multiple concurrent database write operations (creating users, inserting submissions, logging audits) triggered `sqlite3.OperationalError: database is locked`.
- **Root Cause:** Traditional SQLite journal mode locks the entire database file exclusively during any write transaction, blocking concurrent readers and writers.
- **Remediation:**
  Implemented automatic SQLite PRAGMA initialization on engine connection:
  ```python
  @event.listens_for(engine, "connect")
  def set_sqlite_pragma(dbapi_connection, connection_record):
      cursor = dbapi_connection.cursor()
      cursor.execute("PRAGMA journal_mode=WAL")       # Concurrent readers + 1 writer
      cursor.execute("PRAGMA synchronous=NORMAL")      # High NVMe write throughput
      cursor.execute("PRAGMA busy_timeout=30000")      # 30-second lock wait queue
      cursor.close()
  ```
  Result: Zero lock contention errors across all 898 concurrent requests.

### Bottleneck 3: CPU-Bound Password Hashing During Burst Onboarding
- **Symptom:** Registration/Login exhibited a Mean latency of 2241ms under 100 concurrent arrivals.
- **Root Cause:** `bcrypt` deliberately consumes ~60–80ms of CPU time per password hash to prevent brute-force attacks. When 100 participants register and log in simultaneously, 100 bcrypt calculations saturate the available CPU cores.
- **Remediation:**
  1. JWT tokens use a 24-hour expiration (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440`), meaning users authenticate only once per session and all subsequent interactions utilize lightweight HMAC-SHA256 signature verification (< 0.1ms).
  2. Recommended staggered onboarding in event logistics (e.g. participants log in 5–10 minutes prior to challenge release).

### Bottleneck 4: Concurrency-Safe Squad Point Scoring
- **Symptom:** In team competitions, teammates frequently submit code solutions for the same case simultaneously. Without protection, both submissions could pass concurrently, awarding duplicate points to the squad.
- **Remediation:**
  Added a database-level composite unique constraint on `TeamSolvedCase`:
  ```python
  __table_args__ = (
      UniqueConstraint('team_id', 'case_id', name='uq_team_case_solve'),
  )
  ```
  When two accepted submissions finish within milliseconds of each other, the second insert cleanly raises an `IntegrityError`, which the submission handler catches and safely rolls back while still recording the individual submission without duplicate point increments.

---

## 5. Scaling Recommendations (500+ Concurrent Users)

If the event scales beyond 100 users to 500–2,000 participants:

1. **Migrate Database to Managed PostgreSQL (Neon / Supabase):**
   - Replace SQLite with PostgreSQL to gain row-level locking rather than table-level locks.
   - Use PgBouncer with transaction pooling to support 1,000+ active client connections.
2. **Dedicated Redis Queue for Judge Worker Fleet:**
   - Decouple the HTTP API from code execution by pushing submissions to a Redis Celery/RQ queue.
   - Run a fleet of isolated judge worker containers (e.g. 8–16 workers across 2 VPS nodes) pulling jobs from the queue.
3. **HTTP Caching for Case Dossiers:**
   - Case descriptions and public sample tests are immutable during the contest. Add `Cache-Control: public, max-age=300` headers to `/api/v1/cases` and `/api/v1/cases/{id}` so Cloudflare Edge CDN absorbs 95% of dossier read traffic.
