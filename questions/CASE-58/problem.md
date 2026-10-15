# CASE-58: The Swarm Collision

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** priority queues, intervals  

---

### Investigation Narrative
One drone in a robot swarm receives conflicting movement commands.

### Investigator Objective
Resolve command priority and identify the collision-causing command.

### Input Specification
**Input Contract:** Input: commands `time priority robot`; print selected command at each time by max priority.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Resolve command conflict.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_58_<COMPUTED_RESULT>}`
