# 📖 Chapter 462: Minimum Moves to Equal Array Elements II

> **Difficulty**: Medium · **Date**: `2026-11-02`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-moves-to-equal-array-elements-ii/](https://leetcode.com/problems/minimum-moves-to-equal-array-elements-ii/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Given an integer array `nums` of size `n`, return the minimum number of moves required to make all array elements equal . In one move, you can increment or decrement an element of the array by `1`. Test cases are designed so that the answer will fit in a 32-bit integer. Example 1: ``` Input: nums = [1,2,3] Output: 2 Explanation: Only two moves are needed (remember each move increments or decrements one element): [ 1 ,2,3] => [2,2, 3 ] => [2,2,2] ``` Example 2: ``` Input: nums = [1,10,2,9] Output: 16 ``` Constraints: `n == nums.length` `1 <= nums.length <= 10 5 ` `-10 9 <= nums[i] <= 10 9 `

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Math`
- `Sorting`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Math, Sorting). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

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

---

## 7. ⏱️ Complexity Analysis
### Explanation
To make all elements equal with the minimum number of increment/decrement moves, we need to minimize the sum of absolute differences between each element and the target value.  

**Key Insight**  
The median of a set of numbers minimizes the sum of absolute deviations. Therefore, choosing the median (any median works for an even‑length array) as the target value yields the optimal result.

**Algorithm**
1. **Sort** the array – O(n log n) time.  
2. **Select** the median, which is the element at index `n // 2` after sorting.  
3. **Compute** the total moves as the sum of `abs(num - median)` for all numbers.

**Correctness Proof Sketch**  
- Let `m` be the median. For any other value `t`, consider the sorted array `a₁ ≤ a₂ ≤ … ≤ aₙ`.  
- The function `f(t) = Σ |a_i - t|` is convex and piecewise linear, with its minimum occurring where the derivative changes sign – exactly at a median.  
- Hence `f(m) ≤ f(t)` for any `t`, meaning the moves required when targeting the median are minimal.

**Complexity Analysis**  
- **Time:** Sorting dominates → **O(n log n)**.  
- **Space:** In‑place sort uses **O(1)** extra space (ignoring Python’s internal sort storage).

This solution meets the required constraints and efficiently computes the minimum moves.
