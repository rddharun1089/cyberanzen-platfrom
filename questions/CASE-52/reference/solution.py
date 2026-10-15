n = int(input())
seen = set()
yes_cnt = 0
no_cnt = 0
for _ in range(n):
    voter, vote = input().split()
    if voter in seen:
        continue
    seen.add(voter)
    if vote == "YES":
        yes_cnt += 1
    elif vote == "NO":
        no_cnt += 1
print("YES" if yes_cnt > no_cnt else "NO")
