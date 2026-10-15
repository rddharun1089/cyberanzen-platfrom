import hashlib
n=int(input())
for i in range(n):
    data,h,p=input().split()
    if hashlib.sha256((data+p).encode()).hexdigest()!=h: print(i);break
else: print("VALID")
