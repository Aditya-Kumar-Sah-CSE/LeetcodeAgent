# 📖 Chapter 3105: Longest Strictly Increasing or Strictly Decreasing Subarray (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-12`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/longest-strictly-increasing-or-strictly-decreasing-subarray/](https://leetcode.com/problems/longest-strictly-increasing-or-strictly-decreasing-subarray/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an array of integers `nums`. Return the length of the longest subarray of `nums` which is either strictly increasing or strictly decreasing . Example 1: Input: nums = [1,4,3,3,2] Output: 2 Explanation: The strictly increasing subarrays of `nums` are `[1]`, `[2]`, `[3]`, `[3]`, `[4]`, and `[1,4]`. The strictly decreasing subarrays of `nums` are `[1]`, `[2]`, `[3]`, `[3]`, `[4]`, `[3,2...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**

---

## 3. 💡 Main Concept
Optimal DSA pattern aur constraints ke anusaar solution.

---

## 4. ⚡ Yaad Rakhne Ki Mast Trick (Interview Formula)
> 💡 **Trick**:
> Problem ko step-by-step simplify karo aur extra work ko avoid karne ke liye in-place marking use karo!

---

## 5. 💻 Complete Code

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
