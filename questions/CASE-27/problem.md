# CASE-27: The Stockroom Pattern

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sliding windows, mean/variance  

---

### Investigation Narrative
Inventory theft occurs in irregular bursts.

### Investigator Objective
Use rolling statistics to find the theft window.

### Input Specification
**Input Contract:** Input: n daily theft counts and window k; print window with maximum sum.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find theft burst.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_27_<COMPUTED_RESULT>}`
