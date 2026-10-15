# CASE-14: The Poisoned Dataset

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** confusion matrix, statistics  

---

### Investigation Narrative
A vision model suddenly misclassifies one product category after retraining.

### Investigator Objective
Find suspicious labels and estimate their effect on validation accuracy.

### Input Specification
**Input Contract:** Input: n labels 0/1; print minority-label count and percentage.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Measure label imbalance.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_14_<COMPUTED_RESULT>}`
