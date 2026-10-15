# CASE-18: The Adversarial Portrait

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** arrays, norms, classification  

---

### Investigation Narrative
A facial-recognition model changes its prediction for a subtly altered image.

### Investigator Objective
Compute perturbation statistics and detect the suspicious sample.

### Input Specification
**Input Contract:** Input: n pairs of equal-length vectors; print pair with maximum L1 distance.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Measure perturbation.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_18_<COMPUTED_RESULT>}`
