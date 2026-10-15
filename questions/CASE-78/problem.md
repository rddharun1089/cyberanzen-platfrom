# CASE-78: The Satellite Supply Chain

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, graphs, topological sorting  

---

### Investigation Narrative
A compromised software package reaches an aerospace telemetry system.

### Investigator Objective
Compare package hashes, dependency graphs and deployment records.

### Input Specification
**Input Contract:** Input: package dependencies and installed order; print whether order is a valid topological order.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Validate software supply chain.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_78_<COMPUTED_RESULT>}`
