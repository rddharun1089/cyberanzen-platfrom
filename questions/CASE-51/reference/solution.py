import hashlib
n = int(input())
for i in range(n):
    data, h, p = input().split()
    calc = hashlib.sha256((data + p).encode()).hexdigest()
    if calc != h:
        print(i)
        break
else:
    print("VALID")
