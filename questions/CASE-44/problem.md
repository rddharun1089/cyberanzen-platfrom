# CASE-44: The Smart Lock Replay

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sets, hashing, validation  

---

### Investigation Narrative
A valid unlock message is replayed later.

### Investigator Objective
Determine which message is a replay using nonce and timestamp history.

### Input Specification
**Input Contract:** Input: n nonce,timestamp pairs; print first repeated nonce.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect replay.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_44_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
NONCE1 100
NONCE2 105
NONCE1 110
```

#### Sample Output 1
```text
NONCE1
```
