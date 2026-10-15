from collections import defaultdict
n=int(input()); d=defaultdict(list)
for _ in range(n):
    token,t,tx=input().split(); d[token].append((int(t),tx))
for k,v in d.items():
    if len(v)>1: print(k);break
else: print("NONE")
