# 📖 Chapter 3882: Minimum XOR Path in a Grid

> **Difficulty**: Medium · **Date**: `2026-10-28`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-xor-path-in-a-grid/](https://leetcode.com/problems/minimum-xor-path-in-a-grid/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given a 2D integer array `grid` of size `m * n`. You start at the top-left cell `(0, 0)` and want to reach the bottom-right cell `(m - 1, n - 1)`. At each step, you may move either right or down . The cost of a path is defined as the bitwise XOR of all the values in the cells along that path, including the start and end cells. Return the minimum possible XOR value among all valid paths from `(0, 0)` to `(m - 1, n - 1)`. Example 1: Input: grid = [[1,2],[3,4]] Output: 6 Explanation: There are two valid paths: `(0, 0) &rarr; (0, 1) &rarr; (1, 1)` with XOR: `1 XOR 2 XOR 4 = 7` `(0, 0) &rarr; (1, 0) &rarr; (1, 1)` with XOR: `1 XOR 3 XOR 4 = 6` The minimum XOR value among all valid paths is 6. Example 2: Input: grid = [[6,7],[5,8]] Output: 9 Explanation: There are two valid paths: `(0, 0) &rarr; (0, 1) &rarr; (1, 1)` with XOR: `6 XOR 7 XOR 8 = 9` `(0, 0) &rarr; (1, 0) &rarr; (1, 1)` with XOR: `6 XOR 5 XOR 8 = 11` The minimum XOR value among all valid paths is 9. Example 3: Input: grid = [[2,7,5]] Output: 0 Explanation: There is only one valid path: `(0, 0) &rarr; (0, 1) &rarr; (0, 2)` with XOR: `2 XOR 7 XOR 5 = 0` The XOR value of this path is 0, which is the minimum possible. Constraints: `1 <= m == grid.length <= 1000` `1 <= n == grid[i].length <= 1000` `m * n <= 1000` `0 <= grid[i][j] <= 1023​`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Dynamic Programming`
- `Bit Manipulation`
- `Matrix`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Dynamic Programming, Bit Manipulation). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
class Solution:
    def minCost(self, grid: list[list[int]]) -> int:
        m, n = len(grid), len(grid[0])
        MAX_XOR = 1024  # grid values are <= 1023, so XOR stays within 0..1023

        # dp[i][j] is a bitset where bit x is 1 iff XOR value x is reachable at (i, j)
        dp = [[0] * n for _ in range(m)]
        dp[0][0] = 1 << grid[0][0]

        for i in range(m):
            for j in range(n):
                if i == 0 and j == 0:
                    continue
                val = grid[i][j]
                reachable = 0
                if i > 0:
                    reachable |= dp[i - 1][j]
                if j > 0:
                    reachable |= dp[i][j - 1]

                # Transform reachable XORs: new_xor = old_xor ^ val
                new_bits = 0
                for x in range(MAX_XOR):
                    if reachable & (1 << x):
                        new_bits |= 1 << (x ^ val)
                dp[i][j] = new_bits

        # Find the minimum reachable XOR at the bottom-right cell
        final_bits = dp[m - 1][n - 1]
        for x in range(MAX_XOR):
            if final_bits & (1 << x):
                return x
        return 0  # unreachable due to constraints
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

We use dynamic programming with a bitset to track all possible XOR values that can be achieved when reaching each cell.

- **State:** `dp[i][j]` is an integer bitmask where the `x`-th bit is `1` if XOR value `x` is reachable at cell `(i, j)`.
- **Initialization:** At `(0, 0)`, only `grid[0][0]` is reachable, so `dp[0][0] = 1 << grid[0][0]`.
- **Transition:** For each cell `(i, j)`, combine reachable XORs from the cell above `(i-1, j)` and the cell to the left `(i, j-1)`. For every reachable XOR `x`, the new XOR after stepping on `grid[i][j]` is `x ^ grid[i][j]`. We set the corresponding bit in `dp[i][j]`.
- **Result:** At the destination `(m-1, n-1)`, scan from `0` upward to find the smallest `x` whose bit is set.

Since `grid[i][j] <= 1023`, all XOR values lie in `[0, 1023]`, so a 1024-bit mask suffices.

**Time Complexity:** `O(m * n * 1024)` — at most ~1,000,000 operations given `m * n <= 1000`.  
**Space Complexity:** `O(m * n * 1024 bits)` — roughly 128 KB, well within limits.
