# CASE-01: The Dead Server

**Domain:** Cybersecurity & Digital Forensics  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hash maps, sorting, timestamps, log forensics  

---

### Investigation Narrative
A university server dies eleven minutes before a confidential dataset is stolen. Unordered login, process and network records are recovered.

### Investigator Objective
Reconstruct the attack order and identify the first unauthorized session.

### Input Specification
**Input Contract:** Input: n followed by n records `time user process bytes`, sorted output by time; flag uses first record whose user is ADMIN? No. Detect first duplicate user+time?

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Reconstruct chronological order and print the first event after sorting by timestamp.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_01_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4
100 admin login 500
90 user1 process 120
100 admin netscan 800
110 guest logout 50
```

#### Sample Output 1
```text
FLAG admin
```
