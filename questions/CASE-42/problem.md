# CASE-42: The Ghost Device

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hash maps, classification rules  

---

### Investigation Narrative
A device appears on the IoT network without registration.

### Investigator Objective
Identify the unknown device from MAC, timing and traffic features.

### Input Specification
**Input Contract:** Input: registered MACs then observed MACs; print unknown MACs.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find unregistered device.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_42_<COMPUTED_RESULT>}`
