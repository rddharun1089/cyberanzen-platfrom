n = int(input())
for i in range(n):
    vals = list(map(int, input().split()))
    med = sorted(vals)[1]
    if any(abs(v - med) > 10 for v in vals):
        print(i)
        break
else:
    print("-1")
