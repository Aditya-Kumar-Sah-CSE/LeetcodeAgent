# 📖 Chapter 1267: Count Servers that Communicate (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-08`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/count-servers-that-communicate/](https://leetcode.com/problems/count-servers-that-communicate/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given a map of a server center, represented as a `m * n` integer matrix `grid`, where 1 means that on that cell there is a server and 0 means that it is no server. Two servers are said to communicate if they are on the same row or on the same column. Return the number of servers that communicate with any other server. Example 1: ``` Input: grid = [[1,0],[0,1]] Output: 0 Explanation: No ser...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Depth-First Search**
- **Breadth-First Search**
- **Union-Find**
- **Matrix**
- **Counting**

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
