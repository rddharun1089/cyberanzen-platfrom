import math
n = int(input())
cx, cy = map(float, input().split())
pts = [tuple(map(float, input().split())) for _ in range(n)]
farthest = max(pts, key=lambda p: math.hypot(p[0] - cx, p[1] - cy))
print(f"{farthest[0]:.2f} {farthest[1]:.2f}")
