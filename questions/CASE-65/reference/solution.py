import math
n = int(input())
T = float(input())
for i in range(n):
    px, py, ax, ay = map(float, input().split())
    if math.hypot(px - ax, py - ay) > T:
        print(i)
        break
else:
    print("-1")
