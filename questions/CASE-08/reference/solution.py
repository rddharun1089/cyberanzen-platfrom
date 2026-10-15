n=int(input()); g={}
for _ in range(n):
    d,m=input().split(); g.setdefault(d,[]).append(m)
s=next(iter(g),None); seen=set(); st=[s]
while st:
    u=st.pop()
    if u in seen: continue
    seen.add(u); print(u,end=" ")
    st+=g.get(u,[])
