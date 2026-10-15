n=int(input()); a=[input().split() for _ in range(n)]; T=int(input())
a.sort(key=lambda x:int(x[1]))
for f,t in a:
    if int(t)>T: print(f); break
