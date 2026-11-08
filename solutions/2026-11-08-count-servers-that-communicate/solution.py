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
