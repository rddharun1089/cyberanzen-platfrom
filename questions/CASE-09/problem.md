# CASE-09: The Phantom DNS

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sliding window, statistics  

---

### Investigation Narrative
A lab repeatedly resolves a suspicious domain for only a few seconds at a time.

### Investigator Objective
Detect the beaconing pattern from DNS intervals.

### Input Specification
**Input Contract:** Input: n integer seconds. Find the longest run where consecutive intervals are <=10 seconds.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Detect beacon burst.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_09_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
6
1 5 12 18 35 40
```

#### Sample Output 1
```text
4
```
