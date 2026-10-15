# CASE-10: The Broken Backup

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, sets, diff analysis  

---

### Investigation Narrative
Backups exist, but one version contains silently modified records.

### Investigator Objective
Compare versions and locate the smallest set of altered entries.

### Input Specification
**Input Contract:** Input: two equal-length strings. Print 1 if they differ, else 0.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect modified backup.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_10_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
abcde
abcde
```

#### Sample Output 1
```text
0
```
