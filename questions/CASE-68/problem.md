# CASE-68: The Black Box Cipher

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** strings, stacks, state machines  

---

### Investigation Narrative
A flight-data recorder stores events in an encoded sequence.

### Investigator Objective
Decode the sequence and reconstruct the final system state.

### Input Specification
**Input Contract:** Input: encoded string; decode by reversing then Caesar-shifting letters -1.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct state token.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_68_<COMPUTED_RESULT>}`
