# 📖 Chapter 3411: Maximum Subarray With Equal Products (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-24`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/maximum-subarray-with-equal-products/](https://leetcode.com/problems/maximum-subarray-with-equal-products/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an array of positive integers `nums`. An array `arr` is called product equivalent if `prod(arr) == lcm(arr) * gcd(arr)`, where: `prod(arr)` is the product of all elements of `arr`. `gcd(arr)` is the GCD of all elements of `arr`. `lcm(arr)` is the LCM of all elements of `arr`. Return the length of the longest product equivalent subarray of `nums`. Example 1: Input: nums = [1,2,1,2,1,1...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Math**
- **Sliding Window**
- **Enumeration**
- **Number Theory**

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
import math
from typing import List
from functools import reduce

class Solution:
    def maxLength(self, nums: List[int]) -> int:
        """
        A subarray is product equivalent if prod(arr) == lcm(arr) * gcd(arr).
        
        Key Insight:
        For any two numbers a and b, we know that a * b = gcd(a, b) * lcm(a, b).
        For a subarray of length 1, the condition is trivially true (x = x * x is only true if x=1, 
        but the problem asks for subarrays, and the formula prod = lcm * gcd always holds for length 1).
        For a subarray of length 2, the condition prod(a, b) = lcm(a, b) * gcd(a, b) is always true.
        For a subarray of length > 2, the condition prod(a, b, c, ...) = lcm(a, b, c, ...) * gcd(a, b, c, ...)
        is much stricter. It essentially means that the elements must be pairwise coprime 
        relative to the GCD of the whole set.
        
        Given the constraints (nums.length <= 100, nums[i] <= 10), we can use a brute-force 
        approach to check all possible subarrays.
        """
        
        def get_gcd(a, b):
            while b:
                a, b = b, a % b
            return a

        def get_lcm(a, b):
            if a == 0 or b == 0: return 0
            return abs(a * b) // get_gcd(a, b)

        n = len(nums)
        max_len = 0
        
        for i in range(n):
            current_prod = 1
            current_gcd = nums[i]
            current_lcm = nums[i]
            
            for j in range(i, n):
                val = nums[j]
                current_prod *= val
                current_gcd = get_gcd(current_gcd, val)
                current_lcm = get_lcm(current_lcm, val)
                
                # Optimization: Since nums[i] >= 1, current_prod grows quickly.
                # If current_prod exceeds a reasonable limit (lcm * gcd), 
                # it might still be equal, but since max nums[i] is 10 and n is 100,
                # we must be careful about integer overflow in other languages.
                # In Python, integers are arbitrary precision.
                
                if current_prod == current_lcm * current_gcd:
                    max_len = max(max_len, j - i + 1)
                
                # Heuristic: If current_prod becomes significantly larger than 
                # any possible LCM * GCD for the given constraints, we could break.
                # However, with N=100, O(N^2) is perfectly fine.
                
        return max_len
```
