# CASE-08: The USB Exchange

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, maps, traversal  

---

### Investigation Narrative
A restricted USB device appears on several machines in an unexplained order.

### Investigator Objective
Build the device movement chain and locate the first unauthorized connection.

### Input Specification
**Input Contract:** Input: n edges `device machine`; print the machine path using DFS from the first machine.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Trace device movement.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_08_<COMPUTED_RESULT>}`
