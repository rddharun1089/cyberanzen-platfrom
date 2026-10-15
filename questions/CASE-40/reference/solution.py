n, a, b = map(int, input().split())
bad = []
for _ in range(n):
    t, v = map(int, input().split())
    if not (a <= t <= b):
        bad.append(f"{t} {v}")
if bad:
    for b_item in bad:
        print(b_item)
else:
    print("NONE")
