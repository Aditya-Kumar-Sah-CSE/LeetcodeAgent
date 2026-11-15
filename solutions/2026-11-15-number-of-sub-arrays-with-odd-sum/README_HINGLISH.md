# 📖 Chapter 1524: Number of Sub-arrays With Odd Sum (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-11-15`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/number-of-sub-arrays-with-odd-sum/](https://leetcode.com/problems/number-of-sub-arrays-with-odd-sum/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
Given an array of integers `arr`, return the number of subarrays with an odd sum . Since the answer can be very large, return it modulo `10 9 + 7`. Example 1: ``` Input: arr = [1,3,5] Output: 4 Explanation: All subarrays are [[1],[1,3],[1,3,5],[3],[3,5],[5]] All sub-arrays sum are [1,4,9,3,8,5]. Odd sums are [1,9,3,5] so the answer is 4. ``` Example 2: ``` Input: arr = [2,4,6] Output: 0 Explanatio...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Math**
- **Dynamic Programming**
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
# YOUR SOLUTION CODE HERE
class Solution:
    def numOfSubarrays(self, arr: list[int]) -> int:
        MOD = 10**9 + 7
        
        even = 1  # prefix sum 0 is even
        odd = 0
        prefix = 0
        ans = 0
        
        for num in arr:
            prefix += num
            
            if prefix % 2 == 0:
                ans += odd
                even += 1
            else:
                ans += even
                odd += 1
                
        return ans % MOD
```
