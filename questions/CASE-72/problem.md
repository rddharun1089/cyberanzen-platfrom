# CASE-72: The Clean-Room Intrusion

**Domain:** Nanotechnology  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** maps, constraints  

---

### Investigation Narrative
A fabrication log contains an unexplained sequence of parameter changes.

### Investigator Objective
Find the first parameter combination outside the approved envelope.

### Input Specification
**Input Contract:** Input: n parameter triples and min/max bounds; print first out-of-envelope index.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find unauthorized parameter change.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_72_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
18.0 40.0 100.0
22.0 60.0 105.0
20.0 50.0 102.0
25.0 50.0 102.0
20.0 50.0 102.0
```

#### Sample Output 1
```text
1
```
