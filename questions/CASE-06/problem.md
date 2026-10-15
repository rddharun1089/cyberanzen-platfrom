# CASE-06: The Deleted Evidence

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** linked structures, interval reasoning  

---

### Investigation Narrative
A suspect's workstation contains gaps in its event log.

### Investigator Objective
Infer missing events from neighboring timestamps and process dependencies.

### Input Specification
**Input Contract:** Input: n timestamps. Print every missing integer timestamp between minimum and maximum.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover gaps.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_06_<COMPUTED_RESULT>}`
