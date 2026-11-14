# 📖 Chapter 3364: Minimum Positive Sum Subarray 

> **Difficulty**: Easy · **Date**: `2026-11-14`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-positive-sum-subarray/](https://leetcode.com/problems/minimum-positive-sum-subarray/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an integer array `nums` and two integers `l` and `r`. Your task is to find the minimum sum of a subarray whose size is between `l` and `r` (inclusive) and whose sum is greater than 0. Return the minimum sum of such a subarray. If no such subarray exists, return -1. A subarray is a contiguous non-empty sequence of elements within an array. Example 1: Input: nums = [3, -2, 1, 4], l = 2, r = 3 Output: 1 Explanation: The subarrays of length between `l = 2` and `r = 3` where the sum is greater than 0 are: `[3, -2]` with a sum of 1 `[1, 4]` with a sum of 5 `[3, -2, 1]` with a sum of 2 `[-2, 1, 4]` with a sum of 3 Out of these, the subarray `[3, -2]` has a sum of 1, which is the smallest positive sum. Hence, the answer is 1. Example 2: Input: nums = [-2, 2, -3, 1], l = 2, r = 3 Output: -1 Explanation: There is no subarray of length between `l` and `r` that has a sum greater than 0. So, the answer is -1. Example 3: Input: nums = [1, 2, 3, 4], l = 2, r = 4 Output: 3 Explanation: The subarray `[1, 2]` has a length of 2 and the minimum sum greater than 0. So, the answer is 3. Constraints: `1 <= nums.length <= 100` `1 <= l <= r <= nums.length` `-1000 <= nums[i] <= 1000`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Sliding Window`
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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Sliding Window, Prefix Sum). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

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

---

## 7. ⏱️ Complexity Analysis
### Explanation

**Intuition:**  
Given the small constraints (`n ≤ 100`), a brute-force approach that checks every valid subarray is perfectly acceptable. We simply need to examine all subarrays whose length lies between `l` and `r` (inclusive), compute their sums, and keep track of the smallest positive sum encountered. If no such subarray yields a positive sum, we return `-1`.

To compute subarray sums efficiently without recomputing from scratch each time, we can use a **prefix sum array**. This allows us to obtain the sum of any subarray `nums[i..i+len-1]` in constant time via `prefix[i+len] - prefix[i]`.

**Algorithm:**
1. Build a prefix sum array `prefix` of length `n+1`, where `prefix[i]` is the sum of the first `i` elements.
2. Initialize `min_positive = ∞`.
3. Iterate over all possible starting indices `i` from `0` to `n-1`.
4. For each start `i`, iterate over all allowed lengths `len` from `l` to `r`.
   - If the subarray extends beyond the array bounds, break out of the inner loop.
   - Compute the sum `s = prefix[i+len] - prefix[i]`.
   - If `s > 0`, update `min_positive = min(min_positive, s)`.
5. After checking all subarrays, if `min_positive` is still `∞`, return `-1`; otherwise return `min_positive`.

**Time Complexity:**  
The outer loop runs `n` times, and the inner loop runs at most `(r - l + 1)` times. In the worst case `l=1, r=n`, the complexity is **O(n²)**. With `n ≤ 100`, the maximum number of iterations is about 10,000, which executes instantly.

**Space Complexity:**  
We use an additional array of size `n+1` for prefix sums, resulting in **O(n)** extra space. This can be reduced to O(1) by computing sums on the fly, but the prefix array is clean and well within memory limits.
