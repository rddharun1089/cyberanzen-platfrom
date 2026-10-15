import math
n = int(input())
max_dev = 0.0
for _ in range(n):
    px, py, ax, ay = map(float, input().split())
    max_dev = max(max_dev, math.hypot(px - ax, py - ay))
print(f"{max_dev:.4f}")
