#include <vector>
#include <stack>
#include <cassert>
#include <iostream>

using namespace std;

/**
 * 3619. Count Islands With Total Value Divisible by K
 * Complexity:
 * - Time:  O(M * N)
 * - Space: O(M * N)
 */
class Solution {
public:
    int countIslands(vector<vector<int>>& grid, int k) {
        if (grid.empty() || grid[0].empty()) return 0;

        int m = grid.size();
        int n = grid[0].size();
        int divisibleCount = 0;

        const int dr[4] = {-1, 1, 0, 0};
        const int dc[4] = {0, 0, -1, 1};

        for (int r = 0; r < m; ++r) {
            for (int c = 0; c < n; ++c) {
                if (grid[r][c] > 0) {
                    long long islandSum = grid[r][c];
                    grid[r][c] = 0; // Mark visited

                    stack<pair<int, int>> st;
                    st.push({r, c});

                    while (!st.empty()) {
                        auto [currR, currC] = st.top();
                        st.pop();

                        for (int i = 0; i < 4; ++i) {
                            int nr = currR + dr[i];
                            int nc = currC + dc[i];

                            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] > 0) {
                                islandSum += grid[nr][nc];
                                grid[nr][nc] = 0; // In-place visited marking
                                st.push({nr, nc});
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
};

int main() {
    Solution solver;
    vector<vector<int>> g1 = {{0, 2, 1}, {0, 0, 3}, {4, 2, 0}};
    assert(solver.countIslands(g1, 3) == 2);
    cout << "[OK] C++ Solution verified!" << endl;
    return 0;
}
