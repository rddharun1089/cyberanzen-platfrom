# Input: n then time user process bytes
n=int(input()); a=[input().split() for _ in range(n)]
a.sort(key=lambda x:int(x[0]))
seen=set()
for x in a:
    k=(x[0],x[1])
    if k in seen: print("FLAG",x[1]); break
    seen.add(k)
else: print("FLAG NONE")
