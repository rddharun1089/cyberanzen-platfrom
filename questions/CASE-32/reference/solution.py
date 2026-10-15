import math
a = list(map(float, input().split()))
n = len(a)
best_p = -1.0
best_k = 1
for k in range(1, n // 2 + 1):
    re = sum(a[j] * math.cos(2 * math.pi * k * j / n) for j in range(n))
    im = sum(a[j] * math.sin(2 * math.pi * k * j / n) for j in range(n))
    power = re * re + im * im
    if power > best_p:
        best_p = power
        best_k = k
print(best_k if n > 1 else 0)
