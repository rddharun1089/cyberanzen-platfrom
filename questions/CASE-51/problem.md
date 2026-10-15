# CASE-51: The Fake Block

**Domain:** Blockchain  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, arrays  

---

### Investigation Narrative
One block in a local ledger has been modified.

### Investigator Objective
Locate the first broken hash link.

### Input Specification
**Input Contract:** Input: n blocks each `data hash prev`; recompute SHA-256(data+prev) and print first mismatch.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find tampered block.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_51_<COMPUTED_RESULT>}`
