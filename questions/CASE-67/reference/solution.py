from collections import defaultdict,deque
n,m=map(int,input().split()); g=[[] for _ in range(n)]; deg=[0]*n
for _ in range(m):
    a,b=map(int,input().split());g[a].append(b);deg[b]+=1
order=list(map(int,input().split())); pos={v:i for i,v in enumerate(order)}
print("VALID" if len(order)==n and all(pos[u]<pos[v] for u in range(n) for v in g[u]) else "INVALID")
