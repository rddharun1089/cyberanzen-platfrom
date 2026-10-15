n=int(input()); a=[tuple(map(int,input().split())) for _ in range(n)];a.sort()
best=(0,0);s=0;j=0
for i in range(n):
    while a[i][0]-a[j][0]>60:s-=a[j][1];j+=1
    s+=a[i][1];best=max(best,(s,a[i][0]))
print(*best)
