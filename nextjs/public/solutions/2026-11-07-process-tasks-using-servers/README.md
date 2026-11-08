# 📖 Chapter 1882: Process Tasks Using Servers

> **Difficulty**: Medium · **Date**: `2026-11-07`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/process-tasks-using-servers/](https://leetcode.com/problems/process-tasks-using-servers/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given two 0-indexed integer arrays `servers` and `tasks` of lengths `n`​​​​​​ and `m`​​​​​​ respectively. `servers[i]` is the weight of the `i ​​​​​​th `​​​​ server, and `tasks[j]` is the time needed to process the `j ​​​​​​th `​​​​ task in seconds . Tasks are assigned to the servers using a task queue . Initially, all servers are free, and the queue is empty . At second `j`, the `j th ` task is inserted into the queue (starting with the `0 th ` task being inserted at second `0`). As long as there are free servers and the queue is not empty, the task in the front of the queue will be assigned to a free server with the smallest weight , and in case of a tie, it is assigned to a free server with the smallest index . If there are no free servers and the queue is not empty, we wait until a server becomes free and immediately assign the next task. If multiple servers become free at the same time, then multiple tasks from the queue will be assigned in order of insertion following the weight and index priorities above. A server that is assigned task `j` at second `t` will be free again at second `t + tasks[j]`. Build an array `ans`​​​​ of length `m`, where `ans[j]` is the index of the server the `j ​​​​​​th ` task will be assigned to. Return the array `ans`​​​​. Example 1: ``` Input: servers = [3,3,2], tasks = [1,2,3,2,1,2] Output: [2,2,0,2,1,2] Explanation: Events in chronological order go as follows: - At second 0, task 0 is added and processed using server 2 until second 1. - At second 1, server 2 becomes free. Task 1 is added and processed using server 2 until second 3. - At second 2, task 2 is added and processed using server 0 until second 5. - At second 3, server 2 becomes free. Task 3 is added and processed using server 2 until second 5. - At second 4, task 4 is added and processed using server 1 until second 5. - At second 5, all servers become free. Task 5 is added and processed using server 2 until second 7. ``` Example 2: ``` Input: servers = [5,1,4,3,2], tasks = [2,1,2,4,5,2,1] Output: [1,4,1,4,1,3,2] Explanation: Events in chronological order go as follows: - At second 0, task 0 is added and processed using server 1 until second 2. - At second 1, task 1 is added and processed using server 4 until second 2. - At second 2, servers 1 and 4 become free. Task 2 is added and processed using server 1 until second 4. - At second 3, task 3 is added and processed using server 4 until second 7. - At second 4, server 1 becomes free. Task 4 is added and processed using server 1 until second 9. - At second 5, task 5 is added and processed using server 3 until second 7. - At second 6, task 6 is added and processed using server 2 until second 7. ``` Constraints: `servers.length == n` `tasks.length == m` `1 <= n, m <= 2 * 10 5 ` `1 <= servers[i], tasks[j] <= 2 * 10 5 `

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Heap (Priority Queue)`

---

## 3. 💡 Core Concept Used
Optimal algorithmic pattern matching the problem constraints.

---

## 4. ⚡ Trick to Remember (Interview Intuition)
> 💡 **Mental Model**:
> Break down the problem using optimal state invariants and in-place transformations to eliminate duplicate work.

---

## 5. 🔄 All Stages Summary
| Stage | Details |
|:---|:---|
| **Stage 1: Understand** | Analyzed constraints and target guarantees. |
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Heap (Priority Queue)). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

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

---

## 7. ⏱️ Complexity Analysis
### Explanation
**Approach**  
We maintain two priority queues (heaps):

1. **`free`** – a min‑heap of available servers ordered by `(weight, index)`.  
   The smallest weight (and smallest index on ties) is always at the top.

2. **`busy`** – a min‑heap of servers that are currently processing a task, ordered by their **available time** `(available_time, weight, index)`.  
   The server that becomes free the earliest is at the top.

We iterate over the tasks in their natural order (the queue order).  
For each task `j` with processing time `t = tasks[j]`:

1. **Advance time** to at least `j` (the moment the task arrives).  
2. **Free up** any servers whose `available_time ≤ current_time`; move them from `busy` to `free`.  
3. If `free` is still empty, we must wait for the earliest server to become free:
   * Set `current_time` to the top of `busy` (the earliest availability).  
   * Release **all** servers that become free at that exact time (they may be multiple).  
4. Assign the task to the best server from `free` (pop the smallest `(weight, index)`).  
   Record the server index in `ans[j]`.  
5. Push the server into `busy` with its new availability time `current_time + t`.
