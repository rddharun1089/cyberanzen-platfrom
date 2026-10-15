import math
n=int(input()); ans=0
for _ in range(n):
    a,b=map(float,input().split()); c,d=map(float,input().split())
    ans=max(ans,math.hypot(a-c,b-d))
print(ans)
