n, d = map(int, input().split())
best_idx = 0
max_dist = -1.0
for i in range(n):
    a = list(map(float, input().split()))
    b = list(map(float, input().split()))
    dist = sum(abs(a[j] - b[j]) for j in range(d))
    if dist > max_dist:
        max_dist = dist
        best_idx = i
print(f"{best_idx} {max_dist:.4f}")
