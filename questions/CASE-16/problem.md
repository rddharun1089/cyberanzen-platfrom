# CASE-16: The Deepfake Alibi

**Domain:** AI / Machine Learning  
**Difficulty:** Beginner | **Points:** 50 pts  
**Supported Languages:** C, C++, Python 3  
**Skills:** distance metrics, clustering  

---

### Investigation Narrative
A video-analysis system accepts a forged identity clip.

### Investigator Objective
Compare extracted feature signatures and identify the outlier sequence.

### Input Specification
**Input Contract:** Input: n vectors of d floats; print vector farthest from centroid.

Structured evidence supplied by the challenge: logs, measurements, transactions, telemetry, records, or encoded data.

### Output Specification
**Required Result:** Find feature outlier.

Print the required reconstructed event, identifier, score, path, anomaly, or verdict exactly as specified by the challenge author.

### Constraints
Use deterministic processing. Preserve input order where timestamps tie. Do not assume an offender from an account name alone.

### Evidence Token / Flag
`FLAG{CASE_16_<COMPUTED_RESULT>}`

### Sample Investigation Case

#### Sample Input 1
```text
3 2
0.0 0.0
1.0 1.0
10.0 10.0
```

#### Sample Output 1
```text
2
```
