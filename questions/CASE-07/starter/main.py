# The False Admin (Case 07)
# Domain: Cybersecurity & Digital Forensics
# Input contract: Input: n records `account device hour action`; account is suspicious when action=WRITE from a device never paired with that account.

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
