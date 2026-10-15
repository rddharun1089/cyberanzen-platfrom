import heapq
R,C=map(int,input().split()); a=[list(map(int,input().split())) for _ in range(R)]
S=tuple(map(int,input().split())); T=tuple(map(int,input().split()))
d={S:0};q=[(0,S)]
while q:
    w,u=heapq.heappop(q)
    if w!=d[u]:continue
    if u==T: print(w);break
    for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)):
        v=(u[0]+dr,u[1]+dc)
        if 0<=v[0]<R and 0<=v[1]<C:
            nw=w+a[v[0]][v[1]]
            if nw<d.get(v,10**18):d[v]=nw;heapq.heappush(q,(nw,v))
