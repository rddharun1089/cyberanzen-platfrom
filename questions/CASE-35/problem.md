# CASE-35: The Voltage Drop

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** search, threshold detection  

---

### Investigation Narrative
A device shuts down during a covert test.

### Investigator Objective
Find the first voltage threshold violation from sampled telemetry.

### Input Specification
**Input Contract:** Input: n voltage readings and threshold; print first index below threshold.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find failure point.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_35_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4 3.0
3.3 3.2 2.8 3.1
```

#### Sample Output 1
```text
2
```
