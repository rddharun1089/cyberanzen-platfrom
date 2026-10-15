# CASE-32: The Oscillator Crime

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** arrays, frequency analysis  

---

### Investigation Narrative
An oscillator's readings contain a periodic disturbance not present in normal operation.

### Investigator Objective
Detect the abnormal frequency component from sampled values.

### Input Specification
**Input Contract:** Input: numeric samples; print dominant non-zero discrete frequency index.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find periodic disturbance.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_32_<COMPUTED_RESULT>}`
