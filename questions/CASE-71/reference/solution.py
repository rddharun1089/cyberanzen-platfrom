import hashlib
n=int(input()); edges=[tuple(map(int,input().split())) for _ in range(n-1)]; tok=[input().split() for _ in range(79)]
tok.sort(key=lambda x:int(x[0]))
s="|".join(f"{a}:{b}" for a,b in tok)
print(hashlib.sha256(s.encode()).hexdigest())
