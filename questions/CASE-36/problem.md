# CASE-36: The Hidden Interrupt

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** queues, event counting  

---

### Investigation Narrative
An embedded device shows unexpected interrupt activity.

### Investigator Objective
Analyze event timestamps and identify the abnormal interrupt source.

### Input Specification
**Input Contract:** Input: n interrupt IDs; print most frequent ID and count.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find abnormal source.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_36_<COMPUTED_RESULT>}`
