# 📖 Chapter 3105: Longest Strictly Increasing or Strictly Decreasing Subarray

> **Difficulty**: Easy · **Date**: `2026-11-12`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/longest-strictly-increasing-or-strictly-decreasing-subarray/](https://leetcode.com/problems/longest-strictly-increasing-or-strictly-decreasing-subarray/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an array of integers `nums`. Return the length of the longest subarray of `nums` which is either strictly increasing or strictly decreasing . Example 1: Input: nums = [1,4,3,3,2] Output: 2 Explanation: The strictly increasing subarrays of `nums` are `[1]`, `[2]`, `[3]`, `[3]`, `[4]`, and `[1,4]`. The strictly decreasing subarrays of `nums` are `[1]`, `[2]`, `[3]`, `[3]`, `[4]`, `[3,2]`, and `[4,3]`. Hence, we return `2`. Example 2: Input: nums = [3,3,3,3] Output: 1 Explanation: The strictly increasing subarrays of `nums` are `[3]`, `[3]`, `[3]`, and `[3]`. The strictly decreasing subarrays of `nums` are `[3]`, `[3]`, `[3]`, and `[3]`. Hence, we return `1`. Example 3: Input: nums = [3,2,1] Output: 3 Explanation: The strictly increasing subarrays of `nums` are `[3]`, `[2]`, and `[1]`. The strictly decreasing subarrays of `nums` are `[3]`, `[2]`, `[1]`, `[3,2]`, `[2,1]`, and `[3,2,1]`. Hence, we return `3`. Constraints: `1 <= nums.length <= 50` `1 <= nums[i] <= 50`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
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
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

We scan the array once while maintaining two counters:
- `inc_len`: length of the current strictly increasing contiguous subarray ending at the current index.
- `dec_len`: length of the current strictly decreasing contiguous subarray ending at the current index.

For each adjacent pair `nums[i-1]` and `nums[i]`:
1. If `nums[i] > nums[i-1]`, the increasing run continues (`inc_len += 1`) and the decreasing run must restart (`dec_len = 1`).
2. If `nums[i] < nums[i-1]`, the decreasing run continues (`dec_len += 1`) and the increasing run restarts (`inc_len = 1`).
3. If `nums[i] == nums[i-1]`, strict monotonicity is broken for both, so both counters reset to `1`.

After each step, we update the global answer with the maximum of `inc_len` and `dec_len`. Since every element alone is a valid subarray of length 1, the answer is initialized to `1`.

**Time Complexity:** O(n), where n is the length of `nums`, because we traverse the array once.  
**Space Complexity:** O(1), using only a few integer variables.
