n = int(input())
min_b = list(map(float, input().split()))
max_b = list(map(float, input().split()))
for i in range(n):
    vals = list(map(float, input().split()))
    if any(vals[j] < min_b[j] or vals[j] > max_b[j] for j in range(3)):
        print(i)
        break
else:
    print("-1")
