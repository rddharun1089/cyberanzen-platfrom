n = int(input())
th = float(input())
rows = [input().split() for _ in range(n)]
xs = [float(r[0]) for r in rows if r[0] != "NA"]
ys = [float(r[1]) for r in rows if r[1] != "NA"]
mx = sum(xs)/len(xs) if xs else 0.0
my = sum(ys)/len(ys) if ys else 0.0
ch = 0
for r in rows:
    x = mx if r[0] == "NA" else float(r[0])
    y = my if r[1] == "NA" else float(r[1])
    p = int(x + y >= th)
    ch += (p != int(r[2]))
print(ch)
