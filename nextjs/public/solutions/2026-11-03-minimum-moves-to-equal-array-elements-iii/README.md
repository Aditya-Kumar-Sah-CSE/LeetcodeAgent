# 📖 Chapter 3736: Minimum Moves to Equal Array Elements III

> **Difficulty**: Easy · **Date**: `2026-11-03`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements-iii/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements-iii/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an integer array `nums`. In one move, you may increase the value of any single element `nums[i]` by 1. Return the minimum total number of moves required so that all elements in `nums` become equal . Example 1: Input: nums = [2,1,3] Output: 3 Explanation: To make all elements equal: Increase `nums[0] = 2` by 1 to make it 3. Increase `nums[1] = 1` by 1 to make it 2. Increase `nums[1] = 2` by 1 to make it 3. Now, all elements of `nums` are equal to 3. The minimum total moves is `3`. Example 2: Input: nums = [4,4,5] Output: 2 Explanation: To make all elements equal: Increase `nums[0] = 4` by 1 to make it 5. Increase `nums[1] = 4` by 1 to make it 5. Now, all elements of `nums` are equal to 5. The minimum total moves is `2`. Constraints: `1 <= nums.length <= 100` `1 <= nums[i] <= 100`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Math`

---

## 3. 💡 Core Concept Used
Optimal algorithmic pattern matching the problem constraints.

---

## 4. ⚡ Trick to Remember (Interview Intuition)
> 💡 **Mental Model**:
> Break down the problem using optimal state invariants and in-place transformations to eliminate duplicate work.

---

## 5. 🔄 All Stages Summary
| Stage | Details |
|:---|:---|
| **Stage 1: Understand** | Analyzed constraints and target guarantees. |
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Math). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
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
```

---

## 7. ⏱️ Complexity Analysis
### Explanation
**Approach & Intuition**  
We can only increase elements by 1 per move. To make all elements equal with the fewest moves, we should raise every element to the current maximum value in the array. Choosing any value larger than the maximum would require extra moves for every element, which is suboptimal. Therefore, the minimum total moves is simply the sum of `(max(nums) - nums[i])` for all `i`.

**Algorithm**  
1. Find the maximum value `max_val` in `nums`.  
2. Compute the sum of `max_val - x` for each `x` in `nums`.  
3. Return this sum.

**Time Complexity**  
O(n), where n is the length of `nums`. We traverse the array once to find the maximum and once to compute the sum (or combine into a single pass).

**Space Complexity**  
O(1) extra space (only a few variables).
