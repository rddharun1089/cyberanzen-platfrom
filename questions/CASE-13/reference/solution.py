n=int(input()); T=float(input())
for i in range(n):
    x=list(map(float,input().split()))
    if sum(x)>T: print(i,end=" ")
