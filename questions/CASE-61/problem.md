# CASE-61: The Hidden Controller

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, joins  

---

### Investigation Narrative
A robot accepts commands from an unknown controller.

### Investigator Objective
Correlate controller IDs with network timing and isolate the unauthorized source.

### Input Specification
**Input Contract:** Input: records `controller time`; print controller with highest event count.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find controller source.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_61_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4
CTRL_ROGUE 100
CTRL_LEGIT 101
CTRL_ROGUE 102
CTRL_ROGUE 103
```

#### Sample Output 1
```text
CTRL_ROGUE 3
```
