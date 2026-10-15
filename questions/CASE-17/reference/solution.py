import hashlib
s1 = input().strip()
s2 = input().strip()
ha = hashlib.sha256(s1.encode()).hexdigest()
hb = hashlib.sha256(s2.encode()).hexdigest()
print(ha)
print(hb)
print(ha == hb)
