import hashlib
n=int(input()); prev=""; 
for i in range(n):
    data,h,p=input().split(); ok=p==prev
    calc=hashlib.sha256((data+p).encode()).hexdigest()
    if not ok or calc!=h: print(i);break
    prev=h
else: print("VALID")
