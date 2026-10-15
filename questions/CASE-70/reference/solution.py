n=int(input()); a=list(map(int,input().split())); b=list(map(int,input().split())); c=list(map(int,input().split()))
for i in range(n):
    if abs(a[i]-sorted((a[i],b[i],c[i]))[1])>10 or abs(b[i]-sorted((a[i],b[i],c[i]))[1])>10 or abs(c[i]-sorted((a[i],b[i],c[i]))[1])>10: print(i);break
else: print(-1)
