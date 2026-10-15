from collections import defaultdict
import math
n=int(input()); d=defaultdict(lambda:[0,0,0])
for _ in range(n):
    a,p,g=input().split(); a=int(a);p=int(p); d[g][0]+=a; d[g][1]+=p; d[g][2]+=1
best=None; score=2
for g,(tp,pp,N) in d.items():
    fn=N-tp; fp=pp-tp
    f=0 if 2*tp+fp+fn==0 else 2*tp/(2*tp+fp+fn)
    if f<score: score=f;best=g
print(best,round(score,4))
