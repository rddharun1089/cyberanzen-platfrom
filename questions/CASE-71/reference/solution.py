from collections import Counter
n = int(input())
a = input().split()
c = Counter(a)
res = sorted([x for x in c if c[x] > 0.20 * n])
print(" ".join(res) if res else "NONE")
