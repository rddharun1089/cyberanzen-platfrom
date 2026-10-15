import math
n=int(input()); a=list(map(float,input().split())); m=sum(a)/n; s=(sum((x-m)**2 for x in a)/n)**.5
print(max(range(n),key=lambda i:abs(a[i]-m)/s if s else 0))
