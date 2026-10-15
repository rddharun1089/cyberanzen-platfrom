import statistics
a=list(map(float,input().split())); m=statistics.median(a); t=float(input())
print(*[i for i,x in enumerate(a) if abs(x-m)>t])
