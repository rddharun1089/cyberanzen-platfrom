# CASE-76: The Drone Data Theft

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** time series, sliding windows, graph analysis  

---

### Investigation Narrative
A drone captures restricted imagery and uploads it through a compromised gateway.

### Investigator Objective
Identify the unauthorized flight window and data-transfer burst.

### Input Specification
**Input Contract:** Input: timestamps and byte counts; find maximum 60-second transfer sum.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect exfiltration burst.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_76_<COMPUTED_RESULT>}`
