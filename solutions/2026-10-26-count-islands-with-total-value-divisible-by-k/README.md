# 3619. Count Islands With Total Value Divisible by K

- **Date**: 2026-10-26
- **Difficulty**: Medium
- **LeetCode Link**: [https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/)
- **Tags**: `Array`, `Depth-First Search`, `Breadth-First Search`, `Union-Find`, `Matrix`

---

## Problem Description
You are given an `m x n` matrix `grid` and a positive integer `k`. An island is a group of positive integers (representing land) that are 4-directionally connected (horizontally or vertically). The total value of an island is the sum of the values of all cells in the island. Return the number of islands with a total value divisible by `k`. Example 1: Input: grid = [[0,2,1,0,0],[0,5,0,0,5],[0,0,1,0,0],[0,1,4,7,0],[0,2,0,0,8]], k = 5 Output: 2 Explanation: The grid contains four islands. The islands highlighted in blue have a total value that is divisible by 5, while the islands highlighted in red do not. Example 2: Input: grid = [[3,0,3,0], [0,3,0,3], [3,0,3,0]], k = 3 Output: 6 Explanation: The grid contains six islands, each with a total value that is divisible by 3. Constraints: `m == grid.length` `n == grid[i].length` `1 <= m, n <= 1000` `1 <= m * n <= 10 5 ` `0 <= grid[i][j] <= 10 6 ` `1 <= k <= 10 6 `

---

## Solution Code

```python
"""
LeetCode #3619: Count Islands With Total Value Divisible by K
Difficulty: Medium
URL: https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/
Tags: Array, Depth-First Search, Breadth-First Search, Union-Find, Matrix
"""

from typing import List, Optional, Dict, Set


class Solution:
    def countIslands(self, grid: List[List[int]], k: int) -> int:
        

```

---

## Explanation & Complexity
### Approach Overview

**Problem**: [Count Islands With Total Value Divisible by K](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/)  
**Difficulty**: Medium  
**Tags**: Array, Depth-First Search, Breadth-First Search, Union-Find, Matrix  

#### Intuition
This problem can be addressed by analyzing the constraints and identifying the primary invariant:
- Analyze input bounds to ensure optimal time complexity.
- Utilize standard data structures (e.g. hash maps, two pointers, or dynamic programming) to reduce quadratic searches.

#### Complexity Analysis
- **Time Complexity**: $\mathcal{O}(N)$ or $\mathcal{O}(N \log N)$ depending on sorting/traversal.
- **Space Complexity**: $\mathcal{O}(N)$ worst case for auxiliary data structures.

