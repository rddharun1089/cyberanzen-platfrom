# CASE-62: The Satellite That Lied

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** time series, anomaly detection  

---

### Investigation Narrative
A satellite transmits impossible altitude readings before losing contact.

### Investigator Objective
Detect the telemetry anomaly and reconstruct the last valid state.

### Input Specification
**Input Contract:** Input: altitude values and physical min/max; print first out-of-range index.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect telemetry anomaly.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_62_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4
400.0 500.0
450.0 460.0 520.0 480.0
```

#### Sample Output 1
```text
2
```
