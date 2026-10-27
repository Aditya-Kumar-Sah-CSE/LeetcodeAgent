class Solution {
public:
    long long maximizeSum(vector<int>& nums, int k) {
        long long originalSum = 0;
        vector<long long> gains;
        
        for (int num : nums) {
            originalSum += num;
            
            // Compute the maximum value by sorting digits in descending order
            string s = to_string(num);
            sort(s.begin(), s.end(), greater<char>());
            long long maxVal = stoll(s);
            
            long long gain = maxVal - num;
            if (gain > 0) {
                gains.push_back(gain);
            }
        }
        
        // Sort gains in descending order
        sort(gains.begin(), gains.end(), greater<long long>());
        
        // Take at most k largest positive gains
        long long totalGain = 0;
        int count = min(k, (int)gains.size());
        for (int i = 0; i < count; i++) {
            totalGain += gains[i];
        }
        
        return originalSum + totalGain;
    }
};