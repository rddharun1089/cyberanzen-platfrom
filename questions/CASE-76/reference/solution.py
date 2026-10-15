from collections import Counter
n=int(input()); tp=fp=fn=0
for _ in range(n):
    y,p=input().split();y=int(y);p=int(p)
    tp+=y==p==1;fp+=y==0 and p==1;fn+=y==1 and p==0
prec=tp/(tp+fp) if tp+fp else 0;rec=tp/(tp+fn) if tp+fn else 0
print(round(2*prec*rec/(prec+rec),4) if prec+rec else 0)
