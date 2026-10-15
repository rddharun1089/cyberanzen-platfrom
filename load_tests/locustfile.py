from locust import HttpUser, task, between
import random

class CompetitiveParticipant(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Register and login unique user
        self.user_idx = random.randint(1000, 99999)
        self.username = f"locust_agent_{self.user_idx}"
        self.password = "Locust#Pass2026!"
        self.client.post("/api/v1/auth/register", json={
            "username": self.username,
            "password": self.password,
            "email": f"{self.username}@enigmatrix.org"
        })
        login_res = self.client.post("/api/v1/auth/login", json={
            "username": self.username,
            "password": self.password
        })
        if login_res.status_code == 200:
            token = login_res.json().get("access_token")
            self.client.headers.update({"Authorization": f"Bearer {token}"})

    @task(4)
    def browse_cases(self):
        self.client.get("/api/v1/cases")

    @task(3)
    def view_case_detail(self):
        case_id = f"CASE-0{random.randint(1, 9)}"
        self.client.get(f"/api/v1/cases/{case_id}")

    @task(2)
    def check_stats(self):
        self.client.get("/api/v1/stats")

    @task(2)
    def poll_team_leaderboard(self):
        self.client.get("/api/v1/teams/leaderboard")

    @task(1)
    def submit_code(self):
        code_py = 'import sys\nline = sys.stdin.read().split()\nif len(line) >= 2:\n    print(int(line[0]) + int(line[1]))\n'
        self.client.post("/api/v1/submissions", json={
            "case_id": "CASE-01",
            "language": "python",
            "code": code_py
        })
