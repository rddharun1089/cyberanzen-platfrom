n=int(input()); a=list(map(int,input().split()))
for i in range(2,n):
    if a[i]==a[i-1]==a[i-2]: print(i);break
else: print(-1)
