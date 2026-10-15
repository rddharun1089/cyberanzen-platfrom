# CASE-05: Packet 404

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** arrays, sorting, networking  

---

### Investigation Narrative
A forensic capture contains fragmented packets from a covert transfer.

### Investigator Objective
Reassemble the logical message and locate the hidden evidence.

### Input Specification
**Input Contract:** Input: n fragments `seq payload`. Reassemble by seq and print concatenated payload.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct packet payload.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_05_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
2 WORLD
1 HELLO_
3 !
```

#### Sample Output 1
```text
HELLO_WORLD!
```
