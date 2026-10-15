# CASE-07: The False Admin

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** multi-key joins, scoring  

---

### Investigation Narrative
An administrator denies a privileged operation recorded under their account.

### Investigator Objective
Separate account ownership from session attribution using device and timing evidence.

### Input Specification
**Input Contract:** Input: n records `account device hour action`; account is suspicious when action=WRITE from a device never paired with that account.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Print suspicious account/device pairs.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_07_<COMPUTED_RESULT>}`
