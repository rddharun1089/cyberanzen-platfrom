# CASE-74: The Autonomous Heist

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, event correlation, anomaly detection  

---

### Investigation Narrative
A cyber intrusion manipulates an IoT-controlled robot to steal a research sample.

### Investigator Objective
Correlate network commands, sensor states and robot movement.

### Input Specification
**Input Contract:** Input: events `time domain id`; sort and print first time where CYBER, IOT and ROBOT all appear within 60 seconds.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Correlate cross-domain crime.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_74_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4
10 CYBER E1
30 IOT E2
50 ROBOT E3
100 CYBER E4
```

#### Sample Output 1
```text
50
```
