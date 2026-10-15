n=int(input()); a=[float(x) for x in input().split()]; m=sum(a)/n; s=(sum((x-m)**2 for x in a)/n)**.5
print(*[i for i,x in enumerate(a) if s and abs(x-m)/s>2])
