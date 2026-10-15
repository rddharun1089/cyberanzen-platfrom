import math
a=list(map(float,input().split())); n=len(a); best=0
for k in range(1,n):
    re=sum(a[j]*math.cos(2*math.pi*k*j/n) for j in range(n))
    im=sum(a[j]*math.sin(2*math.pi*k*j/n) for j in range(n))
    if re*re+im*im>best: best=re*re+im*im; idx=k
print(idx if n>1 else 0)
