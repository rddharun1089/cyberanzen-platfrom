# CASE-52: The DAO Vote

**Domain:** Blockchain  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sets, grouping  

---

### Investigation Narrative
A suspicious governance decision depends on duplicated voting identities.

### Investigator Objective
Detect duplicate voters and recalculate the result.

### Input Specification
**Input Contract:** Input: n voter IDs and votes; ignore duplicate voter IDs after first; print final YES/NO.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recalculate vote.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_52_<COMPUTED_RESULT>}`
