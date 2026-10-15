n = int(input())
lo, hi = map(float, input().split())
a = list(map(float, input().split()))
for i, x in enumerate(a):
    if not (lo <= x <= hi):
        print(i)
        break
else:
    print("-1")
