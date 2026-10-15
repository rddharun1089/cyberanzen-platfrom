n = int(input())
rows = [list(map(float, input().split())) for _ in range(n)]
c1 = sum(abs(rows[i][1] - rows[i-1][1]) for i in range(1, n))
c2 = sum(abs(rows[i][2] - rows[i-1][2]) for i in range(1, n))
if c1 >= c2:
    print(f"1 {c1:.2f}")
else:
    print(f"2 {c2:.2f}")
