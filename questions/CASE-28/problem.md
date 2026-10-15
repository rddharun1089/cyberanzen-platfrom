# CASE-28: The False Correlation

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** correlation, normalization  

---

### Investigation Narrative
An investigator claims two signals prove a conspiracy.

### Investigator Objective
Calculate correlation and test whether the apparent relationship is misleading.

### Input Specification
**Input Contract:** Input: two arrays; print Pearson correlation rounded 4 decimals.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Test correlation.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_28_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
1.0 2.0 3.0 4.0 5.0
2.0 4.0 6.0 8.0 10.0
```

#### Sample Output 1
```text
1.0000
```
