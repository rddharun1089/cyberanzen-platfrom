n,t=map(int,input().split()); a=list(map(float,input().split()))
for i,x in enumerate(a):
    if x<t: print(i);break
else: print(-1)
