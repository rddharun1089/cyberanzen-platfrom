# CASE-67: The Docking Failure

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** weighted averages, robust statistics  

---

### Investigation Narrative
A spacecraft docking system rejects a valid approach.

### Investigator Objective
Compare sensor fusion outputs and locate the inconsistent sensor.

### Input Specification
**Input Contract:** Input: sensor values and weights; print sensor whose removal changes weighted mean most.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find inconsistent sensor.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_67_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10.0 1.0
10.0 1.0
100.0 1.0
```

#### Sample Output 1
```text
2
```
