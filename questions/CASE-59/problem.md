# CASE-59: The Gripper Incident

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** statistics, thresholds  

---

### Investigation Narrative
A robotic gripper applies excessive force for one object.

### Investigator Objective
Detect the outlier force profile.

### Input Specification
**Input Contract:** Input: force readings; print indices above mean+2*std.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect excessive force.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_59_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
6
10.0 10.0 10.0 10.0 10.0 50.0
```

#### Sample Output 1
```text
5
```
