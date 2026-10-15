n = int(input())
d = {}
for _ in range(n):
    sid, src, dst, t = input().split()
    d.setdefault(sid, []).append((int(t), src, dst))
bad = []
for sid in sorted(d.keys()):
    recs = sorted(d[sid], key=lambda x: x[0])
    for (_, _, prev_dst), (_, next_src, _) in zip(recs, recs[1:]):
        if prev_dst != next_src:
            bad.append(sid)
            break
print(" ".join(bad) if bad else "NONE")
