n = int(input())
T = float(input())
res = []
for i in range(n):
    x = list(map(float, input().split()))
    if sum(x) > T:
        res.append(str(i))
print(" ".join(res))
