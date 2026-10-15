# CASE-29: The Missing Cluster

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** distance, k-means-style iteration  

---

### Investigation Narrative
Research samples from one location form an unexplained cluster.

### Investigator Objective
Cluster observations and identify the suspicious group.

### Input Specification
**Input Contract:** Input: n 2D points and threshold; print indices whose distance from centroid > threshold.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find isolated cluster.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_29_<COMPUTED_RESULT>}`
