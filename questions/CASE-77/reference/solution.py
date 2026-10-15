n = int(input())
exp = input().split()
obs = input().split()
for i in range(n):
    if exp[i] != obs[i]:
        print(i)
        break
else:
    print("-1")
