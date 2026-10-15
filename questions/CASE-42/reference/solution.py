reg = set(input().split())
obs = input().split()
unknown = sorted(set(obs) - reg)
print(" ".join(unknown) if unknown else "NONE")
