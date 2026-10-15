# CASE-19: The Confidence Trap

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** calibration, statistics  

---

### Investigation Narrative
An AI system assigns high confidence to several wrong predictions.

### Investigator Objective
Evaluate confidence against actual outcomes and flag unreliable predictions.

### Input Specification
**Input Contract:** Input: n records `confidence correct(0/1)`; print accuracy among confidence>=0.9.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Check high-confidence reliability.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_19_<COMPUTED_RESULT>}`
