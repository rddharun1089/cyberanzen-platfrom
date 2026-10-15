import math
n=float(input()); pts=[tuple(map(float,input().split())) for _ in range(int(n))]
t=float(input()); c=(sum(x for x,y in pts)/len(pts),sum(y for x,y in pts)/len(pts))
print(*[i for i,p in enumerate(pts) if math.dist(p,c)>t])
