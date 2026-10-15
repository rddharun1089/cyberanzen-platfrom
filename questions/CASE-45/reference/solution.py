n = int(input())
cmds = []
for _ in range(n):
    p, t, s = input().split()
    cmds.append((-int(p), int(t), s))
cmds.sort()
print(" ".join(s for _, _, s in cmds))
