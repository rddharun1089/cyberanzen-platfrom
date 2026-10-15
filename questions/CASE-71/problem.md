# CASE-71: The Fabricated Experiment

**Domain:** Nanotechnology  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** frequency analysis, entropy  

---

### Investigation Narrative
Experimental results contain repeated values that look artificially generated.

### Investigator Objective
Detect suspicious regularity and identify the affected runs.

### Input Specification
**Input Contract:** Input: measurements; print values occurring in >20% of runs.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect suspicious regularity.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_71_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
5
10 10 20 30 40
```

#### Sample Output 1
```text
10
```
