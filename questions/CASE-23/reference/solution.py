n = int(input())
a = [float(x) for x in input().split()]
m = sum(a) / n
s = (sum((x - m) ** 2 for x in a) / n) ** 0.5
out = [str(i) for i, x in enumerate(a) if s > 0 and abs(x - m) / s > 2.0]
print(" ".join(out) if out else "NONE")
