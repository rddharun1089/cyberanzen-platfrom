import hashlib
cur=input().strip()
n=int(input())
for _ in range(n):
    side,h=input().split()
    cur=hashlib.sha256((h+cur).encode()).hexdigest() if side=="L" else hashlib.sha256((cur+h).encode()).hexdigest()
print(cur)
