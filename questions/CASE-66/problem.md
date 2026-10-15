# CASE-66: The Radar Shadow

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** tracking, nearest-neighbor logic  

---

### Investigation Narrative
Radar returns contain one artificial target.

### Investigator Objective
Separate the true track from the injected track.

### Input Specification
**Input Contract:** Input: 2D radar points and expected center; print farthest point.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Identify injected track.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_66_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
0.0 0.0
1.0 1.0
2.0 2.0
10.0 10.0
```

#### Sample Output 1
```text
10.00 10.00
```
