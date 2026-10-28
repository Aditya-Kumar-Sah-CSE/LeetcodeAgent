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
