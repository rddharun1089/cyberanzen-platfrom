# CASE-49: The Broken Smart Contract

**Domain:** Blockchain  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** simulation, constraints  

---

### Investigation Narrative
A contract distributes funds incorrectly for one input pattern.

### Investigator Objective
Find the input that violates the intended invariant.

### Input Specification
**Input Contract:** Input: n x values; invariant x*x <= 100; print violating indices.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Check contract invariant.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_49_<COMPUTED_RESULT>}`
