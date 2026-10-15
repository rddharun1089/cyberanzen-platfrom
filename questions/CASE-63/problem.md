# CASE-63: The Flight Recorder Gap

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sorting, interpolation  

---

### Investigation Narrative
An aircraft recorder is missing a short interval.

### Investigator Objective
Infer the missing event order from surrounding telemetry.

### Input Specification
**Input Contract:** Input: sorted event IDs; print missing IDs.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover recorder gap.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_63_<COMPUTED_RESULT>}`
