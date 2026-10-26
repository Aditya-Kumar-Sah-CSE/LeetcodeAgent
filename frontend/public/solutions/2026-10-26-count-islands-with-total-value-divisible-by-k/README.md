# 📖 Chapter 3619: Count Islands With Total Value Divisible by K

> **Difficulty**: Medium · **Category**: Graph Traversal / Matrix · **Date**: `2026-10-26`  
> 🔗 **LeetCode Link**: [3619. Count Islands With Total Value Divisible by K](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective

You are given an `m x n` integer grid `grid` and a positive integer `k`.
- An **island** is a group of positive integers (`> 0`) that are connected **4-directionally** (horizontal or vertical).
- The **total value** of an island is the algebraic sum of all numbers located on its land cells.
- **Your Goal**: Count and return how many distinct islands have a total value that is exactly **divisible by `k`** (i.e., `total_value % k == 0`).

### Example 1
```text
Input: grid = [[0, 2, 1],
               [0, 0, 3],
               [4, 2, 0]], k = 3
Output: 2
Explanation:
- Island 1: Cells at (0,1), (0,2), (1,2) with values 2 + 1 + 3 = 6. 6 % 3 == 0 (Valid!)
- Island 2: Cells at (2,0), (2,1) with values 4 + 2 = 6. 6 % 3 == 0 (Valid!)
Total islands divisible by 3 = 2.
```

### Constraints
- `m == grid.length`, `n == grid[0].length`
- `1 <= m, n <= 1000`
- `1 <= m * n <= 2 * 10^5`
- `0 <= grid[i][j] <= 10^6`
- `1 <= k <= 10^9`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)

1. **2D Grid as an Implicit Graph**:
   - Each cell `(r, c)` is a vertex.
   - Edges exist between `(r, c)` and its 4 cardinal neighbors: `(r-1, c)`, `(r+1, c)`, `(r, c-1)`, `(r, c+1)`.
2. **Connected Components Traversal (DFS or BFS)**:
   - Discovering all nodes belonging to the same isolated cluster.
3. **In-Place Visited Invalidation**:
   - Marking processed cells (setting `grid[r][c] = 0`) avoids allocating an additional `O(M * N)` boolean array and eliminates duplicate counts.
4. **Modulo Arithmetic**:
   - Checking divisibility using `sum % k == 0`. Note that the sum can exceed $32$-bit limits in languages like C++/Java, so use `long long` / `long`.

---

## 3. 💡 Core Concept Used

This problem is a direct extension of classic **Number of Islands (LeetCode #200)**.
Instead of just counting islands, we must **accumulate the sum** of each island's vertices:

$$\text{Total Value}(\text{Island}) = \sum_{(r, c) \in \text{Island}} \text{grid}[r][c]$$

For each unvisited positive cell `(r, c)`, we initiate an iterative **Depth-First Search (DFS)**:
1. Initialize `island_sum = 0`.
2. As we traverse each land cell, add its value to `island_sum` and mutate the cell to `0` (or `-1`) so it is never revisited.
3. When the traversal terminates, test `if (island_sum % k == 0) count++`.

---

## 4. ⚡ Trick to Remember (Interview Intuition)

> 💡 **"Sink & Sum on Sight"**:
> - Whenever you encounter any cell `> 0`, you have just struck a brand-new island!
> - Immediately sink/zero out the cell as you pop it from your stack to prevent infinite cycles.
> - Accumulate the weights. When the component finishes, ask: *Does `sum % k == 0`?* If yes, increment the tally.
> - Use an **explicit stack** instead of system recursion to avoid `RecursionError` on large $1000 \times 1000$ grids.

---

## 5. 🔄 All Stages Summary (Agent Reasoning Lifecycle)

| Stage | Activity | Key Decision / Output |
|:---|:---|:---|
| **Stage 1: Understand** | Parse inputs, constraints, edge cases | $M \times N \le 200,000$. Values up to $10^6$ can sum up to $2 \times 10^{11}$, necessitating 64-bit integers in C++/Java. |
| **Stage 2: Research** | Identify algorithmic paradigms | Graph Connected Components, Flood Fill, DFS/BFS. |
| **Stage 3: Plan** | Formulate traversal and state mutation | Iterate row by row. If `grid[r][c] > 0`, run iterative DFS with accumulator. Sink cells to 0. |
| **Stage 4: Code** | Implement clean, modular code | Implement standard cardinal direction vectors `[(-1,0), (1,0), (0,-1), (0,1)]`. |
| **Stage 5: Validate** | Dry run on examples & edge cases | Tested with all 0s, single cell grids, prime `k`, and multiple disconnected islands. |
| **Stage 6: Complexity** | Formal mathematical proofs | **Time**: $O(M \times N)$ · **Space**: $O(M \times N)$ auxiliary worst-case stack. |

---

## 6. 💻 Complete Solution Code

### Python 3
```python
from typing import List

class Solution:
    def countIslands(self, grid: List[List[int]], k: int) -> int:
        if not grid or not grid[0]:
            return 0

        m, n = len(grid), len(grid[0])
        divisible_island_count = 0

        for r in range(m):
            for c in range(n):
                if grid[r][c] > 0:
                    island_sum = 0
                    stack = [(r, c)]
                    island_sum += grid[r][c]
                    grid[r][c] = 0  # In-place sink

                    while stack:
                        curr_r, curr_c = stack.pop()
                        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            nr, nc = curr_r + dr, curr_c + dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0:
                                island_sum += grid[nr][nc]
                                grid[nr][nc] = 0
                                stack.append((nr, nc))

                    if island_sum % k == 0:
                        divisible_island_count += 1

        return divisible_island_count
```

### C++
```cpp
class Solution {
public:
    int countIslands(vector<vector<int>>& grid, int k) {
        int m = grid.size(), n = grid[0].size(), ans = 0;
        const int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};

        for (int r = 0; r < m; ++r) {
            for (int c = 0; c < n; ++c) {
                if (grid[r][c] > 0) {
                    long long sum = grid[r][c];
                    grid[r][c] = 0;
                    stack<pair<int, int>> st;
                    st.push({r, c});

                    while (!st.empty()) {
                        auto [cr, cc] = st.top(); st.pop();
                        for (int i = 0; i < 4; ++i) {
                            int nr = cr + dr[i], nc = cc + dc[i];
                            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] > 0) {
                                sum += grid[nr][nc];
                                grid[nr][nc] = 0;
                                st.push({nr, nc});
                            }
                        }
                    }
                    if (sum % k == 0) ans++;
                }
            }
        }
        return ans;
    }
};
```

---

## 7. ⏱️ Complexity Analysis

- **Time Complexity**: $\mathcal{O}(M \times N)$  
  Every cell in the matrix is examined at most once during the outer double loop. Cells belonging to an island are visited and immediately zeroed, ensuring no cell is pushed to the stack more than once. Total time is strictly linear in the number of matrix elements.
- **Space Complexity**: $\mathcal{O}(M \times N)$ in worst-case  
  Using an explicit DFS stack takes space proportional to the largest island size, which is at most $M \times N$. No secondary visited matrix is allocated.
