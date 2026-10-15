# Matrix contradiction detector: input n, then n*n integers. Print conflicting row indices.
n=int(input()); A=[list(map(int,input().split())) for _ in range(n)]
for i in range(n):
    for j in range(i+1,n):
        if A[i][j] != A[j][i]: print(i,j)
