n = int(input())
pairs = []
valid = {}
for _ in range(n):
    a, d, h, act = input().split()
    if act == "READ":
        valid.setdefault(a, set()).add(d)
    pairs.append((a, d, act))
found = False
for a, d, act in pairs:
    if act == "WRITE" and d not in valid.get(a, set()):
        print(a, d)
        found = True
if not found:
    print("NONE")
