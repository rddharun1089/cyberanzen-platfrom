# CASE-64: The Rocket Valve

**Domain:** Aerospace  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** FSM, arrays  

---

### Investigation Narrative
A launch vehicle valve changes state outside the launch sequence.

### Investigator Objective
Validate the state machine and locate the illegal transition.

### Input Specification
**Input Contract:** Input: n states and allowed transitions; print first illegal transition.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Validate launch FSM.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_64_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
2
IDLE FUEL
FUEL IGNITE
3
IDLE
FUEL
VENT
```

#### Sample Output 1
```text
2 FUEL->VENT
```
