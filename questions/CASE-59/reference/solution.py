n=int(input()); a=list(map(int,input().split())); first={}
for i,x in enumerate(a):
    if x in first: print(x,i-first[x]);break
    first[x]=i
else: print("NONE")
