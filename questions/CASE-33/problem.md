# CASE-33: The Fake Sensor

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** median, consensus, anomaly detection  

---

### Investigation Narrative
One temperature sensor reports plausible but false values.

### Investigator Objective
Compare redundant sensors and locate the inconsistent channel.

### Input Specification
**Input Contract:** Input: n rows of 3 sensor values; print first row where one value differs from median by >10.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect bad sensor.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_33_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10 11 12
10 50 12
20 21 22
```

#### Sample Output 1
```text
1
```
