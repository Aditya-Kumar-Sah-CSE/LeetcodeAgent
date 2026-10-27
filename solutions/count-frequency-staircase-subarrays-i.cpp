#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    // The judge expects the method name to be 'countStaircase'
    int countStaircase(vector<int>& nums) {
        int n = nums.size();
        long long ans = 0; // Use long long for safety during accumulation, cast to int at return

        for (int i = 0; i < n; ++i) {
            unordered_map<int, int> freq;   // value -> current frequency
            unordered_map<int, int> pos;    // value -> 1-based position of first appearance
            vector<int> order;             // values in order of first appearance
            int wrong = 0;                 // number of distinct values whose frequency is wrong

            for (int j = i; j < n; ++j) {
                int val = nums[j];
                auto it = freq.find(val);

                if (it == freq.end()) { // new distinct value
                    int k = (int)order.size() + 1; // its position (1-based)
                    order.push_back(val);
                    pos[val] = k;
                    freq[val] = 1;
                    // A new value starts with frequency 1.
                    // It is correct only if it is the 1st distinct value (k==1).
                    // If k > 1, it is immediately "wrong" because freq(1) != k.
                    if (k != 1) ++wrong; 
                } else { // existing value
                    int oldFreq = it->second;
                    int newFreq = oldFreq + 1;
                    int k = pos[val]; // required frequency for this value

                    // Update 'wrong' count based on transition
                    if (oldFreq == k && newFreq != k) ++wrong;   // was correct, now wrong
                    else if (oldFreq != k && newFreq == k) --wrong; // was wrong, now correct

                    it->second = newFreq;
                }

                if (wrong == 0) ++ans; // current subarray nums[i...j] is a staircase

                // Early termination optimization:
                // If the most recently added distinct value (the last one in 'order')
                // has a frequency greater than its required position, it can never
                // become correct again (since frequency only increases).
                // Thus, no longer subarrays starting at i can be valid.
                if (!order.empty()) {
                    int lastVal = order.back();
                    if (freq[lastVal] > pos[lastVal]) break;
                }
            }
        }

        return (int)ans;
    }
};