# CASE-02: Midnight Credential

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, interval analysis, anomaly detection  

---

### Investigation Narrative
A stolen employee credential is used from three locations within an impossible time window.

### Investigator Objective
Correlate authentication events and detect the impossible travel sequence.

### Input Specification
**Input Contract:** Input: n lines `user location hour`; a user is impossible if consecutive events are <2 hours apart and locations differ.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Print the first impossible user and pair index.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_02_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
alice NYC 10
bob LON 11
alice TOK 11
```

#### Sample Output 1
```text
alice 2
```
