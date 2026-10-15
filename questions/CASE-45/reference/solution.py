import heapq
n=int(input()); h=[]
for _ in range(n):
    p,t,s=input().split(); heapq.heappush(h,(-int(p),int(t),s))
while h: print(heapq.heappop(h)[2],end=" ")
