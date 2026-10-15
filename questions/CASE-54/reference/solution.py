import hashlib
cur = input().strip()
n = int(input())
for _ in range(n):
    side, h = input().split()
    if side == "L":
        cur = hashlib.sha256((h + cur).encode()).hexdigest()
    else:
        cur = hashlib.sha256((cur + h).encode()).hexdigest()
print(cur)
