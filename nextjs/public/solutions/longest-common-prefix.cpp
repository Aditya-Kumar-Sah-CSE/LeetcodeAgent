#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        // Edge case: empty input (not expected per constraints but safe)
        if (strs.empty()) return "";

        const string& ref = strs[0];          // reference string
        int n = strs.size();

        // Scan each character position of the reference string
        for (int i = 0; i < (int)ref.size(); ++i) {
            char c = ref[i];
            // Compare with the same position in all other strings
            for (int j = 1; j < n; ++j) {
                // If any string is shorter or has a different character, stop
                if (i >= (int)strs[j].size() || strs[j][i] != c) {
                    return ref.substr(0, i);
                }
            }
        }
        // All characters of the reference string matched; it is the LCP
        return ref;
    }
};