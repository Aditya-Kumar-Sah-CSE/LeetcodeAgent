# 📖 Chapter 3364: Minimum Positive Sum Subarray  (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-14`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-positive-sum-subarray/](https://leetcode.com/problems/minimum-positive-sum-subarray/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an integer array `nums` and two integers `l` and `r`. Your task is to find the minimum sum of a subarray whose size is between `l` and `r` (inclusive) and whose sum is greater than 0. Return the minimum sum of such a subarray. If no such subarray exists, return -1. A subarray is a contiguous non-empty sequence of elements within an array. Example 1: Input: nums = [3, -2, 1, 4], l = 2...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Sliding Window**
- **Prefix Sum**

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
```
