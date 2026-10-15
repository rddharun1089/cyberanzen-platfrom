# CASE-77: The Smart Factory Sabotage

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** FSM, statistics, classification  

---

### Investigation Narrative
An attacker changes an embedded controller, causing robotic equipment to reject good products.

### Investigator Objective
Reconstruct controller states and classify the anomalous production batch.

### Input Specification
**Input Contract:** Input: expected product labels and observed labels; print first mismatch index.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect production manipulation.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_77_<COMPUTED_RESULT>}`
