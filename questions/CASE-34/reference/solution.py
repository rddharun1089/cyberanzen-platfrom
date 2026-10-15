n = int(input())
a = list(map(int, input().split()))
out = [str(i) for i in range(1, n) if a[i] != a[i-1]]
print(" ".join(out) if out else "NONE")
