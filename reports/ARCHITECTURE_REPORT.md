# System Architecture & Technical Specifications

## 1. Executive Summary
The CyberAnzen Crime Investigation Platform is an open-source, self-hostable programming and digital forensics platform based on 80 connected crime cases.

## 2. Component Architecture
- **Web Application & API:** Python FastAPI with asynchronous request handling, JWT authentication, role-based access control (Admin & Participant).
- **Database Layer:** SQLAlchemy ORM with SQLite (embedded default) and PostgreSQL compatibility. Stores users, challenges, submissions, evidence tokens, audit logs, and git sync records.
- **Judge Execution Engine:** Isolated worker sandbox executing C (gcc), C++ (g++), and Python 3. Applies strict CPU timeout, memory limits, output caps, temporary chroot/scratch isolation, and non-root execution.
- **Frontend:** Modern, dark forensic HUD Single Page Application (React + Vite + Tailwind CSS + Monaco Editor). Features case dossiers, split IDE, sample test execution, real-time verdict streaming, interactive evidence token graph, and administrator control center.
- **Git Synchronization Service:** Version-controlled question importer with preview, validation, conflict detection, and rollback.
- **Evidence Token System:** Server-side verification of evidence tokens, master evidence chain graph, and Case 80 cryptographic SHA-256 final convergence.
