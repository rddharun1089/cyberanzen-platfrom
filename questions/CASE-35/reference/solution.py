n, t = input().split()
n = int(n)
t = float(t)
a = list(map(float, input().split()))
for i, x in enumerate(a):
    if x < t:
        print(i)
        break
else:
    print("-1")
