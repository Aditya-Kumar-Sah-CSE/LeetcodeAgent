# 📖 Chapter 453: Minimum Moves to Equal Array Elements (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-01`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
Given an integer array `nums` of size `n`, return the minimum number of moves required to make all array elements equal . In one move, you can increment `n - 1` elements of the array by `1`. Example 1: ``` Input: nums = [1,2,3] Output: 3 Explanation: Only three moves are needed (remember each move increments two elements): [1,2,3] => [2,3,3] => [3,4,3] => [4,4,4] ``` Example 2: ``` Input: nums = [...

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
class Solution:
    def minMoves(self, nums: list[int]) -> int:
        total = sum(nums)
        min_val = min(nums)
        return total - min_val * len(nums)
```
