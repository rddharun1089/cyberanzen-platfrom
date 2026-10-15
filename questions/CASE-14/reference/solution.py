from collections import Counter
n = int(input())
a = list(map(int, input().split()))
c = Counter(a)
min_count = min(c.values())
pct = round(min_count / n * 100, 2)
print(f"{min_count} {pct:.2f}")
