n=int(input()); a=list(map(int,input().split()))
print(*[i for i in range(1,n) if a[i]!=a[i-1]])
