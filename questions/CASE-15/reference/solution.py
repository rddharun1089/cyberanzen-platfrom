from collections import defaultdict
n = int(input())
d = defaultdict(lambda: [0, 0, 0])
for _ in range(n):
    a, p, g = input().split()
    a, p = int(a), int(p)
    if a == 1 and p == 1:
        d[g][0] += 1
    if p == 1:
        d[g][1] += 1
    if a == 1:
        d[g][2] += 1
best = None
min_f1 = 2.0
for g in sorted(d.keys()):
    tp, pred_pos, act_pos = d[g]
    f1 = (2 * tp / (pred_pos + act_pos)) if (pred_pos + act_pos) > 0 else 0.0
    if f1 < min_f1:
        min_f1 = f1
        best = g
print(f"{best} {min_f1:.4f}")
