import os
import sys
import json
from datetime import datetime, timezone, timedelta

# Ensure backend is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.session import SessionLocal
from app.db.models import (
    Event, DSAQuestion, DSATestCase, EventDSAQuestion, User
)

def seed_demo_event():
    with SessionLocal() as db:
        print("[-] Checking if event 'demo 1' already exists...")
        existing_event = db.query(Event).filter(
            (Event.slug == "demo-1") | (Event.title.ilike("%demo 1%"))
        ).first()

        admin_user = db.query(User).filter(User.role.in_(["super_admin", "admin", "event_admin"])).first()
        admin_id = admin_user.id if admin_user else None

        now = datetime.now(timezone.utc)

        if existing_event:
            print(f"[!] Found existing event ID #{existing_event.id} ({existing_event.title}). Updating...")
            event = existing_event
            event.title = "demo 1"
            event.status = "active"
            event.visibility = "public"
            event.start_time = now - timedelta(hours=1)
            event.end_time = now + timedelta(days=7)
        else:
            print("[+] Creating new event 'demo 1'...")
            event = Event(
                slug="demo-1",
                title="demo 1",
                event_type="dsa",
                short_description="CyberAnzen Demo 1 — Competitive Algorithmic Challenge Arena",
                description="Welcome to Demo 1! This event challenges your problem solving skills across algorithmic data structures including arrays, hash tables, sliding windows, and strings. Solve all challenges to top the scoreboard.",
                category="Algorithms & DSA",
                difficulty="Intermediate",
                timezone="UTC",
                eligibility="Open to all verified operatives",
                visibility="public",
                status="active",
                participation_mode="individual",
                team_size_min=1,
                team_size_max=4,
                show_progress=True,
                leaderboard_visible=True,
                leaderboard_frozen=False,
                scores_visible_during_event=True,
                clipboard_policy="permissive",
                scoring_policy="standard",
                allowed_languages=json.dumps(["python3", "cpp", "c"]),
                start_time=now - timedelta(hours=1),
                end_time=now + timedelta(days=7),
                registration_open=True,
                registration_close=now + timedelta(days=7)
            )
            db.add(event)
            db.flush()

        event_id = event.id
        print(f"[+] Event 'demo 1' ready with ID: {event_id}")

        # Questions specifications
        questions_data = [
            {
                "slug": "demo-1-two-sum",
                "title": "Two Sum Target Detection",
                "category": "Arrays & Hashing",
                "difficulty": "Easy",
                "points": 100,
                "statement": (
                    "Given an array of integers `nums` and an integer `target`, return the two indices of the "
                    "numbers such that they add up to `target`.\n\n"
                    "You may assume that each input would have exactly one solution, and you may not use the same "
                    "element twice. You can return the answer in ascending order.\n\n"
                    "Input format:\n"
                    "Line 1: Integer N (number of elements)\n"
                    "Line 2: N space-separated integers\n"
                    "Line 3: Integer target\n\n"
                    "Output format:\n"
                    "Two space-separated indices: `index1 index2`"
                ),
                "input_spec": "Line 1: N (2 <= N <= 10^5)\nLine 2: N space-separated integers\nLine 3: target integer",
                "output_spec": "Print the two 0-based indices separated by a space (smaller index first).",
                "constraints": "2 <= N <= 100,000\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.",
                "starter_py": (
                    "import sys\n\n"
                    "def solve():\n"
                    "    input_data = sys.stdin.read().split()\n"
                    "    if not input_data:\n"
                    "        return\n"
                    "    n = int(input_data[0])\n"
                    "    nums = [int(x) for x in input_data[1:n+1]]\n"
                    "    target = int(input_data[n+1])\n"
                    "    \n"
                    "    # Write your solution here\n"
                    "    seen = {}\n"
                    "    for i, num in enumerate(nums):\n"
                    "        diff = target - num\n"
                    "        if diff in seen:\n"
                    "            print(f\"{seen[diff]} {i}\")\n"
                    "            return\n"
                    "        seen[num] = i\n\n"
                    "if __name__ == '__main__':\n"
                    "    solve()\n"
                ),
                "starter_cpp": (
                    "#include <iostream>\n"
                    "#include <vector>\n"
                    "#include <unordered_map>\n"
                    "using namespace std;\n\n"
                    "int main() {\n"
                    "    ios_base::sync_with_stdio(false);\n"
                    "    cin.tie(NULL);\n"
                    "    int n;\n"
                    "    if (!(cin >> n)) return 0;\n"
                    "    vector<long long> nums(n);\n"
                    "    for (int i = 0; i < n; i++) cin >> nums[i];\n"
                    "    long long target;\n"
                    "    cin >> target;\n"
                    "    \n"
                    "    unordered_map<long long, int> seen;\n"
                    "    for (int i = 0; i < n; i++) {\n"
                    "        long long diff = target - nums[i];\n"
                    "        if (seen.count(diff)) {\n"
                    "            cout << seen[diff] << \" \" << i << \"\\n\";\n"
                    "            return 0;\n"
                    "        }\n"
                    "        seen[nums[i]] = i;\n"
                    "    }\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "starter_c": (
                    "#include <stdio.h>\n"
                    "#include <stdlib.h>\n\n"
                    "int main() {\n"
                    "    int n;\n"
                    "    if (scanf(\"%d\", &n) != 1) return 0;\n"
                    "    long long *nums = (long long*)malloc(n * sizeof(long long));\n"
                    "    for (int i = 0; i < n; i++) scanf(\"%lld\", &nums[i]);\n"
                    "    long long target;\n"
                    "    scanf(\"%lld\", &target);\n\n"
                    "    for (int i = 0; i < n; i++) {\n"
                    "        for (int j = i + 1; j < n; j++) {\n"
                    "            if (nums[i] + nums[j] == target) {\n"
                    "                printf(\"%d %d\\n\", i, j);\n"
                    "                free(nums);\n"
                    "                return 0;\n"
                    "            }\n"
                    "        }\n"
                    "    }\n"
                    "    free(nums);\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "test_cases": [
                    {"type": "public_sample", "input": "4\n2 7 11 15\n9", "output": "0 1", "points": 25},
                    {"type": "public_sample", "input": "3\n3 2 4\n6", "output": "1 2", "points": 25},
                    {"type": "hidden_test", "input": "2\n3 3\n6", "output": "0 1", "points": 25},
                    {"type": "hidden_test", "input": "5\n10 20 30 40 50\n70", "output": "2 3", "points": 25}
                ]
            },
            {
                "slug": "demo-1-valid-anagram",
                "title": "Valid Cyber Anagram",
                "category": "Strings & Cryptography",
                "difficulty": "Easy",
                "points": 100,
                "statement": (
                    "Given two cryptographic strings `s` and `t`, return `true` if `t` is an anagram of `s`, "
                    "and `false` otherwise.\n\n"
                    "An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, "
                    "typically using all the original letters exactly once.\n\n"
                    "Input format:\n"
                    "Line 1: String `s`\n"
                    "Line 2: String `t`\n\n"
                    "Output format:\n"
                    "Print `true` or `false` (in lowercase)."
                ),
                "input_spec": "Line 1: String s\nLine 2: String t",
                "output_spec": "Print true if t is an anagram of s, else false.",
                "constraints": "1 <= length(s), length(t) <= 50,000\ns and t consist of lowercase English letters.",
                "starter_py": (
                    "import sys\n\n"
                    "def solve():\n"
                    "    lines = sys.stdin.read().split()\n"
                    "    if len(lines) < 2:\n"
                    "        return\n"
                    "    s = lines[0]\n"
                    "    t = lines[1]\n"
                    "    \n"
                    "    # Write your solution here\n"
                    "    if len(s) != len(t):\n"
                    "        print(\"false\")\n"
                    "        return\n"
                    "    print(\"true\" if sorted(s) == sorted(t) else \"false\")\n\n"
                    "if __name__ == '__main__':\n"
                    "    solve()\n"
                ),
                "starter_cpp": (
                    "#include <iostream>\n"
                    "#include <string>\n"
                    "#include <algorithm>\n"
                    "using namespace std;\n\n"
                    "int main() {\n"
                    "    string s, t;\n"
                    "    if (!(cin >> s >> t)) return 0;\n"
                    "    if (s.length() != t.length()) {\n"
                    "        cout << \"false\\n\";\n"
                    "        return 0;\n"
                    "    }\n"
                    "    sort(s.begin(), s.end());\n"
                    "    sort(t.begin(), t.end());\n"
                    "    cout << (s == t ? \"true\" : \"false\") << \"\\n\";\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "starter_c": (
                    "#include <stdio.h>\n"
                    "#include <string.h>\n\n"
                    "int main() {\n"
                    "    char s[60000], t[60000];\n"
                    "    if (scanf(\"%s %s\", s, t) != 2) return 0;\n"
                    "    int len_s = strlen(s);\n"
                    "    int len_t = strlen(t);\n"
                    "    if (len_s != len_t) {\n"
                    "        printf(\"false\\n\");\n"
                    "        return 0;\n"
                    "    }\n"
                    "    int count[26] = {0};\n"
                    "    for (int i = 0; i < len_s; i++) {\n"
                    "        count[s[i] - 'a']++;\n"
                    "        count[t[i] - 'a']--;\n"
                    "    }\n"
                    "    for (int i = 0; i < 26; i++) {\n"
                    "        if (count[i] != 0) {\n"
                    "            printf(\"false\\n\");\n"
                    "            return 0;\n"
                    "        }\n"
                    "    }\n"
                    "    printf(\"true\\n\");\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "test_cases": [
                    {"type": "public_sample", "input": "anagram\nnagaram", "output": "true", "points": 25},
                    {"type": "public_sample", "input": "rat\ncar", "output": "false", "points": 25},
                    {"type": "hidden_test", "input": "cyber\nbercy", "output": "true", "points": 25},
                    {"type": "hidden_test", "input": "anzen\nzenan", "output": "true", "points": 25}
                ]
            },
            {
                "slug": "demo-1-longest-unique-substring",
                "title": "Longest Unique Token Sequence",
                "category": "Sliding Window",
                "difficulty": "Medium",
                "points": 100,
                "statement": (
                    "Given a network packet token string `s`, find the length of the longest contiguous "
                    "substring containing all distinct characters without repeats.\n\n"
                    "Input format:\n"
                    "A single string `s`.\n\n"
                    "Output format:\n"
                    "An integer representing the length of the longest substring with unique characters."
                ),
                "input_spec": "Single line containing string s",
                "output_spec": "Single integer indicating maximum length",
                "constraints": "0 <= length(s) <= 50,000\ns consists of printable ASCII characters.",
                "starter_py": (
                    "import sys\n\n"
                    "def solve():\n"
                    "    s = sys.stdin.read().strip()\n"
                    "    if not s:\n"
                    "        print(0)\n"
                    "        return\n"
                    "    \n"
                    "    # Write your solution here\n"
                    "    char_map = {}\n"
                    "    left = 0\n"
                    "    max_len = 0\n"
                    "    for right, ch in enumerate(s):\n"
                    "        if ch in char_map and char_map[ch] >= left:\n"
                    "            left = char_map[ch] + 1\n"
                    "        char_map[ch] = right\n"
                    "        max_len = max(max_len, right - left + 1)\n"
                    "    print(max_len)\n\n"
                    "if __name__ == '__main__':\n"
                    "    solve()\n"
                ),
                "starter_cpp": (
                    "#include <iostream>\n"
                    "#include <string>\n"
                    "#include <vector>\n"
                    "#include <algorithm>\n"
                    "using namespace std;\n\n"
                    "int main() {\n"
                    "    string s;\n"
                    "    if (!(cin >> s)) {\n"
                    "        cout << 0 << \"\\n\";\n"
                    "        return 0;\n"
                    "    }\n"
                    "    vector<int> last(256, -1);\n"
                    "    int max_len = 0, left = 0;\n"
                    "    for (int right = 0; right < (int)s.length(); right++) {\n"
                    "        unsigned char c = (unsigned char)s[right];\n"
                    "        if (last[c] >= left) left = last[c] + 1;\n"
                    "        last[c] = right;\n"
                    "        max_len = max(max_len, right - left + 1);\n"
                    "    }\n"
                    "    cout << max_len << \"\\n\";\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "starter_c": (
                    "#include <stdio.h>\n"
                    "#include <string.h>\n\n"
                    "int main() {\n"
                    "    char s[60000];\n"
                    "    if (scanf(\"%s\", s) != 1) {\n"
                    "        printf(\"0\\n\");\n"
                    "        return 0;\n"
                    "    }\n"
                    "    int last[256];\n"
                    "    for (int i = 0; i < 256; i++) last[i] = -1;\n"
                    "    int max_len = 0, left = 0;\n"
                    "    int len = strlen(s);\n"
                    "    for (int right = 0; right < len; right++) {\n"
                    "        unsigned char c = (unsigned char)s[right];\n"
                    "        if (last[c] >= left) left = last[c] + 1;\n"
                    "        last[c] = right;\n"
                    "        int cur = right - left + 1;\n"
                    "        if (cur > max_len) max_len = cur;\n"
                    "    }\n"
                    "    printf(\"%d\\n\", max_len);\n"
                    "    return 0;\n"
                    "}\n"
                ),
                "test_cases": [
                    {"type": "public_sample", "input": "abcabcbb", "output": "3", "points": 25},
                    {"type": "public_sample", "input": "bbbbb", "output": "1", "points": 25},
                    {"type": "hidden_test", "input": "cyberanzen", "output": "7", "points": 25},
                    {"type": "hidden_test", "input": "pwwkew", "output": "3", "points": 25}
                ]
            }
        ]

        for order, q_data in enumerate(questions_data, start=1):
            q = db.query(DSAQuestion).filter(DSAQuestion.slug == q_data["slug"]).first()
            if not q:
                print(f"[+] Creating DSA Question: {q_data['title']}...")
                q = DSAQuestion(
                    slug=q_data["slug"],
                    title=q_data["title"],
                    category=q_data["category"],
                    difficulty=q_data["difficulty"],
                    points=q_data["points"],
                    statement=q_data["statement"],
                    input_spec=q_data["input_spec"],
                    output_spec=q_data["output_spec"],
                    constraints=q_data["constraints"],
                    time_limit_ms=2000,
                    memory_limit_mb=256,
                    supported_languages=json.dumps(["python3", "cpp", "c"]),
                    starter_py=q_data["starter_py"],
                    starter_cpp=q_data["starter_cpp"],
                    starter_c=q_data["starter_c"],
                    status="published",
                    judge_enabled=True,
                    reveal_failed_tests=True,
                    allow_copy_paste=False,
                    created_by_id=admin_id,
                    event_id=event_id
                )
                db.add(q)
                db.flush()

                # Add test cases
                for tc_idx, tc_data in enumerate(q_data["test_cases"], start=1):
                    tc = DSATestCase(
                        question_id=q.id,
                        test_type=tc_data["type"],
                        test_index=tc_idx,
                        input_data=tc_data["input"],
                        expected_output=tc_data["output"],
                        points=tc_data["points"]
                    )
                    db.add(tc)
                db.flush()
            else:
                print(f"[*] Question already exists ID #{q.id} ({q.title}). Linking...")
                q.status = "published"
                q.event_id = event_id

            # Ensure linked via EventDSAQuestion
            link = db.query(EventDSAQuestion).filter(
                EventDSAQuestion.event_id == event_id,
                EventDSAQuestion.question_id == q.id
            ).first()

            if not link:
                print(f"[+] Linking Question #{q.id} to Event #{event_id} at index {order}...")
                link = EventDSAQuestion(
                    event_id=event_id,
                    question_id=q.id,
                    order_index=order,
                    points_override=q.points
                )
                db.add(link)

        db.commit()
        print("==================================================")
        print(f"SUCCESS: Event 'demo 1' (ID: {event_id}) configured with 3 DSA questions!")
        print("1. Two Sum Target Detection (100 PTS - Easy)")
        print("2. Valid Cyber Anagram (100 PTS - Easy)")
        print("3. Longest Unique Token Sequence (100 PTS - Medium)")
        print("==================================================")

if __name__ == "__main__":
    seed_demo_event()
