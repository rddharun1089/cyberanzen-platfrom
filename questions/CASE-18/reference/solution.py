import math
n,d=map(int,input().split())
best=(-1,-1)
for i in range(n):
    a=list(map(float,input().split())); b=list(map(float,input().split()))
    v=sum(abs(a[j]-b[j]) for j in range(d))
    if v>best[1]: best=(i,v)
print(best[0],best[1])
