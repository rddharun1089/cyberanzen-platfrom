n, k = map(int, input().split())
a = list(map(float, input().split()))
for i in range(n - k + 1):
    if all(x > 0 for x in a[i:i + k]):
        print(i)
        break
else:
    print("-1")
