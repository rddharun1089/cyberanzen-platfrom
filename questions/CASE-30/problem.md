# CASE-30: The Last Five Minutes

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** time-series differences, sorting  

---

### Investigation Narrative
A telemetry table contains the final five minutes before a system failure.

### Investigator Objective
Rank variables by change rate and identify the strongest precursor.

### Input Specification
**Input Contract:** Input: n rows `time v1 v2`; print variable with largest total absolute change.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find strongest precursor.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_30_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10 100.0 50.0
20 120.0 51.0
30 90.0 52.0
```

#### Sample Output 1
```text
1 50.00
```
