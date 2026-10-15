# CASE-70: The Nano Sensor

**Domain:** Nanotechnology  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** moving averages, variance  

---

### Investigation Narrative
A nanosensor reports a sudden signal spike.

### Investigator Objective
Determine whether the spike is a true event or measurement noise.

### Input Specification
**Input Contract:** Input: signal and window k; print first point exceeding moving mean + 3*std.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect spike.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_70_<COMPUTED_RESULT>}`
