from collections import deque
n, m = map(int, input().split())
g = [[] for _ in range(n)]
deg = [0] * n
for _ in range(m):
    u, v = map(int, input().split())
    g[u].append(v)
    deg[v] += 1
q = deque(i for i in range(n) if deg[i] == 0)
res = []
while q:
    u = q.popleft()
    res.append(str(u))
    for v in g[u]:
        deg[v] -= 1
        if deg[v] == 0:
            q.append(v)
if len(res) == n:
    print(" ".join(res))
else:
    print("IMPOSSIBLE")
