# CASE-12: The Hidden Archive

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sorting, binary search, hashing  

---

### Investigation Narrative
An encrypted archive is accompanied by a manifest and access timestamps.

### Investigator Objective
Index the evidence and determine which archive entry was accessed outside policy.

### Input Specification
**Input Contract:** Input: n records `file time`; print lexicographically smallest file accessed after time T.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Index archive access.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_12_<COMPUTED_RESULT>}`
