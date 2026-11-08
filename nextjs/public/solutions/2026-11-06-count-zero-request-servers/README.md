# 📖 Chapter 2747: Count Zero Request Servers

> **Difficulty**: Medium · **Date**: `2026-11-06`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/count-zero-request-servers/](https://leetcode.com/problems/count-zero-request-servers/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an integer `n` denoting the total number of servers and a 2D 0-indexed integer array `logs`, where `logs[i] = [server_id, time]` denotes that the server with id `server_id` received a request at time `time`. You are also given an integer `x` and a 0-indexed integer array `queries`. Return a 0-indexed integer array `arr` of length `queries.length` where `arr[i]` represents the number of servers that did not receive any requests during the time interval `[queries[i] - x, queries[i]]`. Note that the time intervals are inclusive. Example 1: ``` Input: n = 3, logs = [[1,3],[2,6],[1,5]], x = 5, queries = [10,11] Output: [1,2] Explanation: For queries[0]: The servers with ids 1 and 2 get requests in the duration of [5, 10]. Hence, only server 3 gets zero requests. For queries[1]: Only the server with id 2 gets a request in duration of [6,11]. Hence, the servers with ids 1 and 3 are the only servers that do not receive any requests during that time period. ``` Example 2: ``` Input: n = 3, logs = [[2,4],[2,1],[1,2],[3,1]], x = 2, queries = [3,4] Output: [0,1] Explanation: For queries[0]: All servers get at least one request in the duration of [1, 3]. For queries[1]: Only server with id 3 gets no request in the duration [2,4]. ``` Constraints: `1 <= n <= 10 5 ` `1 <= logs.length <= 10 5 ` `1 <= queries.length <= 10 5 ` ` logs[i].length == 2 ` `1 <= logs[i][0] <= n` `1 <= logs[i][1] <= 10 6 ` `1 <= x <= 10 5 ` `x < queries[i] <= 10 6 `

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Hash Table`
- `Sliding Window`
- `Sorting`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Hash Table, Sliding Window). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
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
```

---

## 7. ⏱️ Complexity Analysis
### Explanation
**Key Insight**  
For a server to have *received* a request during the interval `[t‑x, t]` (where `t` is a query time), it must have at least one request whose time lies in that interval.  
If the server’s **latest** request time is `L`, then:

* If `L < t‑x` → all its requests are before the interval → the server had **zero** requests in the interval.  
* If `L ≥ t‑x` → there exists a request at time `L` (or earlier) that falls inside the interval → the server is **not** counted.

Thus a server contributes to the answer **iff** its latest request time is **strictly less** than `t‑x`.  
Servers that never received a request have “latest time” = 0, which also satisfies the condition because `t‑x > 0`.

**Algorithm**
1. **Pre‑process logs** – for each server keep the maximum request time seen (`max_time`).  
   Complexity: `O(logs)`.
2. **Collect** the `max_time` values of all `n` servers into a list and **sort** it.  
   Sorting costs `O(n log n)`.
3. For each query `q`:
   * Compute the threshold `th = q - x`.
   * Use binary search (`bisect_left`) on the sorted list to find how many servers have `max_time < th`.  
     This count is the answer for the query.  
   * Complexity per query: `O(log n)`.
4. Return the list of answers.

**Complexities**
* **Time**:  
  * Pre‑processing logs: `O(logs)`  
  * Sorting the `n` maximum times: `O(n log n)`  
  * Answering all queries: `O(q log n)`  
  Overall: `O((logs + n + q) log n)` → dominated by `O((n + q) log n)` (since `logs ≤ 10⁵`).
* **Space**:  
  * `max_time` array of size `n+1` → `O(n)`  
  * Sorted list of times → `O(n)`  
  Total: `O(n)`.

This approach meets the required optimal time and space bounds for the problem constraints.
