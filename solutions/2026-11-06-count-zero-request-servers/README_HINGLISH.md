# 📖 Chapter 2747: Count Zero Request Servers (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-06`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/count-zero-request-servers/](https://leetcode.com/problems/count-zero-request-servers/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an integer `n` denoting the total number of servers and a 2D 0-indexed integer array `logs`, where `logs[i] = [server_id, time]` denotes that the server with id `server_id` received a request at time `time`. You are also given an integer `x` and a 0-indexed integer array `queries`. Return a 0-indexed integer array `arr` of length `queries.length` where `arr[i]` represents the number ...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Hash Table**
- **Sliding Window**
- **Sorting**

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
