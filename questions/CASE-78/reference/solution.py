n, m = map(int, input().split())
deps = []
for _ in range(m):
    u, v = map(int, input().split())
    deps.append((u, v))
order = list(map(int, input().split()))
pos = {pkg: i for i, pkg in enumerate(order)}
if len(order) == n and all(pos[u] < pos[v] for u, v in deps):
    print("VALID")
else:
    print("INVALID")
