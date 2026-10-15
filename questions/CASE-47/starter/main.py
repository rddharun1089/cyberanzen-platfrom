# The Ghost Transfer (Case 47)
# Domain: Blockchain
# Input contract: Input: n transaction lines `from to amount hash prevhash`; verify each prevhash equals prior hash; print first broken index.

import sys

def solve():
    # Read input from standard input
    lines = sys.stdin.read().split()
    if not lines:
        return
    # TODO: Implement investigation logic
    pass

if __name__ == '__main__':
    solve()
