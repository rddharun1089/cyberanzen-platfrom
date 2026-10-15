import hashlib
n = int(input())
prev = "0"
for i in range(n):
    data, h, p = input().split()
    if p != prev:
        print(i)
        break
    calc = hashlib.sha256((data + p).encode()).hexdigest()
    if calc != h:
        print(i)
        break
    prev = h
else:
    print("VALID")
