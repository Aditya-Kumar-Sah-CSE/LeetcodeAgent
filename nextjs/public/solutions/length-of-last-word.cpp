#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // Returns the length of the last word in the given string s.
    int lengthOfLastWord(string s) {
        int i = static_cast<int>(s.size()) - 1;   // start from the last character

        // Skip any trailing spaces
        while (i >= 0 && s[i] == ' ') {
            --i;
        }

        // Count characters of the last word
        int len = 0;
        while (i >= 0 && s[i] != ' ') {
            ++len;
            --i;
        }

        return len;
    }
};