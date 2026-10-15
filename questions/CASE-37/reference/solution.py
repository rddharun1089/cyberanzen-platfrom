s=input().split(); a=list(map(lambda x:int(x,16),s)); on=False; out=[]
for x in a:
    if x==0xAA: on=True; continue
    if x==0x55 and on: break
    if on: out.append(x)
print(*[f"{x:02X}" for x in out])
