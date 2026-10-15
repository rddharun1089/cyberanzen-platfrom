n,k=map(int,input().split()); a=list(map(float,input().split()))
for i in range(k,n+1):
    w=a[i-k:i];m=sum(w)/k;s=(sum((x-m)**2 for x in w)/k)**.5
    if a[i-1]>m+3*s: print(i-1);break
else: print(-1)
