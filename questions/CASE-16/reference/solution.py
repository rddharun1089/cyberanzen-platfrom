import math
n,d=map(int,input().split()); A=[list(map(float,input().split())) for _ in range(n)]
c=[sum(x[j] for x in A)/n for j in range(d)]
def ds(x): return math.sqrt(sum((x[j]-c[j])**2 for j in range(d)))
print(max(range(n),key=lambda i:ds(A[i])))
