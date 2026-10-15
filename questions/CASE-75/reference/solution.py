import heapq
n,m=map(int,input().split());g=[[] for _ in range(n)]
for _ in range(m):
    u,v,w=map(int,input().split());g[u].append((v,w))
d=[10**18]*n;d[0]=0;q=[(0,0)]
while q:
    w,u=heapq.heappop(q)
    if w!=d[u]:continue
    for v,c in g[u]:
        if w+c<d[v]:d[v]=w+c;heapq.heappush(q,(d[v],v))
print(*d)
