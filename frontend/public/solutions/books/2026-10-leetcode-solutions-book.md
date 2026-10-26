# 📚 LeetCode Solutions Master Book — October 2026 Edition

> **Author**: [Aditya Kumar Sah](https://github.com/Aditya-Kumar-Sah-CSE)  
> **Repository**: [LeetCodeAgent](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent)  
> **Format**: Interactive Online Book & PDF Printable Digest  
> **Languages**: English & Hinglish (Hindi-English)  
> **Compiled On**: `2026-10-26`

---

## 🎯 Table of Contents & Monthly Overview

| Date | ID | Title | Difficulty | Topics | Chapters & Code |
|:---|:---:|:---|:---:|:---|:---|
| **2026-10-26** | **#3619** | Count Islands With Total Value Divisible by K | 🟡 Medium | Array, DFS, BFS, Matrix | [English Chapter](../2026-10-26-count-islands-with-total-value-divisible-by-k/README.md) · [Hinglish Chapter](../2026-10-26-count-islands-with-total-value-divisible-by-k/README_HINGLISH.md) · [Python](../2026-10-26-count-islands-with-total-value-divisible-by-k/solution.py) · [PDF Sheet](../2026-10-26-count-islands-with-total-value-divisible-by-k/cheatsheet.html) |
| **2026-10-25** | **#1** | Two Sum | 🟢 Easy | Array, Hash Table | [English Chapter](../2026-10-25-two-sum/README.md) · [Hinglish Chapter](../2026-10-25-two-sum/README_HINGLISH.md) · [Python](../2026-10-25-two-sum/solution.py) · [PDF Sheet](../2026-10-25-two-sum/cheatsheet.html) |

---

# 📖 Chapter 1: 3619. Count Islands With Total Value Divisible by K

### 🇬🇧 English Synopsis
- **Problem**: Count distinct 4-directionally connected islands of positive cells whose total sum is divisible by `k`.
- **Key Concepts**: Matrix Traversal, Connected Components, In-Place Visited Invalidation (`grid[r][c] = 0`).
- **Trick to Remember**: *"Sink & Sum on Sight"* — Start an iterative DFS from any unvisited land cell, accumulate the cluster's cell weights, zero out visited cells, and check `island_sum % k == 0`.
- **Time Complexity**: $\mathcal{O}(M \times N)$
- **Space Complexity**: $\mathcal{O}(M \times N)$

### 🇮🇳 Hinglish Synopsis
- **Samajh**: Positive numbers ka cluster (island) dhoondho aur unka sum nikaalo. Agar pura sum `k` se divide ho jata hai (`sum % k == 0`), toh count badha do.
- **Trick**: Cell milte hi usse `0` bana do (taaki loop na bane), stack se pura island traverse karo, aur aakhri me `% k == 0` check kar lo!

```python
class Solution:
    def countIslands(self, grid: List[List[int]], k: int) -> int:
        if not grid or not grid[0]: return 0
        m, n, ans = len(grid), len(grid[0]), 0
        for r in range(m):
            for c in range(n):
                if grid[r][c] > 0:
                    s, st = grid[r][c], [(r, c)]
                    grid[r][c] = 0
                    while st:
                        cr, cc = st.pop()
                        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
                            nr, nc = cr+dr, cc+dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0:
                                s += grid[nr][nc]
                                grid[nr][nc] = 0
                                st.append((nr, nc))
                    if s % k == 0:
                        ans += 1
        return ans
```

---

# 📖 Chapter 2: 1. Two Sum

### 🇬🇧 English Synopsis
- **Problem**: Find indices of two numbers that add up to `target`. Exactly one solution.
- **Key Concepts**: Hash Table complement lookup ($O(1)$ amortized).
- **Trick to Remember**: *"Look back, not forward"* — Compute `target - num`. Check if this missing piece was already recorded in your seen dictionary.
- **Time Complexity**: $\mathcal{O}(N)$
- **Space Complexity**: $\mathcal{O}(N)$

### 🇮🇳 Hinglish Synopsis
- **Samajh**: Do aise numbers ke index batane hain jinko jodne par `target` mile.
- **Trick**: Aage dhundhne ki jagah peeche dekho! `diff = target - num`. Agar dictionary me hai toh turant answer mil gaya!

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
```

---

## 🚀 How to View & Download PDFs
- Every problem has its own **2-Page Modern Colorful Printable PDF** (`cheatsheet.html`).
- Open any `cheatsheet.html` in your browser and press `Ctrl + P` (or Cmd + P) to save as a colorful 2-page PDF.
- The entire book is maintained in Git under `solutions/` — zero local setup or external databases required.
