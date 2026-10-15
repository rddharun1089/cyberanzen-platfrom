# CASE-46: The Sensor Swarm

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** median, subset analysis  

---

### Investigation Narrative
A group of sensors is manipulated to agree on a false reading.

### Investigator Objective
Find the smallest inconsistent subset using consensus checks.

### Input Specification
**Input Contract:** Input: n readings and tolerance; print indices differing from median by > tolerance.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find manipulated sensors.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_46_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
10.0 10.2 10.1 25.0 9.9
2.0
```

#### Sample Output 1
```text
3
```
