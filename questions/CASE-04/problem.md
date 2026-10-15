# CASE-04: The Silent Insider

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** statistics, frequency maps, threshold detection  

---

### Investigation Narrative
Sensitive files were copied without triggering the company's normal alert.

### Investigator Objective
Analyze file-access frequency and identify the anomalous account.

### Input Specification
**Input Contract:** Input: n `user file` accesses. Print user with highest distinct-file count.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find anomalous account by distinct access count.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_04_<COMPUTED_RESULT>}`
