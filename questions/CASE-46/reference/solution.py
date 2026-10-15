import statistics
a = list(map(float, input().split()))
t = float(input())
m = statistics.median(a)
out = [str(i) for i, x in enumerate(a) if abs(x - m) > t]
print(" ".join(out) if out else "NONE")
