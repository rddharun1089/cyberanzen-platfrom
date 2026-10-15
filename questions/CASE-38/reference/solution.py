from collections import defaultdict,deque
n,m=map(int,input().split()); g=[[] for _ in range(n)]; deg=[0]*n
for _ in range(m):
    a,b=map(int,input().split());g[a].append(b);deg[b]+=1
q=deque(i for i in range(n) if deg[i]==0); o=[]
while q:
    u=q.popleft();o.append(u)
    for v in g[u]:
        deg[v]-=1
        if deg[v]==0:q.append(v)
print(*o if len(o)==n else ["IMPOSSIBLE"])
