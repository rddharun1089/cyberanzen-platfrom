# CASE-37: The UART Secret

**Domain:** ECE / Embedded Systems  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** parsing, finite-state machines  

---

### Investigation Narrative
A serial capture contains interleaved diagnostic and command bytes.

### Investigator Objective
Separate channels and recover the command sequence.

### Input Specification
**Input Contract:** Input: hex bytes; extract bytes between 0xAA and 0x55.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Recover command frame.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_37_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
00 AA 43 4D 44 55 FF
```

#### Sample Output 1
```text
43 4D 44
```
