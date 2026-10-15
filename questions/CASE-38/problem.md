# CASE-38: The Failing Prototype

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, topological reasoning  

---

### Investigation Narrative
Multiple components fail in a specific order.

### Investigator Objective
Model dependencies and determine the earliest causal component.

### Input Specification
**Input Contract:** Input: n nodes,m dependency edges; print topological order or IMPOSSIBLE.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Resolve component dependency.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_38_<COMPUTED_RESULT>}`
