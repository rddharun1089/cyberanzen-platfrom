# CASE-11: The Insider Email

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** strings, validation, parsing  

---

### Investigation Narrative
An internal message was forged using a valid-looking header.

### Investigator Objective
Analyze message metadata and determine the earliest inconsistent field.

### Input Specification
**Input Contract:** Input: header fields `From`, `Reply-To`, `Return-Path`; print 1 if all equal, else 0.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find forged header.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_11_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
ceo@corp.local
ceo@corp.local
ceo@corp.local
```

#### Sample Output 1
```text
1
```
