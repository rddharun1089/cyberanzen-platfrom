n,k=map(int,input().split()); a=list(map(int,input().split()))
s=sum(a[:k]); best=(s,0)
for i in range(k,n): s+=a[i]-a[i-k]; best=max(best,(s,i-k+1))
print(best[1],best[0])
