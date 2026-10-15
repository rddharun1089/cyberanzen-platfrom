n = int(input())
doors = []
access = set()
for _ in range(n):
    t, k = input().split()
    t = int(t)
    if k == "DOOR":
        doors.append(t)
    elif k == "ACCESS":
        access.add(t)
for t in sorted(doors):
    if not any(abs(t - a) <= 5 for a in access):
        print(t)
        break
else:
    print("NONE")
