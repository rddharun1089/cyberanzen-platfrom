# The Fake Block (Case 51)
# Domain: Blockchain
# Input contract: Input: n blocks each `data hash prev`; recompute SHA-256(data+prev) and print first mismatch.

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
