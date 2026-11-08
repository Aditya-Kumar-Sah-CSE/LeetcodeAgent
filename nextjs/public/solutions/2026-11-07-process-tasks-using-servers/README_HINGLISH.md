# 📖 Chapter 1882: Process Tasks Using Servers (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-07`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/process-tasks-using-servers/](https://leetcode.com/problems/process-tasks-using-servers/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given two 0-indexed integer arrays `servers` and `tasks` of lengths `n`​​​​​​ and `m`​​​​​​ respectively. `servers[i]` is the weight of the `i ​​​​​​th `​​​​ server, and `tasks[j]` is the time needed to process the `j ​​​​​​th `​​​​ task in seconds . Tasks are assigned to the servers using a task queue . Initially, all servers are free, and the queue is empty . At second `j`, the `j th ` t...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Heap (Priority Queue)**

---

## 3. 💡 Main Concept
Optimal DSA pattern aur constraints ke anusaar solution.

---

## 4. ⚡ Yaad Rakhne Ki Mast Trick (Interview Formula)
> 💡 **Trick**:
> Problem ko step-by-step simplify karo aur extra work ko avoid karne ke liye in-place marking use karo!

---

## 5. 💻 Complete Code

```python
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
```
