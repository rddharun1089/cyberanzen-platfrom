n=int(input()); d={}
for _ in range(n):
    u,f=input().split(); d.setdefault(u,set()).add(f)
u=max(d,key=lambda x:len(d[x]))
print(u,len(d[u]))
