n = int(input())
cmds = {}
for _ in range(n):
    t, p, r = input().split()
    t = int(t)
    p = int(p)
    if t not in cmds or p > cmds[t][0]:
        cmds[t] = (p, r)
for t in sorted(cmds.keys()):
    print(f"{t} {cmds[t][1]}")
