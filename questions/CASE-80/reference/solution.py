import hashlib
n=int(input()); a=[tuple(input().split(maxsplit=1)) for _ in range(n)]
a.sort(key=lambda x:int(x[0]))
chain="|".join(f"{k}:{v}" for k,v in a)
print("FLAG{"+hashlib.sha256(chain.encode()).hexdigest()[:16]+"}")
