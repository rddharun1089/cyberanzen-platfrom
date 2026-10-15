n = int(input())
vals = []
weights = []
for _ in range(n):
    v, w = map(float, input().split())
    vals.append(v)
    weights.append(w)
total_w = sum(weights)
base_mean = sum(vals[i] * weights[i] for i in range(n)) / total_w
best_idx = 0
max_diff = -1.0
for i in range(n):
    rem_w = total_w - weights[i]
    if rem_w > 0:
        rem_mean = (sum(vals[j] * weights[j] for j in range(n) if j != i)) / rem_w
        diff = abs(rem_mean - base_mean)
        if diff > max_diff:
            max_diff = diff
            best_idx = i
print(best_idx)
