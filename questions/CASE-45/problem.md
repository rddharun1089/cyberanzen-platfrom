# CASE-45: The Drone Gateway

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** priority queues, timestamps  

---

### Investigation Narrative
A drone gateway receives commands from two competing sources.

### Investigator Objective
Order commands and detect the conflicting controller.

### Input Specification
**Input Contract:** Input: n commands `priority time source`; sort by priority desc/time asc and print source order.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Resolve competing commands.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_45_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
10 5 GCS1
20 2 PILOT
10 1 AUTO
```

#### Sample Output 1
```text
PILOT AUTO GCS1
```
