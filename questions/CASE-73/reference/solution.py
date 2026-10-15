exp = set(input().split())
obs = set(input().split())
missing = sorted(exp - obs)
print(" ".join(missing) if missing else "NONE")
