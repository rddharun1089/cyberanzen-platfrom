n=int(input()); a=[input().split() for _ in range(n)]
v=[float(x) for x,y in a if float(x)>=.9]
print(round(sum(int(y) for x,y in a if float(x)>=.9)/len(v),4) if v else 0)
