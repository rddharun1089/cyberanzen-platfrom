n=int(input()); lo=list(map(float,input().split())); hi=list(map(float,input().split()))
for i in range(n):
    x=list(map(float,input().split()))
    if any(x[j]<lo[j] or x[j]>hi[j] for j in range(3)): print(i);break
else: print(-1)
