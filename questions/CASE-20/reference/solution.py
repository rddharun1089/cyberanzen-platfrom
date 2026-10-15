a=list(map(float,input().split())); b=list(map(float,input().split()))
m1=sum(a)/len(a);m2=sum(b)/len(b)
print(round(abs(m1-m2),6))
