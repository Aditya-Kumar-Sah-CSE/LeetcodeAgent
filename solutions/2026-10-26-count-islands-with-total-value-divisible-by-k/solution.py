from typing import List


class Solution:
    """
    3619. Count Islands With Total Value Divisible by K
    Difficulty: Medium
    Topics: Array, Depth-First Search, Breadth-First Search, Matrix

    Time Complexity:  O(M * N) — Every cell is visited at most a constant number of times.
    Space Complexity: O(M * N) — Iterative DFS stack in the worst-case (all connected land).
    """

    def countIslands(self, grid: List[List[int]], k: int) -> int:
        if not grid or not grid[0]:
            return 0

        m, n = len(grid), len(grid[0])
        divisible_island_count = 0

        for r in range(m):
            for c in range(n):
                # When we encounter an unvisited land cell (value > 0), explore its island
                if grid[r][c] > 0:
                    island_sum = 0
                    stack = [(r, c)]
                    island_sum += grid[r][c]
                    grid[r][c] = 0  # Mark visited in-place to avoid re-traversal

                    while stack:
                        curr_r, curr_c = stack.pop()
                        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            nr, nc = curr_r + dr, curr_c + dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0:
                                island_sum += grid[nr][nc]
                                grid[nr][nc] = 0  # Mark visited immediately
                                stack.append((nr, nc))

                    # Check if the entire island's accumulated sum is divisible by k
                    if island_sum % k == 0:
                        divisible_island_count += 1

        return divisible_island_count


if __name__ == "__main__":
    solver = Solution()

    # Testcase 1
    g1 = [[0, 2, 1], [0, 0, 3], [4, 2, 0]]
    k1 = 3
    ans1 = solver.countIslands(g1, k1)
    assert ans1 == 2, f"Expected 2, got {ans1}"

    # Testcase 2
    g2 = [[1, 1], [1, 1]]
    k2 = 5
    ans2 = solver.countIslands(g2, k2)
    assert ans2 == 0, f"Expected 0, got {ans2}"

    print("[OK] All test cases passed for LeetCode #3619!")
