n=int(input()); d={}
for _ in range(n):
    user,dev,t=input().split();d.setdefault(user,set()).add(dev)
for u,v in d.items(): print(u,len(v))
