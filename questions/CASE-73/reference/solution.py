n=int(input()); a=[tuple(map(float,input().split())) for _ in range(n)]
s=sum(x[1] for x in a); print(round(s/sum(x[0] for x in a),6) if sum(x[0] for x in a) else 0)
