# CASE-25: The Missing Sensor Day

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** interpolation, statistics  

---

### Investigation Narrative
A city monitoring dataset has a deliberate gap.

### Investigator Objective
Estimate the missing interval and detect whether surrounding measurements were altered.

### Input Specification
**Input Contract:** Input: n daily values with -1 missing; linear-interpolate missing values and print them.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover missing measurements.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_25_<COMPUTED_RESULT>}`
