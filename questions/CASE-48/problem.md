# CASE-48: The Double-Spend Window

**Domain:** Blockchain  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sets, ordering  

---

### Investigation Narrative
Two conflicting transactions spend the same token.

### Investigator Objective
Identify the conflicting pair and determine which entered the chain first.

### Input Specification
**Input Contract:** Input: n transactions `token time txid`; print first token with two spends.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect double spend.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_48_<COMPUTED_RESULT>}`
