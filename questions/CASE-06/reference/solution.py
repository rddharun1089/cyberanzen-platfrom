n=int(input()); a=sorted(map(int,input().split()))
for x in range(a[0],a[-1]+1):
    if x not in set(a): print(x,end=" ")
