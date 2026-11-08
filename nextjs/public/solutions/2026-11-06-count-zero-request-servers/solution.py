from bisect import bisect_left
from typing import List

class Solution:
    def countServers(self, n: int, logs: List[List[int]], x: int, queries: List[int]) -> List[int]:
        # max_time[i] = latest request time for server i (1‑based)
        max_time = [0] * (n + 1)          # 0 means “no request”

        for server, t in logs:
            if t > max_time[server]:
                max_time[server] = t

        # collect the latest times of all servers
        times = [max_time[i] for i in range(1, n + 1)]
        times.sort()                       # sorted list for binary search

        res = []
        for q in queries:
            thresh = q - x                  # we need servers with max_time < thresh
            cnt = bisect_left(times, thresh)   # number of elements < thresh
            res.append(cnt)

        return res
