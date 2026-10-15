# CASE-75: The Blockchain Black Box

**Domain:** Cross-Domain Grand Crimes  
**Difficulty:** Advanced | **Points:** 100 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** hashing, joins, vector comparison  

---

### Investigation Narrative
A laboratory uses blockchain to store AI model versions, but one version was secretly replaced.

### Investigator Objective
Validate hashes, model fingerprints and deployment timestamps.

### Input Specification
**Input Contract:** Input: model version strings and hashes; print first version whose SHA-256 differs from supplied hash.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Verify model ledger.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_75_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
2
v1.0.0 2485f4d55aae6c5b073114bc4c4b1907c0abae14166281beee7d93f76ebf41fc
v2.0.0 BADHASH
```

#### Sample Output 1
```text
v2.0.0
```
