import math
n = int(input())
pts = [tuple(map(float, input().split())) for _ in range(n)]
T = float(input())
cx = sum(p[0] for p in pts) / n
cy = sum(p[1] for p in pts) / n
out = [str(i) for i, p in enumerate(pts) if math.hypot(p[0] - cx, p[1] - cy) > T]
print(" ".join(out) if out else "NONE")
