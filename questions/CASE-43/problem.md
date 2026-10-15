# CASE-43: The Factory Beacon

**Domain:** IoT  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** statistics, frequency counting  

---

### Investigation Narrative
One sensor node transmits periodic bursts unlike its peers.

### Investigator Objective
Detect the beacon interval and identify the node.

### Input Specification
**Input Contract:** Input: event timestamps; print mode of inter-arrival interval.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect periodic beacon.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_43_<COMPUTED_RESULT>}`
