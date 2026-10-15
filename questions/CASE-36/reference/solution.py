from collections import Counter
n=int(input()); c=Counter(map(int,input().split())); print(*c.most_common(1)[0])
