# ENIGMATRIX PLATFORM — FREE HOSTING & CAPACITY ARCHITECTURE PLAN

**Target Workload:** 100 Concurrent Active Participants / 25 Competitive Squads  
**Event Scope:** 80 Connected Forensic Cases, C / C++ / Python 3 Judge Sandbox, Evidence Token Vault, Real-time Team Leaderboard  
**Document Revision:** 2.0 (Post-Refactor Production Architecture)

---

## 1. Executive Summary & Recommended Deployment Topology

To host the **Enigmatrix** platform reliably during a 100-participant competition without unexpected crashes, judge execution timeouts, or exorbitant cloud bills, we recommend a **Hybrid Edge + Low-Cost VPS Topology**:

```
                                  [ INTERNET PARTICIPANTS ]
                                     (100 Concurrent Users)
                                                │
                                    HTTPS / WSS (Port 443)
                                                ▼
                        ┌────────────────────────────────────────────────┐
                        │      Cloudflare Edge Network (100% Free)       │
                        │  - Global CDN Caching & DDoS Protection        │
                        │  - SSL / TLS Termination                       │
                        │  - Cloudflare Pages for React SPA Bundle       │
                        └───────────────────────┬────────────────────────┘
                                                │ API Proxy / DNS Route
                                                ▼
                        ┌────────────────────────────────────────────────┐
                        │  Low-Cost Linux VPS (Hetzner / OVH ~€3.79/mo)  │
                        │  Specs: 2-4 vCPU, 4GB RAM, 40GB NVMe SSD       │
                        │                                                │
                        │  ┌──────────────────────────────────────────┐  │
                        │  │ NGINX / Caddy Reverse Proxy              │  │
                        │  │ - Gzip/Brotli, Rate Limiting (50 rps/ip) │  │
                        │  └──────────────────┬───────────────────────┘  │
                        │                     ▼                          │
                        │  ┌──────────────────────────────────────────┐  │
                        │  │ FastAPI Platform Daemon (Uvicorn)        │  │
                        │  │ - 4 Async Workers (1 per vCPU)           │  │
                        │  │ - SQLAlchemy 2.0 Connection Pool         │  │
                        │  │ - JWT Auth & Squad RBAC                  │  │
                        │  └───────┬──────────────────────────┬───────┘  │
                        │          │                          │          │
                        │          ▼                          ▼          │
                        │  ┌───────────────┐     ┌──────────────────┐  │
                        │  │ SQLite WAL /  │     │ Async Judge Pool │  │
                        │  │ Neon Postgres │     │ - 4-8 Workers    │  │
                        │  │ Database      │     │ - Isolated Linux │  │
                        │  │               │     │   Process Limits │  │
                        │  │               │     │ - Python/C/C++   │  │
                        │  └───────────────┘     └──────────────────┘  │
                        └────────────────────────────────────────────────┘
```

### Why This Hybrid Setup Wins
1. **Frontend Cost: $0.00 / mo** — Hosted on **Cloudflare Pages** (unlimited bandwidth, 100+ edge locations).
2. **Database Cost: $0.00 / mo** — High-speed SQLite in WAL mode on NVMe local disk (zero network latency) OR **Neon / Supabase Serverless Postgres** (free tier supports up to 500MB storage and 100 connections).
3. **Backend & Judge Compute: €3.79 - €4.50 / mo ($4.10)** — A small Hetzner Cloud CX22 VPS handles all 100 concurrent users, local process isolation for C/C++/Python compilation, and full administrative control.

---

## 2. Evaluation of Free & Serverless Hosting Providers

Many modern platforms claim to offer "free hosting". However, competitive programming platforms with interactive code compilers have unique kernel-level execution needs.

### 2.1 Static Frontend Hosting

| Provider | Free Tier Allowance | Suitability | Notes |
| :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | **Unlimited bandwidth**, 500 builds/mo | **Best Choice (Recommended)** | Zero bandwidth limits, fastest global DNS & edge cache, HTTP/3 support out of the box. |
| **Vercel** | 100GB bandwidth/mo, fair use limit | **Good Alternative** | Excellent Git CI/CD, but bandwidth limits can be exceeded during high-traffic events with heavy assets. |
| **GitHub Pages** | 100GB soft limit | **Acceptable** | Lacks dynamic client-side SPA fallback routing without 404 hacks. |
| **Netlify** | 100GB bandwidth, 300 build mins | **Good** | Solid SPA support, but strict bandwidth overage billing. |

### 2.2 Serverless Backend & Database Providers

| Provider | Free Tier Quota | Suitability for Enigmatrix API | Notes |
| :--- | :--- | :--- | :--- |
| **Neon Tech** | 0.5GB Postgres, compute branching, 100 conns | **Excellent (Recommended for DB)** | Scale-to-zero serverless PostgreSQL with connection pooling (PgBouncer). |
| **Supabase** | 500MB DB, 50k active users | **Excellent for DB** | Standard PostgreSQL with built-in connection pooling. |
| **Render (Free)** | 512MB RAM, sleeps after 15 min idle | **Unsuitable for Production Event** | 50-second cold start latency; shuts down after inactivity; cannot run judge sandboxes. |
| **Fly.io (Hobby)** | 3 shared-cpu-1x 256MB VMs | **Too Low RAM** | 256MB RAM is insufficient for concurrent GCC compilation (GCC consumes 120-250MB per compilation). |
| **Koyeb / Railway** | Small credit tier | **Limited** | Railway requires paid card after trial; Koyeb free tier limits CPU to 0.1 vCPU. |

---

## 3. The Online Judge Problem: Why Serverless Containers Fail for Code Execution

Standard serverless platforms (AWS Lambda, Vercel Functions, Cloudflare Workers, Google Cloud Run) **cannot reliably or securely host an online judge execution engine**.

### Technical Root Causes:
1. **Lack of Kernel Sandboxing Primitives:**
   - Online judges require Linux `seccomp` (Secure Computing Mode), `ptrace`, `chroot`, or `cgroups v2` to prevent malicious participant submissions from executing fork-bombs, modifying root filesystems, or opening unauthorized reverse shells.
   - Serverless functions run inside locked-down micro-VMs (e.g. AWS Firecracker) that **forbid nested containerization** and block `ptrace` or custom seccomp filters.
2. **Missing Compilers:**
   - Free container platforms provide stripped-down Alpine or Debian runtimes without `gcc`, `g++`, `glibc-static`, or Python development headers installed. Adding these packages bloats image sizes past free upload limits.
3. **Execution Timeouts & Ephemeral Filesystems:**
   - Compiling C++ with heavy STL headers takes 1.5–3.5 seconds on shared vCPUs. Serverless cold starts compound this to 6–10 seconds, causing participant timeouts.
4. **Memory Spikes during Compilation:**
   - Compiling `CASE-80` or template-heavy C++ algorithms can spike RAM consumption to 200MB+ per process. A 512MB free tier container running both FastAPI and GCC will trigger an **OOM (Out-of-Memory) Kill** under concurrent submissions.

---

## 4. The Recommended Low-Cost VPS Architecture

To provide zero-lag judging for 100 concurrent participants, the entire backend and judge system can run on a single budget VPS:

### Hardware Specifications & Budget Providers
- **Provider:** Hetzner Cloud (Model CX22 or CX32) / OVH VPS / Contabo
- **Specs:** 2 to 4 vCPUs (x86_64 or ARM64 Ampere), 4GB RAM, 40GB NVMe SSD
- **Monthly Cost:** €3.79 / month ($4.10 USD) or €6.50 / month ($7.00 USD)
- **Bandwidth:** 20 TB included (more than 100x required capacity)

### Architecture Configuration

#### A. Database: Local SQLite with WAL (Write-Ahead Logging)
```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA temp_store=MEMORY;
PRAGMA mmap_size=268435456; -- 256MB memory-mapped I/O
PRAGMA cache_size=-64000;    -- 64MB cache
```
- SQLite in WAL mode allows **unlimited concurrent reads** and handles concurrent writes with atomic serialize locks in < 2 milliseconds on NVMe storage.
- Zero network round-trip overhead compared to remote Postgres.

#### B. Reverse Proxy: NGINX Configuration
```nginx
upstream fastapi_app {
    server 127.0.0.1:8000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.enigmatrix.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.enigmatrix.org;

    ssl_certificate /etc/letsencrypt/live/api.enigmatrix.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.enigmatrix.org/privkey.pem;

    # Rate limiting for competition integrity
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
    limit_req zone=api_limit burst=50 nodelay;

    location / {
        proxy_pass http://fastapi_app;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### C. Systemd Service Definition (`/etc/systemd/system/enigmatrix.service`)
```ini
[Unit]
Description=Enigmatrix Cyber Intelligence Platform
After=network.target

[Service]
User=enigmatrix
WorkingDirectory=/opt/enigmatrix-program
Environment="PATH=/opt/enigmatrix-program/venv/bin:/usr/bin"
Environment="PYTHONPATH=/opt/enigmatrix-program/backend"
ExecStart=/opt/enigmatrix-program/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=3
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

---

## 5. Capacity & Sizing Calculations for 100 Concurrent Users

### 5.1 Peak Traffic Modeling
- **Active Participants:** 100 users organized into 25 squads (4 operatives per squad).
- **Session Duration:** 2 to 3 hours.
- **Estimated Actions per User:**
  - Case Dossier View: 1 every 2 minutes.
  - Team Leaderboard Refresh: 1 every 15–30 seconds.
  - Code Sample Run: 1 every 3 minutes.
  - Code Submission to Judge: 1 every 5 minutes.
- **Peak Request Rate:**
  - Leaderboard & Stats Polling: ~100 requests / 20s = **5 req/sec**
  - Dossier & Case Navigation: ~100 requests / 60s = **1.6 req/sec**
  - Code Submissions: ~100 submissions / 300s = **0.33 sub/sec** (bursting to **2–3 sub/sec** during opening minutes and closing countdown).
  - **Total Aggregate Peak Throughput:** **15 to 25 requests/second**.

### 5.2 Memory Budget Breakdown (4GB RAM VPS)

| Component | Resident Memory (RAM) | Calculation / Sizing |
| :--- | :--- | :--- |
| **Linux OS & System Daemons** | 350 MB | Systemd, journald, sshd, rsyslog |
| **NGINX Reverse Proxy** | 45 MB | 2 worker processes with keepalive pools |
| **FastAPI Backend (4 Uvicorn Workers)** | 380 MB | ~95 MB per worker process |
| **Database (SQLite WAL cache)** | 128 MB | Memory-mapped I/O and page cache |
| **Judge Process Queue (Concurrency Limit: 4)** | 800 MB | ~150-200 MB per concurrent GCC/G++ compile |
| **Safety Headroom & Linux Buffer Cache** | 2,300 MB | Dynamic disk cache for instant binary reads |
| **Total VPS Memory Required** | **~1.7 GB Active** | **Comfortably fits in 4GB VPS (< 45% load)** |

### 5.3 CPU Budget Breakdown (4 vCPU)
- **FastAPI Request Handling:** Each async request consumes < 3ms CPU time. At 25 req/sec, total CPU demand for web API is ~7.5% of 1 vCPU.
- **Judge Compilations:** GCC compiling C++ consumes ~1.2s CPU time on 1 core. With a worker semaphore of 4, compilation utilizes up to 4 cores momentarily during bursts without locking the API event loop.
- **Queue Protection:** Under a spike of 20 concurrent code submissions, submissions are queued asynchronously. Participants experience a queue latency of at most 2–4 seconds, which is standard for competitive programming judges (e.g. Codeforces, DMOJ).

---

## 6. Zero-Downtime Migration & Deployment Runbook

### Step 1: Deploy Static Frontend to Cloudflare Pages
1. Push codebase to GitHub repository.
2. In Cloudflare Dashboard -> **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**.
3. Set build configuration:
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `18` or `20`
4. In `frontend/src/services/api.js`, configure `VITE_API_URL` to point to `https://api.yourdomain.org/api/v1`.

### Step 2: Provision Budget VPS
1. Launch an Ubuntu 24.04 LTS instance on Hetzner Cloud (CX22, €3.79/mo).
2. Install system build tools:
   ```bash
   sudo apt update && sudo apt install -y python3-venv python3-pip gcc g++ git nginx certbot python3-certbot-nginx
   ```
3. Clone repository into `/opt/enigmatrix-program`.
4. Create python venv and install dependencies:
   ```bash
   cd /opt/enigmatrix-program
   python3 -m venv venv
   ./venv/bin/pip install -r backend/requirements.txt
   ```
5. Initialize the database and populate all 80 cases:
   ```bash
   PYTHONPATH=backend ./venv/bin/python backend/app/db/init_db.py
   ```
6. Start systemd service and configure NGINX with SSL via `certbot`.

---

## 7. Operational Readiness Checklist

- [x] Concurrency-safe team scoring with database-level unique constraints.
- [x] JWT sessions with real-time revocation upon user account deletion.
- [x] Static frontend bundle optimized (< 400KB gzipped).
- [x] Rate limiting configured on reverse proxy (30 req/sec per IP).
- [x] Database WAL mode enabled for concurrent read scaling.
- [x] Judge queue semaphore set to 4 concurrent sandbox workers to prevent CPU exhaustion.
- [x] Backup cron configured: daily automated SQLite backup via `sqlite3 cyberanzen.db ".backup '/backup/backup-$(date +%F).db'"`.
