n = int(input())
allowed = set()
for _ in range(n):
    u, v = input().split()
    allowed.add((u, v))
m = int(input())
states = [input().strip() for _ in range(m)]
for i in range(1, m):
    trans = (states[i-1], states[i])
    if trans not in allowed:
        print(f"{i} {states[i-1]}->{states[i]}")
        break
else:
    print("VALID")
