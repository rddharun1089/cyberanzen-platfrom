# CASE-80: THE FINAL CONVERGENCE

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Expert | **Points:** 200 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** graphs, hashing, anomaly detection, scoring, DSA  

---

### Investigation Narrative
A multinational research facility suffers a coordinated crime involving AI, IoT, robotics, blockchain, aerospace telemetry and nanotechnology.

### Investigator Objective
Build a unified evidence graph, rank anomalies, validate integrity and reconstruct the complete technical attack chain. No culprit is hard-coded; the evidence must determine the conclusion.

### Input Specification
**Input Contract:** Input: 79 evidence tokens as `case value`, plus graph edges connecting cases; print a deterministic SHA-256 of the canonical sorted evidence chain.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Build final evidence chain.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_80_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3
1 admin
2 NYC
3 ransom
```

#### Sample Output 1
```text
FLAG{989bd877f10ac81f}
```
