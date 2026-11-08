from typing import List


class Solution:
    """
    1. Two Sum
    Difficulty: Easy
    Topics: Array, Hash Table

    Time Complexity:  O(N) — Single pass with hash table lookup.
    Space Complexity: O(N) — Hash table stores at most N elements.
    """

    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}  # complement -> index
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []


if __name__ == "__main__":
    s = Solution()
    assert s.twoSum([2, 7, 11, 15], 9) == [0, 1]
    assert s.twoSum([3, 2, 4], 6) == [1, 2]
    print("[OK] Two Sum tests passed!")
