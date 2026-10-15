n = int(input())
recs = []
for _ in range(n):
    t, b = map(int, input().split())
    recs.append((t, b))
recs.sort()
max_bytes = 0
s = 0
l = 0
for r in range(n):
    s += recs[r][1]
    while recs[r][0] - recs[l][0] > 60:
        s -= recs[l][1]
        l += 1
    if s > max_bytes:
        max_bytes = s
print(max_bytes)
