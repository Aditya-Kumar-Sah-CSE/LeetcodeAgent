class Solution:
    def minMoves2(self, nums: list[int]) -> int:
        # Sort the array to easily access the median
        nums.sort()
        # The median minimizes the sum of absolute deviations
        median = nums[len(nums) // 2]
        # Sum the absolute differences to the median
        moves = 0
        for x in nums:
            moves += abs(x - median)
        return moves
