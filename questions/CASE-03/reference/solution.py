n = int(input())
q = input().lower().strip()
indices = []
for i in range(n):
    s = input()
    if q in s.lower():
        indices.append(str(i))
print(" ".join(indices))
