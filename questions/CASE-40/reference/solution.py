n,a,b=map(int,input().split())
for _ in range(n):
    t,v=map(int,input().split())
    if not a<=t<=b: print(t,v)
