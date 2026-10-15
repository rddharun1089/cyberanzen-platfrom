# CASE-50: The Lost Private Key

**Domain:** Blockchain  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, search  

---

### Investigation Narrative
A forensic dump contains partial key-related artifacts.

### Investigator Objective
Search candidate fragments and validate derived transaction signatures.

### Input Specification
**Input Contract:** Input: candidate strings and target SHA-256 hash; print matching candidate.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover key candidate.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_50_<COMPUTED_RESULT>}`
