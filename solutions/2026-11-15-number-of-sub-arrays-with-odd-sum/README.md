# 📖 Chapter 1524: Number of Sub-arrays With Odd Sum

> **Difficulty**: Medium · **Date**: `2026-11-15`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/number-of-sub-arrays-with-odd-sum/](https://leetcode.com/problems/number-of-sub-arrays-with-odd-sum/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Given an array of integers `arr`, return the number of subarrays with an odd sum . Since the answer can be very large, return it modulo `10 9 + 7`. Example 1: ``` Input: arr = [1,3,5] Output: 4 Explanation: All subarrays are [[1],[1,3],[1,3,5],[3],[3,5],[5]] All sub-arrays sum are [1,4,9,3,8,5]. Odd sums are [1,9,3,5] so the answer is 4. ``` Example 2: ``` Input: arr = [2,4,6] Output: 0 Explanation: All subarrays are [[2],[2,4],[2,4,6],[4],[4,6],[6]] All sub-arrays sum are [2,6,12,4,10,6]. All sub-arrays have even sum and the answer is 0. ``` Example 3: ``` Input: arr = [1,2,3,4,5,6,7] Output: 16 ``` Constraints: `1 <= arr.length <= 10 5 ` `1 <= arr[i] <= 100`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Math`
- `Dynamic Programming`
- `Prefix Sum`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Math, Dynamic Programming). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

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

---

## 7. ⏱️ Complexity Analysis
### Explanation

We use prefix sums and track their parity.

A subarray sum is odd if the prefix sums before and after the subarray have different parities.

- Start with prefix sum `0`, which is even, so `even = 1`.
- For each number, update the current prefix sum.
- If the current prefix sum is even, then all previous odd prefix sums form odd-sum subarrays.
- If the current prefix sum is odd, then all previous even prefix sums form odd-sum subarrays.
- Add that count to the answer, then update the parity count.

Time Complexity: `O(n)`  
Space Complexity: `O(1)`
