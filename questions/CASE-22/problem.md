# CASE-22: The Model Audit

**Domain:** AI / Machine Learning  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** joins, sorting, dictionaries  

---

### Investigation Narrative
An AI audit trail has predictions but missing model-version identifiers.

### Investigator Objective
Correlate prediction timestamps with deployment records and reconstruct the responsible model.

### Input Specification
**Input Contract:** Input: predictions `time model`; deployments `start end model`; print model covering each prediction time.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct model version.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_22_<COMPUTED_RESULT>}`
