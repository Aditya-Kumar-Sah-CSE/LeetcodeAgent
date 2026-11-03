# 📖 Chapter 3736: Minimum Moves to Equal Array Elements III (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-03`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements-iii/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements-iii/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an integer array `nums`. In one move, you may increase the value of any single element `nums[i]` by 1. Return the minimum total number of moves required so that all elements in `nums` become equal . Example 1: Input: nums = [2,1,3] Output: 3 Explanation: To make all elements equal: Increase `nums[0] = 2` by 1 to make it 3. Increase `nums[1] = 1` by 1 to make it 2. Increase `nums[1] =...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Math**

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
    def minMoves(self, nums: List[int]) -> int:
        """
        Returns the minimum number of moves to make all elements equal.
        Since we can only increment elements, the optimal target is the maximum element.
        The total moves is the sum of differences between max and each element.
        """
        max_val = max(nums)
        return sum(max_val - x for x in nums)
```
