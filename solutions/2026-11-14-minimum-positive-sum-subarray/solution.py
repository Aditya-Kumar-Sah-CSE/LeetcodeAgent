from typing import List

class Solution:
    def minimumSumSubarray(self, nums: List[int], l: int, r: int) -> int:
        n = len(nums)
        # Build prefix sum array
        prefix = [0] * (n + 1)
        for i in range(n):
            prefix[i + 1] = prefix[i] + nums[i]
        
        min_positive = float('inf')
        # Check every possible starting index
        for i in range(n):
            # Check every allowed length
            for length in range(l, r + 1):
                if i + length > n:
                    break
                current_sum = prefix[i + length] - prefix[i]
                if current_sum > 0:
                    min_positive = min(min_positive, current_sum)
        
        return min_positive if min_positive != float('inf') else -1
