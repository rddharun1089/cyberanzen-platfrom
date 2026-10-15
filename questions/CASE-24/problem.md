# CASE-24: The Vanishing Shipment

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** joins, aggregation, time series  

---

### Investigation Narrative
Shipment records disagree with warehouse scans.

### Investigator Objective
Reconcile records and identify the earliest impossible movement.

### Input Specification
**Input Contract:** Input: n records `id source destination time`; print IDs whose destination at time t differs from next source.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconcile movement.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_24_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
SHIP1 PortA PortB 10
SHIP1 PortC PortD 20
SHIP2 Dock1 Dock2 5
```

#### Sample Output 1
```text
SHIP1
```
