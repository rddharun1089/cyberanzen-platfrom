from collections import Counter
n=int(input()); a=input().split(); c=Counter(a); print(*[x for x in c if c[x]>.2*n])
