# 📖 Chapter 1267: Count Servers that Communicate

> **Difficulty**: Medium · **Date**: `2026-11-08`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/count-servers-that-communicate/](https://leetcode.com/problems/count-servers-that-communicate/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given a map of a server center, represented as a `m * n` integer matrix `grid`, where 1 means that on that cell there is a server and 0 means that it is no server. Two servers are said to communicate if they are on the same row or on the same column. Return the number of servers that communicate with any other server. Example 1: ``` Input: grid = [[1,0],[0,1]] Output: 0 Explanation: No servers can communicate with others. ``` Example 2: ``` Input: grid = [[1,0],[1,1]] Output: 3 Explanation: All three servers can communicate with at least one other server. ``` Example 3: ``` Input: grid = [[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]] Output: 4 Explanation: The two servers in the first row can communicate with each other. The two servers in the third column can communicate with each other. The server at right bottom corner can't communicate with any other server. ``` Constraints: `m == grid.length` `n == grid[i].length` `1 <= m <= 250` `1 <= n <= 250` `grid[i][j] == 0 or 1`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Depth-First Search`
- `Breadth-First Search`
- `Union-Find`
- `Matrix`
- `Counting`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Depth-First Search, Breadth-First Search). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
class Solution:
    def countServers(self, grid: list[list[int]]) -> int:
        m = len(grid)
        n = len(grid[0])
        
        # Count servers in each row and column
        row_counts = [0] * m
        col_counts = [0] * n
        
        for i in range(m):
            for j in range(n):
                if grid[i][j] == 1:
                    row_counts[i] += 1
                    col_counts[j] += 1
        
        # Count servers that communicate (have at least one other server in row or column)
        result = 0
        for i in range(m):
            for j in range(n):
                if grid[i][j] == 1 and (row_counts[i] > 1 or col_counts[j] > 1):
                    result += 1
        
        return result
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

**Approach:**
The key insight is that a server communicates if there is at least one other server in its row OR at least one other server in its column. We can solve this efficiently by:

1. **First pass**: Count the number of servers in each row (`row_counts`) and each column (`col_counts`). This takes O(m × n) time.

2. **Second pass**: Iterate through each cell. If a cell contains a server (value 1) and either its row has more than 1 server (`row_counts[i] > 1`) or its column has more than 1 server (`col_counts[j] > 1`), then this server communicates with at least one other server. We count such servers.

**Why this works:**
- If `row_counts[i] > 1`, there is at least one other server in the same row, so the server at `(i, j)` can communicate.
- Similarly, if `col_counts[j] > 1`, there is at least one other server in the same column.
- The condition `row_counts[i] > 1 or col_counts[j] > 1` covers both cases.

**Complexity Analysis:**
- **Time Complexity:** O(m × n) - We make two passes through the grid (one for counting, one for checking).
- **Space Complexity:** O(m + n) - We store counts for m rows and n columns.

This approach is optimal for the given constraints (m, n ≤ 250).
