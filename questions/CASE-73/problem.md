# CASE-73: The Missing Sample

**Domain:** Nanotechnology  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hash maps, joins, sorting  

---

### Investigation Narrative
A critical nanoscale sample disappears between two processing stages.

### Investigator Objective
Reconcile batch IDs and process timestamps to locate the missing transfer.

### Input Specification
**Input Contract:** Input: expected IDs and observed IDs; print missing IDs.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Locate missing transfer.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_73_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
S1 S2 S3 S4
S1 S3
```

#### Sample Output 1
```text
S2 S4
```
