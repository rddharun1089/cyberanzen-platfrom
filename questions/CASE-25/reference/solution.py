n = int(input())
a = [float(x) for x in input().split()]
for i in range(n):
    if a[i] == -1.0:
        l = i - 1
        while l >= 0 and a[l] == -1.0:
            l -= 1
        r = i + 1
        while r < n and a[r] == -1.0:
            r += 1
        if l >= 0 and r < n:
            a[i] = a[l] + (a[r] - a[l]) * (i - l) / (r - l)
        elif l >= 0:
            a[i] = a[l]
        elif r < n:
            a[i] = a[r]
print(" ".join(f"{x:.2f}" for x in a))
