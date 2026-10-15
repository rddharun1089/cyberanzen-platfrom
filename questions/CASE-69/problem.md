# CASE-69: Nanoparticle 47

**Domain:** Nanotechnology  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** statistics, anomaly detection  

---

### Investigation Narrative
A research batch is deliberately contaminated.

### Investigator Objective
Use measurement features to identify the anomalous batch.

### Input Specification
**Input Contract:** Input: n rows of measurements; print row with largest standardized distance.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find contaminated batch.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_69_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10 10 10
10 10 10
100 100 100
```

#### Sample Output 1
```text
2
```
