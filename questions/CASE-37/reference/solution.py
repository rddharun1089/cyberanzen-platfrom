s = input().split()
a = [int(x, 16) for x in s]
on = False
out = []
for x in a:
    if x == 0xAA:
        on = True
        continue
    if x == 0x55 and on:
        break
    if on:
        out.append(x)
print(" ".join(f"{x:02X}" for x in out))
