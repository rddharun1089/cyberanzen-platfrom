import math
n=int(input()); p=[tuple(map(float,input().split())) for _ in range(n)]
w=[x[2] for x in p]; s=sum(w); print(round(sum(x[0]*x[2] for x in p)/s,6) if s else 0)
