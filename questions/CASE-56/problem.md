# CASE-56: The Surgical Arm

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** arrays, distance metrics  

---

### Investigation Narrative
A surgical robot deviates slightly from a planned trajectory.

### Investigator Objective
Calculate the maximum positional deviation.

### Input Specification
**Input Contract:** Input: planned and actual 2D points; print maximum Euclidean deviation.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Measure trajectory deviation.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_56_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
2
0.0 0.0 0.0 0.0
1.0 1.0 1.3 1.4
```

#### Sample Output 1
```text
0.5000
```
