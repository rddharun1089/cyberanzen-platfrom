# CASE-60: The Navigation Loop

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hash sets, cycle detection  

---

### Investigation Narrative
An autonomous rover becomes trapped in a loop.

### Investigator Objective
Detect the repeated state and output the loop length.

### Input Specification
**Input Contract:** Input: n states; print first repeated state and loop length.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect cycle.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_60_<COMPUTED_RESULT>}`
