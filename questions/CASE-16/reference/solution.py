import math
n, d = map(int, input().split())
A = [list(map(float, input().split())) for _ in range(n)]
c = [sum(A[i][j] for i in range(n)) / n for j in range(d)]
def dist(x):
    return math.sqrt(sum((x[j] - c[j]) ** 2 for j in range(d)))
print(max(range(n), key=lambda i: dist(A[i])))
