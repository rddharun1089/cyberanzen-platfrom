n = int(input())
preds = []
for _ in range(n):
    t, pid = input().split()
    preds.append((int(t), pid))
m = int(input())
deps = []
for _ in range(m):
    s, e, model = input().split()
    deps.append((int(s), int(e), model))
for t, pid in preds:
    matched = "UNKNOWN"
    for s, e, model in deps:
        if s <= t <= e:
            matched = model
            break
    print(f"{pid} {matched}")
