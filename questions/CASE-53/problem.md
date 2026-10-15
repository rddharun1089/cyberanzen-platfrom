# CASE-53: The Token Laundering Trail

**Domain:** Blockchain  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, DFS  

---

### Investigation Narrative
Funds move through many short-lived wallets.

### Investigator Objective
Build the transaction graph and find the longest suspicious route.

### Input Specification
**Input Contract:** Input: directed graph; print longest simple path from node 0 using DFS.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Trace route.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_53_<COMPUTED_RESULT>}`
