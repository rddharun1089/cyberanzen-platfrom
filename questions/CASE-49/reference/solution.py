n = int(input())
a = list(map(int, input().split()))
bad = [str(i) for i, x in enumerate(a) if x * x > 100]
print(" ".join(bad) if bad else "NONE")
