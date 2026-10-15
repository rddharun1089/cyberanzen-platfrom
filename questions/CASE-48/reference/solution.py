n = int(input())
seen = set()
for _ in range(n):
    token, t, tx = input().split()
    if token in seen:
        print(token)
        break
    seen.add(token)
else:
    print("NONE")
