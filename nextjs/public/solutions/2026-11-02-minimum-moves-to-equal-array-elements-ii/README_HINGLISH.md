# 📖 Chapter 462: Minimum Moves to Equal Array Elements II (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-02`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements-ii/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements-ii/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
Given an integer array `nums` of size `n`, return the minimum number of moves required to make all array elements equal . In one move, you can increment or decrement an element of the array by `1`. Test cases are designed so that the answer will fit in a 32-bit integer. Example 1: ``` Input: nums = [1,2,3] Output: 2 Explanation: Only two moves are needed (remember each move increments or decrement...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Math**
- **Sorting**

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
```
