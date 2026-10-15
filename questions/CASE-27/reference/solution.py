n, k = map(int, input().split())
a = list(map(int, input().split()))
s = sum(a[:k])
best_sum = s
best_idx = 0
for i in range(k, n):
    s += a[i] - a[i - k]
    if s > best_sum:
        best_sum = s
        best_idx = i - k + 1
print(f"{best_idx} {best_sum}")
