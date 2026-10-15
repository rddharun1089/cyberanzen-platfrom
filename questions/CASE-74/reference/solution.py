n = int(input())
events = []
for _ in range(n):
    t, d, eid = input().split()
    events.append((int(t), d.upper()))
events.sort()
found = False
for i in range(n):
    t_start = events[i][0]
    domains = {events[i][1]}
    for j in range(i, n):
        if events[j][0] - t_start <= 60:
            domains.add(events[j][1])
            if {"CYBER", "IOT", "ROBOT"}.issubset(domains):
                print(events[j][0])
                found = True
                break
        else:
            break
    if found:
        break
if not found:
    print("NONE")
