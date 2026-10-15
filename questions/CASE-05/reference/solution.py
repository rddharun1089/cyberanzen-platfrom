n=int(input()); a=[input().split(maxsplit=1) for _ in range(n)]
for _,p in sorted(a,key=lambda x:int(x[0])): print(p,end="")
