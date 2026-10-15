# CASE-54: The Merkle Witness

**Domain:** Blockchain  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** binary trees, hashing  

---

### Investigation Narrative
A record must be verified against a Merkle root.

### Investigator Objective
Construct and validate the proof path.

### Input Specification
**Input Contract:** Input: leaf, sibling hashes and L/R markers; compute root.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Verify Merkle proof.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_54_<COMPUTED_RESULT>}`
