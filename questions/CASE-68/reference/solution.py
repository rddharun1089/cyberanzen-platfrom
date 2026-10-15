import hashlib
n=int(input()); d={}
for _ in range(n):
    v,h=input().split();d[v]=h
for v in sorted(d):
    if hashlib.sha256(v.encode()).hexdigest()!=d[v]: print(v);break
else: print("VALID")
