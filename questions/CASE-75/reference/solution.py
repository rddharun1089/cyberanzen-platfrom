import hashlib
n = int(input())
for _ in range(n):
    v, h = input().split()
    if hashlib.sha256(v.encode()).hexdigest() != h:
        print(v)
        break
else:
    print("VALID")
