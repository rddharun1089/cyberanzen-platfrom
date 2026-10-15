# CASE-31: The Burnt Controller

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** finite-state machines, arrays  

---

### Investigation Narrative
A controller fails after receiving a sequence of sensor commands.

### Investigator Objective
Validate the command sequence and find the first unsafe transition.

### Input Specification
**Input Contract:** Input: n states (0/1); print first index where state changes twice consecutively.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect unsafe transition.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_31_<COMPUTED_RESULT>}`
