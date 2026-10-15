n=int(input()); th=float(input()); rows=[]
for _ in range(n): rows.append(input().split())
xs=[float(r[0]) for r in rows if r[0]!="NA"]; ys=[float(r[1]) for r in rows if r[1]!="NA"]
mx=sum(xs)/len(xs); my=sum(ys)/len(ys); ch=0
for r in rows:
    x=mx if r[0]=="NA" else float(r[0]); y=my if r[1]=="NA" else float(r[1])
    p=int(x+y>=th); old=int(r[2])
    ch+=p!=old
print(ch)
