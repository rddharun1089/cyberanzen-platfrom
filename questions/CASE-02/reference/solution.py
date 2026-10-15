n=int(input()); a=[input().split() for _ in range(n)]
last={}
for j,(u,l,h) in enumerate(a):
    h=int(h)
    if u in last and h-last[u][0]<2 and l!=last[u][1]:
        print(u,j); break
    last[u]=(h,l)
else: print("NONE")
