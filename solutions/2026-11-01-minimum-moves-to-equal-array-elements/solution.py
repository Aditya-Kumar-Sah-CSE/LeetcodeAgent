class Solution:
    def minMoves(self, nums: list[int]) -> int:
        total = sum(nums)
        min_val = min(nums)
        return total - min_val * len(nums)
