n=int(input()); pairs=[]
valid={}
for _ in range(n):
    a,d,h,act=input().split(); h=int(h)
    valid.setdefault(a,set()).add(d)
    pairs.append((a,d,act))
for a,d,act in pairs:
    if act=="WRITE" and d not in valid.get(a,set()): print(a,d)
