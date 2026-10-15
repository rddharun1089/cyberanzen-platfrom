# CASE-03: The Ransom Note

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** strings, hashing, pattern matching  

---

### Investigation Narrative
A manufacturing network is encrypted, but the ransom note contains a recoverable artifact from the attack chain.

### Investigator Objective
Parse indicators, group events and recover the attacker's sequence.

### Input Specification
**Input Contract:** Input: n log lines and a keyword. Count lines containing the keyword case-insensitively and print their indices.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Extract matching indicators.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_03_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
ransom
System normal
Ransom detected in root
Backup okay
```

#### Sample Output 1
```text
1
```
