n = int(input())
a = sorted(map(int, input().split()))
missing = [str(x) for x in range(a[0], a[-1] + 1) if x not in set(a)]
print(" ".join(missing))
