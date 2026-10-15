def parse():
    n=int(input()); door=[]; motion=set(); access=set()
    for _ in range(n):
        t,k=input().split(); t=int(t)
        (door if k=="DOOR" else motion if k=="MOTION" else access).append(t) if k!="ACCESS" else access.add(t)
    for t in sorted(door):
        if not any(abs(t-a)<=5 for a in access): print(t); return
    print("NONE")
parse()
