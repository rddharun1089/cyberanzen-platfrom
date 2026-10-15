n = int(input())
t = list(map(int, input().split()))
best = cur = 0
for i in range(1, n):
    if t[i] - t[i-1] <= 10:
        cur += 1
    else:
        cur = 0
    best = max(best, cur)
print(best + 1 if n else 0)
