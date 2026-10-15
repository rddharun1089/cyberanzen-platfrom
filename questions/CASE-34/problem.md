# CASE-34: The PCB Switch

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** bit manipulation, state tracking  

---

### Investigation Narrative
A prototype board changes state without a recorded user command.

### Investigator Objective
Reconstruct GPIO transitions from a digital trace.

### Input Specification
**Input Contract:** Input: n binary GPIO values; print transition indices.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct GPIO events.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_34_<COMPUTED_RESULT>}`
