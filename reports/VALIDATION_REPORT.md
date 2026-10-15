# Challenge Validation & Discrepancy Report

## Critical Findings & Defect Analysis

### 1. Total Points Arithmetic Contradiction
- **Document Narrative Claim:** The introductory text in `80_Independent_Crime_CTF_Stories_Connected_Storyline.docx` mentions a total of 5,900 points.
- **Actual Mathematical Sum:**
  - Cases 01–20: 20 cases × 50 pts = 1,000 pts
  - Cases 21–50: 30 cases × 75 pts = 2,250 pts
  - Cases 51–79: 29 cases × 100 pts = 2,900 pts
  - Case 80: 1 case × 200 pts = 200 pts
  - **True Sum:** 1,000 + 2,250 + 2,900 + 200 = **6,350 points**.
- **Resolution:** Platform preserves the explicit per-case points from the document (summing to 6,350), with configurable administrator overrides.

### 2. Language Header Label Inconsistencies
- In `80_CTF_Complete_Coding_Answer_Key.docx`, case headers declare `Language: C++` (24 cases), `Language: C` (1 case), and `Language: Python` (55 cases).
- **Reality:** All 80 runnable reference implementations provided in the document are written strictly in **Python 3**.
- **Resolution:** The platform natively provides starter templates for C, C++, and Python 3, compiles C and C++ via GCC/G++, runs Python via Python 3, and documents the original source implementation as Python 3.

### 3. Answer Key Code Offset / Misalignment in Certain Ranges
- **Discrepancy:** In `80_CTF_Complete_Coding_Answer_Key.docx`, reference solutions in ranges Cases 22–25 and Cases 49–56 exhibit an index shift.
  - E.g., under Case 22 ('The Model Audit'), the code placed is the z-score outlier detector from Case 23.
  - Under Case 49 ('The Broken Smart Contract' invariant x*x<=100), the code placed is the SHA-256 target search from Case 50 ('The Lost Private Key').
- **Resolution:** Original solutions are preserved verbatim under `reference/solution.py` as source artifacts, and tagged with `NEEDS_SOLUTION_REVIEW`. Corrected solutions matching the story objective are provided under `reference/corrected_solution.py` without silently overwriting the original.

### 4. Non-Standard I/O in Case 17
- **Discrepancy:** Case 17 ('The Missing Model') reference code uses `sys.argv[1]` and `sys.argv[2]` with `open()` rather than standard competitive programming STDIN.
- **Resolution:** Marked as `NEEDS_SPECIFICATION` with a proposal to read hex strings or filenames from STDIN.

### 5. Detailed Case Issues Log

#### CASE-01: The Dead Server
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-05: Packet 404
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-06: The Deleted Evidence
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-08: The USB Exchange
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-12: The Hidden Archive
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-17: The Missing Model
- Reference implementation uses CLI argument / local file reading (sys.argv) rather than standard STDIN.

#### CASE-22: The Model Audit
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-23: The Fraudulent Ledger
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-24: The Vanishing Shipment
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-25: The Missing Sensor Day
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-31: The Burnt Controller
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-33: The Fake Sensor
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-34: The PCB Switch
- Language label in answer key is 'C', but reference implementation is written in Python.

#### CASE-35: The Voltage Drop
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-36: The Hidden Interrupt
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-37: The UART Secret
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-38: The Failing Prototype
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-44: The Smart Lock Replay
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-45: The Drone Gateway
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-48: The Double-Spend Window
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-49: The Broken Smart Contract
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-50: The Lost Private Key
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-51: The Fake Block
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-52: The DAO Vote
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-53: The Token Laundering Trail
- Language label in answer key is 'C++', but reference implementation is written in Python.
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-54: The Merkle Witness
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-55: Robot 17
- Language label in answer key is 'C++', but reference implementation is written in Python.
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-56: The Surgical Arm
- Answer Key reference solution exhibits offset/misalignment with the challenge's stated input contract.

#### CASE-57: The Assembly Sabotage
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-58: The Swarm Collision
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-60: The Navigation Loop
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-63: The Flight Recorder Gap
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-64: The Rocket Valve
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-68: The Black Box Cipher
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-73: The Missing Sample
- Language label in answer key is 'C++', but reference implementation is written in Python.

#### CASE-77: The Smart Factory Sabotage
- Language label in answer key is 'C++', but reference implementation is written in Python.

