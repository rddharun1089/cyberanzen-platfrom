from collections import Counter
n=int(input()); c=Counter()
for _ in range(n): c[input().split()[0]]+=1
print(c.most_common(1)[0])
