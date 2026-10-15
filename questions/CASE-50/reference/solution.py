import hashlib
n = int(input())
target = input().strip()
for _ in range(n):
    x = input().strip()
    if hashlib.sha256(x.encode()).hexdigest() == target:
        print(x)
        break
else:
    print("NOT FOUND")
