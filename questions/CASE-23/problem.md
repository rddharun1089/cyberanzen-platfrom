# CASE-23: The Fraudulent Ledger

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** z-score, grouping, sorting  

---

### Investigation Narrative
A financial dataset contains a small cluster of manipulated transactions.

### Investigator Objective
Find statistical outliers and rank suspicious accounts.

### Input Specification
**Input Contract:** Input: n amounts; print indices with z-score > 2.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect transaction outliers.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_23_<COMPUTED_RESULT>}`
