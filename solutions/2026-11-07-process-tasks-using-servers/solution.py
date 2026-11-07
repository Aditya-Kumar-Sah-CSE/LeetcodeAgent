import heapq
from typing import List

class Solution:
    def assignTasks(self, servers: List[int], tasks: List[int]) -> List[int]:
        # min-heap for available servers: (weight, index)
        free = []
        for i, w in enumerate(servers):
            heapq.heappush(free, (w, i))
        
        # min-heap for busy servers: (available_time, weight, index)
        busy = []
        
        ans = [0] * len(tasks)
        current_time = 0
        
        for j, t in enumerate(tasks):
            # task j becomes available at second j
            current_time = max(current_time, j)
            
            # release servers that have finished by current_time
            while busy and busy[0][0] <= current_time:
                avail_time, w, idx = heapq.heappop(busy)
                heapq.heappush(free, (w, idx))
            
            # if no server is free, jump to the earliest time a server becomes free
            if not free:
                # wait for the first server to free up
                avail_time, w, idx = heapq.heappop(busy)
                current_time = avail_time
                # push this server and any others that become free at the same time
                heapq.heappush(free, (w, idx))
                while busy and busy[0][0] == current_time:
                    avail_time, w, idx = heapq.heappop(busy)
                    heapq.heappush(free, (w, idx))
            
            # assign the current task to the best free server
            w, idx = heapq.heappop(free)
            ans[j] = idx
            # schedule when this server will be free again
            heapq.heappush(busy, (current_time + t, w, idx))
        
        return ans
