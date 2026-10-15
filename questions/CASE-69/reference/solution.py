n = int(input())
rows = [list(map(float, input().split())) for _ in range(n)]
means = [sum(rows[i][j] for i in range(n)) / n for j in range(3)]
stds = [((sum((rows[i][j] - means[j]) ** 2 for i in range(n)) / n) ** 0.5) for j in range(3)]
def score(i):
    return sum((abs(rows[i][j] - means[j]) / stds[j]) if stds[j] > 0 else 0 for j in range(3))
print(max(range(n), key=score))
