from collections import Counter
n = int(input())
c = Counter()
for _ in range(n):
    ctrl, t = input().split()
    c[ctrl] += 1
most = c.most_common(1)[0]
print(f"{most[0]} {most[1]}")
