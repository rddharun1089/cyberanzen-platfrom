s = input().strip()
rev = s[::-1]
out = []
for c in rev:
    if 'A' <= c <= 'Z':
        out.append(chr((ord(c) - ord('A') - 1) % 26 + ord('A')))
    elif 'a' <= c <= 'z':
        out.append(chr((ord(c) - ord('a') - 1) % 26 + ord('a')))
    else:
        out.append(c)
print("".join(out))
