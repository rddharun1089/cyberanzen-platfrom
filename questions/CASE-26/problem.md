# CASE-26: The Corrupt Survey

**Domain:** Data Science  
**Difficulty:** Intermediate | **Points:** 75 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** sets, grouping, frequency analysis  

---

### Investigation Narrative
A research survey contains duplicated responses and fabricated entries.

### Investigator Objective
Deduplicate records and calculate the corrected distribution.

### Input Specification
**Input Contract:** Input: n response strings; print number of unique responses.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Deduplicate.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_26_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
4
YES
NO
YES
MAYBE
```

#### Sample Output 1
```text
3
```
