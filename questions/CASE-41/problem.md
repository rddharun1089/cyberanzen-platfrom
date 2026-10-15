# CASE-41: The Cold-Chain Theft

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sliding window, robust statistics  

---

### Investigation Narrative
A refrigerated shipment exceeds its safe temperature range during transit.

### Investigator Objective
Find the first sustained violation and distinguish sensor noise from a real event.

### Input Specification
**Input Contract:** Input: temperatures, threshold, k; print first k-length all-over-threshold window.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect sustained breach.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_41_<COMPUTED_RESULT>}`
