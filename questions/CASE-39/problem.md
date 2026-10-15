# CASE-39: The Smart Home Break-In

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** multi-source joins, timestamps  

---

### Investigation Narrative
A smart building reports a door opening while the access controller says it remained locked.

### Investigator Objective
Correlate door, motion and access-device events.

### Input Specification
**Input Contract:** Input: door,motion,access events as `time type`; print first door-open time without nearby valid access.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Correlate IoT evidence.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_39_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10 ACCESS
12 DOOR
50 DOOR
```

#### Sample Output 1
```text
50
```
