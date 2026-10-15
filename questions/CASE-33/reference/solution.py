n=int(input()); 
for i in range(n):
    x=list(map(int,input().split())); med=sorted(x)[1]
    if any(abs(v-med)>10 for v in x): print(i);break
else: print(-1)
