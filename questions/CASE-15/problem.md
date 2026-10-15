# CASE-15: The Biased Witness

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** precision, recall, F1, grouped statistics  

---

### Investigation Narrative
An AI witness-ranking system consistently favors one group of records.

### Investigator Objective
Measure class-wise performance and identify the biased metric.

### Input Specification
**Input Contract:** Input: n lines `actual predicted group`; print group with lowest F1.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Evaluate group metrics.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_15_<COMPUTED_RESULT>}`
