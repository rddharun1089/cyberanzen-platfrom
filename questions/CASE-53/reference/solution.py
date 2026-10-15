n, m = map(int, input().split())
g = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    g[u].append(v)
best = []
def dfs(u, path):
    global best
    path.append(u)
    if len(path) > len(best):
        best = path[:]
    for v in g[u]:
        if v not in path:
            dfs(v, path)
    path.pop()
dfs(0, [])
print(" ".join(map(str, best)))
