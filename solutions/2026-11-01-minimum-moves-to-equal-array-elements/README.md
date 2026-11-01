# 📖 Chapter 453: Minimum Moves to Equal Array Elements

> **Difficulty**: Medium · **Date**: `2026-11-01`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Given an integer array `nums` of size `n`, return the minimum number of moves required to make all array elements equal . In one move, you can increment `n - 1` elements of the array by `1`. Example 1: ``` Input: nums = [1,2,3] Output: 3 Explanation: Only three moves are needed (remember each move increments two elements): [1,2,3] => [2,3,3] => [3,4,3] => [4,4,4] ``` Example 2: ``` Input: nums = [1,1,1] Output: 0 ``` Constraints: `n == nums.length` `1 <= nums.length <= 10 5 ` `-10 9 <= nums[i] <= 10 9 ` The answer is guaranteed to fit in a 32-bit integer.

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
class Solution:
    def minMoves(self, nums: list[int]) -> int:
        total = sum(nums)
        min_val = min(nums)
        return total - min_val * len(nums)
```

---

## 7. ⏱️ Complexity Analysis
### Explanation
The key insight is that incrementing `n - 1` elements by 1 in one move is equivalent to decrementing a single element by 1 relative to the others. Therefore, the problem reduces to finding how many decrements are needed to make all elements equal. Since we can only decrease elements relative to the minimum, the optimal target value is the minimum element itself. The number of moves required for each element `x` to become equal to the minimum is `x - min`. Summing these differences over all elements gives the total number of moves: `sum(nums) - min(nums) * n`. This approach runs in O(n) time and uses O(1) extra space.
