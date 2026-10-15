n, k = map(int, input().split())
a = list(map(float, input().split()))
for i in range(k, n):
    w = a[i - k:i]
    m = sum(w) / k
    s = (sum((x - m) ** 2 for x in w) / k) ** 0.5
    if a[i] > m + 3 * s:
        print(i)
        break
else:
    print("-1")
