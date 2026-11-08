from typing import List

class Solution:
    def minMoves(self, nums: List[int]) -> int:
        """
        Returns the minimum number of moves to make all elements equal.
        Since we can only increment elements, the optimal target is the maximum element.
        The total moves is the sum of differences between max and each element.
        """
        max_val = max(nums)
        return sum(max_val - x for x in nums)
