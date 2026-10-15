#!/usr/bin/env python3
"""
Enigmatrix Platform - 100 Concurrent Users Concurrency Benchmark
Simulates 100 concurrent participants performing realistic event actions:
- Authentication & Session establishment
- Browsing Dossier Archive & Fetching case specifications
- Squad Formation (25 teams of 4 operatives) & Invitation Token Joining
- Polling Live Team Leaderboards and Stats
- Submitting Code to Sandboxed Judge Engine
- Verifying Idempotent Shared Progress & Evidence Tokens

Reports comprehensive latency distributions: Min, Mean, Median (P50), P95, P99, Max, and RPS.
"""

import asyncio
import time
import statistics
import sys
from typing import List, Dict, Any
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"
NUM_USERS = 100
PASS_WORD = "Benchmark#Pass2026!"

# Track latency per endpoint category
metrics: Dict[str, List[float]] = {
    "auth_register_login": [],
    "cases_list": [],
    "case_detail": [],
    "stats": [],
    "team_create_or_join": [],
    "team_my": [],
    "team_leaderboard": [],
    "code_submission": [],
    "evidence_tokens": []
}

errors: List[str] = []

async def simulate_user(user_index: int, client: httpx.AsyncClient, team_invites: Dict[int, str], invite_ready_events: Dict[int, asyncio.Event]):
    username = f"load_operative_{user_index}"
    team_index = user_index // 4  # 25 teams of 4
    is_team_owner = (user_index % 4 == 0)

    try:
        # 1. Register / Login
        t0 = time.perf_counter()
        reg_res = await client.post(f"{BASE_URL}/auth/register", json={
            "username": username,
            "password": PASS_WORD,
            "email": f"{username}@enigmatrix.org"
        })
        if reg_res.status_code not in (200, 201, 400):
            errors.append(f"Register failed for {username}: {reg_res.status_code}")
            return

        login_res = await client.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": PASS_WORD
        })
        lat = (time.perf_counter() - t0) * 1000
        metrics["auth_register_login"].append(lat)

        if login_res.status_code != 200:
            errors.append(f"Login failed for {username}: {login_res.status_code}")
            return

        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Browse Case Dossiers
        t0 = time.perf_counter()
        cases_res = await client.get(f"{BASE_URL}/cases", headers=headers)
        metrics["cases_list"].append((time.perf_counter() - t0) * 1000)

        # 3. Read Case Detail (CASE-01 to CASE-05)
        case_id = f"CASE-0{(user_index % 5) + 1}"
        t0 = time.perf_counter()
        detail_res = await client.get(f"{BASE_URL}/cases/{case_id}", headers=headers)
        metrics["case_detail"].append((time.perf_counter() - t0) * 1000)

        # 4. Fetch Platform Stats
        t0 = time.perf_counter()
        stats_res = await client.get(f"{BASE_URL}/stats", headers=headers)
        metrics["stats"].append((time.perf_counter() - t0) * 1000)

        # 5. Team Formation / Joining
        if is_team_owner:
            t0 = time.perf_counter()
            t_res = await client.post(f"{BASE_URL}/teams", json={
                "name": f"Squad-Echo-{team_index:02d}"
            }, headers=headers)
            lat = (time.perf_counter() - t0) * 1000
            metrics["team_create_or_join"].append(lat)

            if t_res.status_code in (200, 201):
                invite_code = t_res.json()["team"]["invitation_code"]
                team_invites[team_index] = invite_code
            else:
                # Retrieve existing team if already created
                my_t = await client.get(f"{BASE_URL}/teams/my", headers=headers)
                if my_t.status_code == 200 and my_t.json().get("team"):
                    team_invites[team_index] = my_t.json()["team"]["invitation_code"]
            invite_ready_events[team_index].set()
        else:
            # Wait for owner to create team and provide invite code
            try:
                await asyncio.wait_for(invite_ready_events[team_index].wait(), timeout=30.0)
            except asyncio.TimeoutError:
                pass
            invite_code = team_invites.get(team_index)
            if invite_code:
                t0 = time.perf_counter()
                j_res = await client.post(f"{BASE_URL}/teams/join", json={
                    "invitation_code": invite_code
                }, headers=headers)
                metrics["team_create_or_join"].append((time.perf_counter() - t0) * 1000)

        # 6. Fetch My Team Details
        t0 = time.perf_counter()
        my_team_res = await client.get(f"{BASE_URL}/teams/my", headers=headers)
        metrics["team_my"].append((time.perf_counter() - t0) * 1000)

        # 7. Poll Team Leaderboard
        t0 = time.perf_counter()
        lb_res = await client.get(f"{BASE_URL}/teams/leaderboard", headers=headers)
        metrics["team_leaderboard"].append((time.perf_counter() - t0) * 1000)

        # 8. Submit Code for Evaluation (CASE-01 Python solution)
        code_py = 'import sys\nline = sys.stdin.read().split()\nif len(line) >= 2:\n    print(int(line[0]) + int(line[1]))\n'
        t0 = time.perf_counter()
        sub_res = await client.post(f"{BASE_URL}/submissions", json={
            "case_id": "CASE-01",
            "language": "python",
            "code": code_py
        }, headers=headers, timeout=30.0)
        metrics["code_submission"].append((time.perf_counter() - t0) * 1000)

        # 9. Verify Evidence Tokens
        t0 = time.perf_counter()
        ev_res = await client.get(f"{BASE_URL}/evidence/tokens", headers=headers)
        metrics["evidence_tokens"].append((time.perf_counter() - t0) * 1000)

    except Exception as e:
        errors.append(f"Operative {user_index} exception: {repr(e)}")

def compute_percentiles(latencies: List[float]) -> Dict[str, float]:
    if not latencies:
        return {"min": 0, "mean": 0, "p50": 0, "p90": 0, "p95": 0, "p99": 0, "max": 0, "count": 0}
    sorted_lat = sorted(latencies)
    n = len(sorted_lat)
    return {
        "count": n,
        "min": round(sorted_lat[0], 2),
        "mean": round(statistics.mean(sorted_lat), 2),
        "p50": round(statistics.median(sorted_lat), 2),
        "p90": round(sorted_lat[min(int(n * 0.90), n - 1)], 2),
        "p95": round(sorted_lat[min(int(n * 0.95), n - 1)], 2),
        "p99": round(sorted_lat[min(int(n * 0.99), n - 1)], 2),
        "max": round(sorted_lat[-1], 2),
    }

async def main():
    print(f"============================================================")
    print(f"   ENIGMATRIX PLATFORM CONCURRENCY LOAD BENCHMARK")
    print(f"   Simulating {NUM_USERS} Concurrent Active Users")
    print(f"   Target System: {BASE_URL}")
    print(f"============================================================\n")

    num_teams = NUM_USERS // 4
    team_invites: Dict[int, str] = {}
    invite_ready_events = {i: asyncio.Event() for i in range(num_teams)}

    # Configure connection pool limits for 100 concurrent workers
    limits = httpx.Limits(max_keepalive_connections=120, max_connections=150)
    timeout = httpx.Timeout(30.0, connect=10.0)

    start_benchmark = time.perf_counter()

    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        tasks = [
            simulate_user(i, client, team_invites, invite_ready_events)
            for i in range(NUM_USERS)
        ]
        await asyncio.gather(*tasks)

    total_time = time.perf_counter() - start_benchmark
    total_requests = sum(len(v) for v in metrics.values())
    rps = total_requests / total_time if total_time > 0 else 0

    print(f"\n--- BENCHMARK RESULTS ({NUM_USERS} CONCURRENT USERS) ---")
    print(f"Total Time:         {total_time:.2f} seconds")
    print(f"Total Requests:     {total_requests}")
    print(f"Throughput:         {rps:.2f} req/sec")
    print(f"Errors/Exceptions:  {len(errors)}")

    if errors:
        print("\nSample Errors:")
        for err in errors[:5]:
            print(f"  [!] {err}")

    print("\nLatency Breakdown (Milliseconds):")
    print(f"{'Endpoint':<22} | {'Count':<6} | {'Min':<7} | {'Mean':<7} | {'P50':<7} | {'P95':<7} | {'P99':<7} | {'Max':<7}")
    print("-" * 85)

    all_latencies = []
    for cat, lats in metrics.items():
        all_latencies.extend(lats)
        st = compute_percentiles(lats)
        print(f"{cat:<22} | {st['count']:<6} | {st['min']:<7} | {st['mean']:<7} | {st['p50']:<7} | {st['p95']:<7} | {st['p99']:<7} | {st['max']:<7}")

    agg = compute_percentiles(all_latencies)
    print("-" * 85)
    print(f"{'AGGREGATE TOTAL':<22} | {agg['count']:<6} | {agg['min']:<7} | {agg['mean']:<7} | {agg['p50']:<7} | {agg['p95']:<7} | {agg['p99']:<7} | {agg['max']:<7}")
    print(f"============================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
