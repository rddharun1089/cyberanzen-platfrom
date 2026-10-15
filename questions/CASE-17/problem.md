# CASE-17: The Missing Model

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, vector comparison  

---

### Investigation Narrative
A research model file is replaced by another model with the same filename.

### Investigator Objective
Compare metadata, hashes and prediction fingerprints.

### Input Specification
**Input Contract:** Input: two files given as command-line paths; print SHA-256 hashes and whether equal.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Verify model replacement.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_17_<COMPUTED_RESULT>}`
