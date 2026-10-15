import statistics
n = int(input())
a = list(map(float, input().split()))
m = statistics.mean(a)
s = statistics.pstdev(a)
out = [str(i) for i, x in enumerate(a) if s > 0 and x > m + 2 * s]
print(" ".join(out) if out else "NONE")
