import heapq
R, C = map(int, input().split())
grid = [list(map(int, input().split())) for _ in range(R)]
sr, sc = map(int, input().split())
tr, tc = map(int, input().split())
dist = {(sr, sc): 0}
q = [(0, sr, sc)]
while q:
    w, r, c = heapq.heappop(q)
    if (r, c) == (tr, tc):
        print(w)
        break
    if w > dist.get((r, c), 10**18):
        continue
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < R and 0 <= nc < C:
            nw = w + grid[nr][nc]
            if nw < dist.get((nr, nc), 10**18):
                dist[(nr, nc)] = nw
                heapq.heappush(q, (nw, nr, nc))
