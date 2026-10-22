import re
import json
import csv
import io
import os
import shutil
import tempfile
import zipfile
import subprocess
from typing import List, Dict, Any, Optional
import pypdf
import docx

class QuestionImporterService:
    """
    Enterprise Document & Git Extraction Engine for DSA Questions.
    Normalizes PDF, DOCX, Markdown, JSON, CSV, ZIP, and Git repositories
    into structured CyberAnzen DSA Questions with test-case staging and warnings.
    """

    @classmethod
    def normalize_question(cls, raw: Dict[str, Any], source_type: str, source_doc: str) -> Dict[str, Any]:
        """
        Validates extracted fields, detects missing elements, and formats warnings.
        """
        title = raw.get("title", "").strip() or f"Imported Problem from {source_doc}"
        statement = raw.get("statement", "").strip()
        input_spec = raw.get("input_spec", "").strip()
        output_spec = raw.get("output_spec", "").strip()
        constraints = raw.get("constraints", "").strip()
        difficulty = raw.get("difficulty", "Beginner").capitalize()
        if difficulty not in ("Beginner", "Intermediate", "Advanced", "Expert"):
            difficulty = "Beginner"

        category = raw.get("category", "Data Structures & Algorithms").strip()
        points = int(raw.get("points", 100))
        time_limit_ms = int(raw.get("time_limit_ms", 2000))
        memory_limit_mb = int(raw.get("memory_limit_mb", 256))

        starter_py = raw.get("starter_py", "").strip()
        starter_cpp = raw.get("starter_cpp", "").strip()
        starter_c = raw.get("starter_c", "").strip()
        reference_solution = raw.get("reference_solution", "").strip()

        public_test_cases = raw.get("public_test_cases", [])
        hidden_test_cases = raw.get("hidden_test_cases", [])

        # Missing field audit
        warnings = []
        if not statement:
            warnings.append("Missing problem statement.")
        if not input_spec:
            warnings.append("Missing input format specification.")
        if not output_spec:
            warnings.append("Missing output format specification.")
        if not reference_solution:
            warnings.append("Missing reference solution. Automated sandbox pre-flight judging cannot run until provided.")
        if not public_test_cases:
            warnings.append("No sample public test cases detected.")
        if not hidden_test_cases:
            warnings.append("No hidden judge test cases detected.")

        validation_status = "READY" if (statement and (public_test_cases or hidden_test_cases) and reference_solution) else "NEEDS_REVIEW"

        return {
            "title": title,
            "statement": statement,
            "input_spec": input_spec,
            "output_spec": output_spec,
            "constraints": constraints,
            "difficulty": difficulty,
            "category": category,
            "points": points,
            "time_limit_ms": time_limit_ms,
            "memory_limit_mb": memory_limit_mb,
            "supported_languages": ["python3", "cpp", "c"],
            "starter_py": starter_py,
            "starter_cpp": starter_cpp,
            "starter_c": starter_c,
            "reference_solution": reference_solution,
            "public_test_cases": public_test_cases,
            "hidden_test_cases": hidden_test_cases,
            "source_type": source_type,
            "source_document": source_doc,
            "warnings": warnings,
            "validation_status": validation_status,
            "is_approved": False
        }

    # ==========================================================================
    # 1. TEXT / REGEX PARSER (Shared by PDF, DOCX, Markdown)
    # ==========================================================================

    @classmethod
    def parse_free_text_questions(cls, text: str, source_type: str, source_doc: str) -> List[Dict[str, Any]]:
        """
        Parses multi-question documents using common technical problem headings
        (e.g., Problem 1:, Title, Input Format, Output Format, Constraints, Examples).
        """
        # Split on headers like "Problem 1", "Question 1", "## Problem", "CASE-"
        splits = re.split(r'(?m)(?=^(?:#{1,3}\s*(?:Problem|Question|Case|\d+\.)|\b(?:Problem|Question)\s*\d+[\s:\.\-]))', text)
        extracted = []

        for chunk in splits:
            chunk = chunk.strip()
            if len(chunk) < 40:
                continue

            # Title
            title_match = re.search(r'^(?:#{1,3}\s*)?(?:(?:Problem|Question)\s*\d*[\s:\.\-]*)?(.*?)(?:\n|$)', chunk)
            title = title_match.group(1).strip() if title_match else "Extracted Problem"
            if len(title) > 100 or not title:
                title = f"DSA Question from {source_doc}"

            # Problem Statement
            statement = ""
            statement_match = re.search(r'(?:Problem Statement|Statement|Description|Task):\s*([\s\S]*?)(?=(?:Input Format|Input Specification|Input|Constraints|Examples|Sample Input|$))', chunk, re.I)
            if statement_match:
                statement = statement_match.group(1).strip()
            else:
                # Use initial body
                statement = chunk[:min(len(chunk), 500)].strip()

            # Input Spec
            input_match = re.search(r'(?:Input Format|Input Specification|Input):\s*([\s\S]*?)(?=(?:Output Format|Output Specification|Output|Constraints|Examples|Sample Input|$))', chunk, re.I)
            input_spec = input_match.group(1).strip() if input_match else "Standard input format."

            # Output Spec
            output_match = re.search(r'(?:Output Format|Output Specification|Output):\s*([\s\S]*?)(?=(?:Constraints|Examples|Sample Input|$))', chunk, re.I)
            output_spec = output_match.group(1).strip() if output_match else "Standard output format."

            # Constraints
            constraints_match = re.search(r'(?:Constraints|Limits):\s*([\s\S]*?)(?=(?:Examples|Sample Input|Sample 1|$))', chunk, re.I)
            constraints = constraints_match.group(1).strip() if constraints_match else "1 <= N <= 10^5"

            # Public test cases from Sample Input / Output
            public_tests = []
            samples = re.findall(r'(?:Sample Input|Example Input)\s*\d*:\s*```?([^\n`]*[\s\S]*?)```?\s*(?:Sample Output|Example Output)\s*\d*:\s*```?([^\n`]*[\s\S]*?)```?', chunk, re.I)
            if not samples:
                # Alternate pattern without code fences
                samples = re.findall(r'(?:Sample Input|Example Input)\s*\d*:\s*\n([^\n]+(?:\n[^\n]+)*?)\n\s*(?:Sample Output|Example Output)\s*\d*:\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Sample Input|Explanation|Problem|$))', chunk, re.I)

            for s_in, s_out in samples:
                public_tests.append({
                    "input_data": s_in.strip(),
                    "expected_output": s_out.strip(),
                    "test_type": "public_sample"
                })

            # Reference solution code block
            ref_match = re.search(r'(?:Reference Solution|Solution|Python Solution):\s*```(?:python)?\s*([\s\S]*?)```', chunk, re.I)
            ref_code = ref_match.group(1).strip() if ref_match else ""

            # Difficulty
            diff_match = re.search(r'(?:Difficulty):\s*(Beginner|Intermediate|Advanced|Expert)', chunk, re.I)
            difficulty = diff_match.group(1).capitalize() if diff_match else "Beginner"

            # Points
            pts_match = re.search(r'(?:Points|Score):\s*(\d+)', chunk, re.I)
            points = int(pts_match.group(1)) if pts_match else 100

            q_obj = cls.normalize_question({
                "title": title,
                "statement": statement,
                "input_spec": input_spec,
                "output_spec": output_spec,
                "constraints": constraints,
                "difficulty": difficulty,
                "points": points,
                "reference_solution": ref_code,
                "public_test_cases": public_tests,
                "hidden_test_cases": []
            }, source_type, source_doc)

            extracted.append(q_obj)

        if not extracted and text.strip():
            # Fallback: Treat entire document as a single question
            extracted.append(cls.normalize_question({
                "title": f"Question from {source_doc}",
                "statement": text.strip()[:1000],
                "input_spec": "Standard input",
                "output_spec": "Standard output"
            }, source_type, source_doc))

        return extracted

    # ==========================================================================
    # 2. PDF PARSER
    # ==========================================================================

    @classmethod
    def extract_from_pdf(cls, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        full_text = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            full_text.append(page_text)
        joined_text = "\n\n".join(full_text)
        return cls.parse_free_text_questions(joined_text, "pdf", filename)

    # ==========================================================================
    # 3. DOCX PARSER
    # ==========================================================================

    @classmethod
    def extract_from_docx(cls, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for p in doc.paragraphs:
            if p.text:
                full_text.append(p.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells)
                full_text.append(row_text)
        joined_text = "\n\n".join(full_text)
        return cls.parse_free_text_questions(joined_text, "docx", filename)

    # ==========================================================================
    # 4. MARKDOWN PARSER
    # ==========================================================================

    @classmethod
    def extract_from_markdown(cls, text: str, filename: str) -> List[Dict[str, Any]]:
        return cls.parse_free_text_questions(text, "markdown", filename)

    # ==========================================================================
    # 5. JSON PARSER
    # ==========================================================================

    @classmethod
    def extract_from_json(cls, text: str, filename: str) -> List[Dict[str, Any]]:
        try:
            data = json.loads(text)
        except Exception as e:
            raise ValueError(f"Malformed JSON document: {str(e)}")

        if isinstance(data, dict):
            items = data.get("questions") or data.get("problems") or [data]
        elif isinstance(data, list):
            items = data
        else:
            raise ValueError("JSON must be an object or array of questions.")

        extracted = []
        for item in items:
            q_obj = cls.normalize_question(item, "json", filename)
            extracted.append(q_obj)
        return extracted

    # ==========================================================================
    # 6. CSV PARSER
    # ==========================================================================

    @classmethod
    def extract_from_csv(cls, text: str, filename: str) -> List[Dict[str, Any]]:
        reader = csv.DictReader(io.StringIO(text))
        extracted = []
        for row in reader:
            normalized_row = {k.strip().lower(): v for k, v in row.items() if k}
            # Map standard column names
            q_data = {
                "title": normalized_row.get("title") or normalized_row.get("name") or "CSV Problem",
                "statement": normalized_row.get("statement") or normalized_row.get("description") or "",
                "input_spec": normalized_row.get("input_spec") or normalized_row.get("input") or "",
                "output_spec": normalized_row.get("output_spec") or normalized_row.get("output") or "",
                "constraints": normalized_row.get("constraints") or "",
                "difficulty": normalized_row.get("difficulty") or "Beginner",
                "category": normalized_row.get("category") or "DSA",
                "points": int(normalized_row.get("points") or 100),
                "reference_solution": normalized_row.get("reference_solution") or normalized_row.get("solution") or ""
            }
            extracted.append(cls.normalize_question(q_data, "csv", filename))
        return extracted

    # ==========================================================================
    # 7. ZIP BUNDLE PARSER (With Zip-Slip & Path Traversal Safeguards)
    # ==========================================================================

    @classmethod
    def extract_from_zip(cls, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        extracted = []
        with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as zf:
            for member in zf.infolist():
                # Prevent directory traversal / zip-slip attacks
                if member.is_dir() or member.filename.startswith("/") or ".." in member.filename:
                    continue
                # Maximum single file limit 10MB
                if member.file_size > 10 * 1024 * 1024:
                    continue

                fn = os.path.basename(member.filename)
                ext = os.path.splitext(fn)[1].lower()
                content = zf.read(member)

                if ext in ('.json',):
                    try:
                        extracted.extend(cls.extract_from_json(content.decode("utf-8", errors="ignore"), fn))
                    except Exception:
                        pass
                elif ext in ('.md', '.markdown', '.txt'):
                    extracted.extend(cls.extract_from_markdown(content.decode("utf-8", errors="ignore"), fn))
                elif ext in ('.pdf',):
                    try:
                        extracted.extend(cls.extract_from_pdf(content, fn))
                    except Exception:
                        pass
                elif ext in ('.docx',):
                    try:
                        extracted.extend(cls.extract_from_docx(content, fn))
                    except Exception:
                        pass
                elif ext in ('.csv',):
                    try:
                        extracted.extend(cls.extract_from_csv(content.decode("utf-8", errors="ignore"), fn))
                    except Exception:
                        pass
        return extracted

    # ==========================================================================
    # 8. GIT REPOSITORY IMPORT (SSRF & Script Execution Hardened)
    # ==========================================================================

    @classmethod
    def extract_from_git(cls, repo_url: str, branch: Optional[str] = None, commit_sha: Optional[str] = None) -> List[Dict[str, Any]]:
        # Validate Git URL (Reject SSRF to internal localhost, metadata services, file://)
        clean_url = repo_url.strip()
        if re.search(r'^(?:file|gopher|dict)://', clean_url, re.I):
            raise ValueError("Insecure Git protocol rejected.")
        if re.search(r'localhost|127\.0\.0\.1|169\.254\.169\.254|0\.0\.0\.0|::1', clean_url, re.I):
            raise ValueError("Localhost or metadata server Git URL rejected.")

        temp_dir = tempfile.mkdtemp(prefix="cyberanzen_git_import_")
        try:
            # Clone with shallow depth
            cmd = ["git", "clone", "--depth", "1"]
            if branch:
                cmd.extend(["--branch", branch])
            cmd.extend([clean_url, temp_dir])

            # Run with timeout and no execution privileges
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            if proc.returncode != 0:
                raise ValueError(f"Git clone failed: {proc.stderr.decode('utf-8', errors='ignore')}")

            if commit_sha:
                # Checkout specific commit if specified
                subprocess.run(["git", "checkout", commit_sha], cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)

            # Walk directory looking for question documents
            extracted = []
            for root, _, files in os.walk(temp_dir):
                for f in files:
                    if f.startswith("."):
                        continue
                    filepath = os.path.join(root, f)
                    ext = os.path.splitext(f)[1].lower()
                    try:
                        if ext in ('.md', '.markdown', '.txt'):
                            with open(filepath, "r", encoding="utf-8", errors="ignore") as fh:
                                extracted.extend(cls.extract_from_markdown(fh.read(), f))
                        elif ext in ('.json',):
                            with open(filepath, "r", encoding="utf-8", errors="ignore") as fh:
                                extracted.extend(cls.extract_from_json(fh.read(), f))
                        elif ext in ('.csv',):
                            with open(filepath, "r", encoding="utf-8", errors="ignore") as fh:
                                extracted.extend(cls.extract_from_csv(fh.read(), f))
                    except Exception:
                        pass
            return extracted
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
