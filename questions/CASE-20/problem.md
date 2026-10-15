# CASE-20: The Drifted Factory

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** mean, variance, histogram distance  

---

### Investigation Narrative
A production model slowly loses accuracy as sensor distributions change.

### Investigator Objective
Detect distribution drift between reference and live windows.

### Input Specification
**Input Contract:** Input: two equal-length numeric datasets; print absolute mean difference.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect distribution drift.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_20_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
1.0 2.0 3.0
4.0 5.0 6.0
```

#### Sample Output 1
```text
3.000000
```
