from collections import Counter
n = int(input())
c = Counter(map(int, input().split()))
most = c.most_common(1)[0]
print(f"{most[0]} {most[1]}")
