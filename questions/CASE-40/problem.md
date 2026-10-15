# CASE-40: The Water Plant Override

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** time windows, dictionaries  

---

### Investigation Narrative
An IoT valve opens outside the maintenance schedule.

### Investigator Objective
Detect the unauthorized command from device telemetry.

### Input Specification
**Input Contract:** Input: n commands `time valve`; allowed hours a,b; print commands outside window.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect override.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_40_<COMPUTED_RESULT>}`
