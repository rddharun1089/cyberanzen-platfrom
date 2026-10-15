# CASE-57: The Assembly Sabotage

**Domain:** Robotics  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** FSM, state validation  

---

### Investigation Narrative
A robot skips one assembly step while all sensors remain active.

### Investigator Objective
Validate the state sequence against the expected finite-state machine.

### Input Specification
**Input Contract:** Input: expected states then observed states; print first mismatch.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Validate robot FSM.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_57_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
IDLE MOVE WELD
IDLE MOVE SHUTDOWN
```

#### Sample Output 1
```text
2
```
