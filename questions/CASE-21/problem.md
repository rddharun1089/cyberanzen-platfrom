# CASE-21: The Missing Features

**Domain:** AI / Machine Learning  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** data cleaning, weighted scoring  

---

### Investigation Narrative
An ML pipeline has missing feature values in a critical fraud case.

### Investigator Objective
Determine whether imputation changes the final classification.

### Input Specification
**Input Contract:** Input: n rows with `x1 x2 label`; replace missing x values with column mean and print changed prediction count using x1+x2>=threshold.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Test imputation effect.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_21_<COMPUTED_RESULT>}`
