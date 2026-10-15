# CASE-47: The Ghost Transfer

**Domain:** Blockchain  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hash chains, maps  

---

### Investigation Narrative
A wallet records a transfer nobody authorized.

### Investigator Objective
Trace the transaction through blocks and validate its hashes.

### Input Specification
**Input Contract:** Input: n transaction lines `from to amount hash prevhash`; verify each prevhash equals prior hash; print first broken index.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Validate chain.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_47_<COMPUTED_RESULT>}`
