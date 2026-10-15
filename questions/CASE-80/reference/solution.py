import hashlib
n = int(input())
tokens = [tuple(input().split(maxsplit=1)) for _ in range(n)]
tokens.sort(key=lambda x: int(x[0]))
chain = "|".join(f"{k}:{v}" for k, v in tokens)
flag_hash = hashlib.sha256(chain.encode()).hexdigest()[:16]
print(f"FLAG{{{flag_hash}}}")
