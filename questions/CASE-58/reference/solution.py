import statistics
a=list(map(float,input().split()));m=statistics.mean(a);s=statistics.pstdev(a)
print(*[i for i,x in enumerate(a) if s and x>m+2*s])
