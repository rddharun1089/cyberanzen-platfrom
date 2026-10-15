import heapq
n=int(input()); h=[]
for _ in range(n):
    t,p,r=input().split(); heapq.heappush(h,(int(t),-int(p),r))
while h:
    t,p,r=heapq.heappop(h);print(t,r)
