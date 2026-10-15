# CASE-55: Robot 17

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, shortest path  

---

### Investigation Narrative
A warehouse robot takes an unauthorized route to a restricted zone.

### Investigator Objective
Reconstruct its path and find the first abnormal waypoint.

### Input Specification
**Input Contract:** Input: weighted grid; print shortest path cost from S to T.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct robot route.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_55_<COMPUTED_RESULT>}`
