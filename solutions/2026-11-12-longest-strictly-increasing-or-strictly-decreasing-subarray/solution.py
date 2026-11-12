from typing import List

class Solution:
    def longestMonotonicSubarray(self, nums: List[int]) -> int:
        """
        Returns the length of the longest subarray that is either strictly
        increasing or strictly decreasing.
        """
        n = len(nums)
        if n == 0:
            return 0

        max_len = 1          # at least one element forms a valid subarray
        inc_len = 1          # length of current strictly increasing run
        dec_len = 1          # length of current strictly decreasing run

        for i in range(1, n):
            if nums[i] > nums[i - 1]:
                # extend increasing run, reset decreasing run
                inc_len += 1
                dec_len = 1
            elif nums[i] < nums[i - 1]:
                # extend decreasing run, reset increasing run
                dec_len += 1
                inc_len = 1
            else:
                # equal elements break both strict monotonicity
                inc_len = 1
                dec_len = 1

            max_len = max(max_len, inc_len, dec_len)

        return max_len
