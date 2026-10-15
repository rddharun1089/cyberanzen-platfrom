n=int(input()); a=list(map(float,input().split())); print(min(range(n),key=lambda i:abs(a[i]-sum(a)/n)))
