#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    /**
     * Build any grid that contains exactly one valid path from (0,0) to (m‑1,n‑1).
     * The path we create is the simple L‑shape:
     *   (0,0) → … → (m‑1,0) → … → (m‑1,n‑1)
     *
     * @param m number of rows   (1 ≤ m ≤ 25)
     * @param n number of columns(1 ≤ n ≤ 25)
     * @return vector<string> representing the grid
     */
    vector<string> createGrid(int m, int n) {
        // 1️⃣ Fill everything with obstacles '#'
        vector<string> grid(m, string(n, '#'));

        // 2️⃣ Open the first column – the vertical part of the L
        for (int i = 0; i < m; ++i) {
            grid[i][0] = '.';
        }

        // 3️⃣ Open the bottom row – the horizontal part of the L
        //    (skip column 0 because it is already '.' )
        for (int j = 1; j < n; ++j) {
            grid[m - 1][j] = '.';
        }

        return grid;
    }
};