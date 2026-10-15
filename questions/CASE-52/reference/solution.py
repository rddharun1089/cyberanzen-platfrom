n,m=map(int,input().split()); g=[[] for _ in range(n)]
for _ in range(m):
    a,b=map(int,input().split());g[a].append(b)
best=[]
def dfs(u,p):
    global best
    p.append(u)
    if len(p)>len(best):best=p[:]
    for v in g[u]:
        if v not in p: dfs(v,p)
    p.pop()
dfs(0,[])
print(*best)
