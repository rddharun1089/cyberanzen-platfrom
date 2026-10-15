from collections import Counter
n=int(input()); a=list(map(int,input().split())); c=Counter(a)
print(min(c.values()),round(min(c.values())/n*100,2))
