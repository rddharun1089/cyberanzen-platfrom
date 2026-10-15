# CASE-65: The Navigation Drift

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** vectors, numerical analysis  

---

### Investigation Narrative
An autonomous aircraft slowly diverges from its planned route.

### Investigator Objective
Calculate cumulative deviation and find the first threshold breach.

### Input Specification
**Input Contract:** Input: planned and actual x,y points; print first index distance > threshold.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find route breach.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_65_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
2.0
0.0 0.0 0.0 0.0
1.0 1.0 1.0 2.0
5.0 5.0 8.0 9.0
```

#### Sample Output 1
```text
2
```
