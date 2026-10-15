import pytest
import os
import json
import zipfile
import xml.etree.ElementTree as ET
import re

def test_source_documents_exist():
    assert os.path.exists("80_Independent_Crime_CTF_Stories_Connected_Storyline.docx")
    assert os.path.exists("80_CTF_Complete_Coding_Answer_Key.docx")

def test_source_inventory_json_valid():
    assert os.path.exists("source_inventory.json")
    with open("source_inventory.json", "r") as f:
        inv = json.load(f)
    assert len(inv) == 80
    
    # Verify numbering 1 to 80
    case_numbers = [c["case_number"] for c in inv]
    assert case_numbers == list(range(1, 81))

    # Verify points calculation
    c1_20 = [c["points"] for c in inv[:20]]
    assert set(c1_20) == {50}
    c21_50 = [c["points"] for c in inv[20:50]]
    assert set(c21_50) == {75}
    c51_79 = [c["points"] for c in inv[50:79]]
    assert set(c51_79) == {100}
    assert inv[79]["points"] == 200

    total_points = sum(c["points"] for c in inv)
    assert total_points == 6350

    # Verify 10 domains
    domains = set(c["technical_domain"] for c in inv)
    assert len(domains) == 10
    expected_domains = {
        "Cybersecurity & Digital Forensics",
        "AI / Machine Learning",
        "Data Science",
        "ECE / Embedded Systems",
        "IoT",
        "Blockchain",
        "Robotics",
        "Aerospace",
        "Nanotechnology",
        "Cross-Domain Grand Crimes"
    }
    assert domains == expected_domains
