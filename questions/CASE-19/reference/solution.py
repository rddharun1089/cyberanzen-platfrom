n = int(input())
a = [input().split() for _ in range(n)]
filtered = [int(y) for x, y in a if float(x) >= 0.9]
if filtered:
    acc = sum(filtered) / len(filtered)
    print(f"{acc:.4f}")
else:
    print("0.0000")
