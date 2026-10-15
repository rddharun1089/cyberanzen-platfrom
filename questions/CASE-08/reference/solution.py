n = int(input())
g = {}
order = []
for _ in range(n):
    d, m = input().split()
    if d not in g:
        order.append(d)
    g.setdefault(d, []).append(m)
res = []
for d in order:
    res.append(d)
    for m in g[d]:
        if m not in res:
            res.append(m)
print(" ".join(res))
