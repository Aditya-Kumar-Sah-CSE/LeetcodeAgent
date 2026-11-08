# 📖 Chapter 3882: Minimum XOR Path in a Grid (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-10-28`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-xor-path-in-a-grid/](https://leetcode.com/problems/minimum-xor-path-in-a-grid/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given a 2D integer array `grid` of size `m * n`. You start at the top-left cell `(0, 0)` and want to reach the bottom-right cell `(m - 1, n - 1)`. At each step, you may move either right or down . The cost of a path is defined as the bitwise XOR of all the values in the cells along that path, including the start and end cells. Return the minimum possible XOR value among all valid paths fro...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Dynamic Programming**
- **Bit Manipulation**
- **Matrix**

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
