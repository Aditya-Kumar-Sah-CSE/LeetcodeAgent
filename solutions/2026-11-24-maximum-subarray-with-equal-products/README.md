# 📖 Chapter 3411: Maximum Subarray With Equal Products

> **Difficulty**: Easy · **Date**: `2026-11-24`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/maximum-subarray-with-equal-products/](https://leetcode.com/problems/maximum-subarray-with-equal-products/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an array of positive integers `nums`. An array `arr` is called product equivalent if `prod(arr) == lcm(arr) * gcd(arr)`, where: `prod(arr)` is the product of all elements of `arr`. `gcd(arr)` is the GCD of all elements of `arr`. `lcm(arr)` is the LCM of all elements of `arr`. Return the length of the longest product equivalent subarray of `nums`. Example 1: Input: nums = [1,2,1,2,1,1,1] Output: 5 Explanation: The longest product equivalent subarray is `[1, 2, 1, 1, 1]`, where `prod([1, 2, 1, 1, 1]) = 2`, `gcd([1, 2, 1, 1, 1]) = 1`, and `lcm([1, 2, 1, 1, 1]) = 2`. Example 2: Input: nums = [2,3,4,5,6] Output: 3 Explanation: The longest product equivalent subarray is `[3, 4, 5].` Example 3: Input: nums = [1,2,3,1,4,5,1] Output: 5 Constraints: `2 <= nums.length <= 100` `1 <= nums[i] <= 10`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Math`
- `Sliding Window`
- `Enumeration`
- `Number Theory`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Math, Sliding Window). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

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

---

## 7. ⏱️ Complexity Analysis
### Explanation

#### Intuition
The problem asks for the longest subarray where the product of all elements equals the product of their Least Common Multiple (LCM) and Greatest Common Divisor (GCD). 

Mathematically, for two numbers $a$ and $b$, the identity $a \cdot b = \text{lcm}(a, b) \cdot \text{gcd}(a, b)$ always holds. For more than two numbers, this is generally not true. For example, if we have $[2, 4, 8]$, the product is $64$, the GCD is $2$, and the LCM is $8$. $64 \neq 8 \cdot 2$. However, for $[2, 3, 5]$, the product is $30$, the GCD is $1$, and the LCM is $30$. $30 = 30 \cdot 1$.

#### Approach
Given the small constraints ($N \le 100$ and $\text{nums}[i] \le 10$), an $O(N^2)$ approach is highly efficient. We iterate through every possible starting index $i$ and every possible ending index $j$. For each subarray $[i, j]$, we maintain the running product, running GCD, and running LCM.

1.  **Outer Loop**: Iterate $i$ from $0$ to $n-1$.
2.  **Inner Loop**: Iterate $j$ from $i$ to $n-1$.
3.  **Update**:
    - $\text{prod} = \text{prod} \times \text{nums}[j]$
    - $\text{gcd} = \text{gcd}(\text{gcd}, \text{nums}[j])$
    - $\text{lcm} = \text{lcm}(\text{lcm}, \text{nums}[j])$
4.  **Check**: If $\text{prod} == \text{lcm} \times \text{gcd}$, update the maximum length found so far.

#### Complexity Analysis
- **Time Complexity**: $O(N^2 \cdot \log(\max(\text{nums})))$. We have two nested loops iterating over the array. Inside the loop, we perform GCD and LCM calculations, which take logarithmic time relative to the values of the numbers. Since the values are small ($\le 10$), this is very fast.
- **Space Complexity**: $O(1)$. We only use a few variables to track the current product, GCD, LCM, and the maximum length.

#### Maximum Possible LCM
The maximum possible LCM for numbers between 1 and 10 is the LCM of $\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\}$, which is $2520$. The product can grow much larger, but Python handles arbitrary precision integers, so overflow is not an issue.
