n=int(input()); d={}
for _ in range(n):
    i,s,t=input().split(); d.setdefault(i,[]).append((s,t))
for i,v in d.items():
    v.sort()
    for (_,to), (frm,_) in zip(v,v[1:]):
        if to!=frm: print(i); break
