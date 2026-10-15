import sys,hashlib
a=open(sys.argv[1],"rb").read(); b=open(sys.argv[2],"rb").read()
ha=hashlib.sha256(a).hexdigest(); hb=hashlib.sha256(b).hexdigest()
print(ha);print(hb);print(ha==hb)
