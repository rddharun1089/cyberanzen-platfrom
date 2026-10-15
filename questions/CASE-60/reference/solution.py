n = int(input())
a = [input().strip() for _ in range(n)]
first = {}
for i, x in enumerate(a):
    if x in first:
        print(f"{x} {i - first[x]}")
        break
    first[x] = i
else:
    print("NONE")
