import math
a = list(map(float, input().split()))
b = list(map(float, input().split()))
n = len(a)
ma = sum(a) / n
mb = sum(b) / n
num = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((x - mb) ** 2 for x in b))
print(f"{round(num / den, 4):.4f}" if den else "0.0000")
