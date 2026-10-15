n=int(input()); exp=input().split(); obs=input().split()
for i,(a,b) in enumerate(zip(exp,obs)):
    if a!=b: print(i);break
else: print(-1)
