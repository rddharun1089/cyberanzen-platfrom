from collections import Counter
n=int(input()); a=list(map(int,input().split())); d=[a[i]-a[i-1] for i in range(1,n)]
print(Counter(d).most_common(1)[0][0] if d else 0)
