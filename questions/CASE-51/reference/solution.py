from collections import defaultdict
n=int(input()); seen=set(); y=0;n0=0
for _ in range(n):
    u,v=input().split()
    if u in seen: continue
    seen.add(u); y+=v=="YES"; n0+=v=="NO"
print("YES" if y>n0 else "NO")
