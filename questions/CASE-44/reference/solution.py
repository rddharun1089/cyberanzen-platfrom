n,t=map(int,input().split()); seen=set()
for _ in range(n):
    x=int(input().split()[0])
    if x in seen: print(x);break
    seen.add(x)
else: print("NONE")
