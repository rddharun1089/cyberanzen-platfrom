from functools import lru_cache
n=int(input()); g=[list(map(int,input().split())) for _ in range(n)]
@lru_cache(None)
def f(u):
    return max([0]+[1+f(v) for v in g[u] if v<n])
print(max(f(i) for i in range(n)))
