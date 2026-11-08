import java.util.ArrayDeque;
import java.util.Deque;

/**
 * 3619. Count Islands With Total Value Divisible by K
 * Complexity:
 * - Time:  O(M * N)
 * - Space: O(M * N)
 */
class Solution {
    public int countIslands(int[][] grid, int k) {
        if (grid == null || grid.length == 0 || grid[0].length == 0) {
            return 0;
        }

        int m = grid.length;
        int n = grid[0].length;
        int divisibleCount = 0;

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] > 0) {
                    long islandSum = grid[r][c];
                    grid[r][c] = 0; // Mark visited

                    Deque<int[]> stack = new ArrayDeque<>();
                    stack.push(new int[]{r, c});

                    while (!stack.isEmpty()) {
                        int[] curr = stack.pop();
                        int currR = curr[0];
                        int currC = curr[1];

                        for (int i = 0; i < 4; i++) {
                            int nr = currR + dr[i];
                            int nc = currC + dc[i];

                            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] > 0) {
                                islandSum += grid[nr][nc];
                                grid[nr][nc] = 0; // In-place visited marking
                                stack.push(new int[]{nr, nc});
                            }
                        }
                    }

                    if (islandSum % k == 0) {
                        divisibleCount++;
                    }
                }
            }
        }

        return divisibleCount;
    }
}
