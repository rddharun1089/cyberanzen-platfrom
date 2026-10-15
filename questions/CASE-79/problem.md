# CASE-79: The Nano Lab Ransomware

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, diff analysis, time ordering  

---

### Investigation Narrative
A ransomware attack locks a nanofabrication system while altering sensor calibration files.

### Investigator Objective
Identify the modified calibration records and restore the valid sequence.

### Input Specification
**Input Contract:** Input: original and current calibration dictionaries; print changed keys.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover modified calibration.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_79_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
LASER_FREQ 500
BEAM_PWR 20
CHAMBER_P 101
3
LASER_FREQ 999
BEAM_PWR 20
CHAMBER_P 101
```

#### Sample Output 1
```text
LASER_FREQ
```
