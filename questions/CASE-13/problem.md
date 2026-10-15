# CASE-13: The Forged Diagnosis

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** feature normalization, anomaly detection  

---

### Investigation Narrative
A clinical AI produces an unusual diagnosis after receiving manipulated inputs.

### Investigator Objective
Detect the anomalous feature pattern and classify the suspicious request.

### Input Specification
**Input Contract:** Input: n feature rows, threshold T; print indices whose feature sum > T.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect anomalous model input.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_13_<COMPUTED_RESULT>}`
