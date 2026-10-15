n=int(input()); rows=[list(map(float,input().split())) for _ in range(n)]
best=[0,0]
for j in (1,2):
    v=sum(abs(rows[i][j]-rows[i-1][j]) for i in range(1,n))
    if v>best[1]: best=[j,v]
print(best[0],best[1])
