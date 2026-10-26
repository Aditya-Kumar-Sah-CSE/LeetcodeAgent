/**
 * 3619. Count Islands With Total Value Divisible by K
 * @param {number[][]} grid
 * @param {number} k
 * @return {number}
 */
var countIslands = function (grid, k) {
  if (!grid || grid.length === 0 || grid[0].length === 0) return 0;

  const m = grid.length;
  const n = grid[0].length;
  let divisibleIslands = 0;

  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] > 0) {
        let islandSum = grid[r][c];
        grid[r][c] = 0; // In-place visited marking

        const stack = [[r, c]];

        while (stack.length > 0) {
          const [currR, currC] = stack.pop();

          for (let i = 0; i < 4; i++) {
            const nr = currR + dr[i];
            const nc = currC + dc[i];

            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] > 0) {
              islandSum += grid[nr][nc];
              grid[nr][nc] = 0;
              stack.push([nr, nc]);
            }
          }
        }

        if (islandSum % k === 0) {
          divisibleIslands++;
        }
      }
    }
  }

  return divisibleIslands;
};
