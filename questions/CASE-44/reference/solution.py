n = int(input())
seen = set()
for _ in range(n):
    nonce = input().split()[0]
    if nonce in seen:
        print(nonce)
        break
    seen.add(nonce)
else:
    print("NONE")
