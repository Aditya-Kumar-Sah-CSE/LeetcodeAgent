# 📖 Chapter 1385: Find the Distance Value Between Two Arrays

> **Difficulty**: Easy · **Date**: `2026-11-05`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/find-the-distance-value-between-two-arrays/](https://leetcode.com/problems/find-the-distance-value-between-two-arrays/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Given two integer arrays `arr1` and `arr2`, and the integer `d`, return the distance value between the two arrays . The distance value is defined as the number of elements `arr1[i]` such that there is not any element `arr2[j]` where `|arr1[i]-arr2[j]| <= d`. Example 1: ``` Input: arr1 = [4,5,8], arr2 = [10,9,1,8], d = 2 Output: 2 Explanation: For arr1[0]=4 we have: |4-10|=6 > d=2 |4-9|=5 > d=2 |4-1|=3 > d=2 |4-8|=4 > d=2 For arr1[1]=5 we have: |5-10|=5 > d=2 |5-9|=4 > d=2 |5-1|=4 > d=2 |5-8|=3 > d=2 For arr1[2]=8 we have: |8-10|=2 <= d=2 |8-9|=1 <= d=2 |8-1|=7 > d=2 |8-8|=0 <= d=2 ``` Example 2: ``` Input: arr1 = [1,4,2,3], arr2 = [-4,-3,6,10,20,30], d = 3 Output: 2 ``` Example 3: ``` Input: arr1 = [2,1,100,3], arr2 = [-5,-2,10,-3,7], d = 6 Output: 1 ``` Constraints: `1 <= arr1.length, arr2.length <= 500` `-1000 <= arr1[i], arr2[j] <= 1000` `0 <= d <= 100`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Array`
- `Two Pointers`
- `Binary Search`
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
| **Stage 2: Research** | Matched optimal DSA paradigm (Array, Two Pointers, Binary Search). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
class Solution:
    def findTheDistanceValue(self, arr1: list[int], arr2: list[int], d: int) -> int:
        arr2.sort()
        count = 0
        import bisect
        
        for x in arr1:
            # Find the first index in arr2 where value >= x
            idx = bisect.bisect_left(arr2, x)
            ok = True
            
            # Check the element at idx (first >= x)
            if idx < len(arr2) and arr2[idx] - x <= d:
                ok = False
            # Check the element just before idx (largest < x)
            if idx > 0 and x - arr2[idx - 1] <= d:
                ok = False
            
            if ok:
                count += 1
        
        return count
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

**Intuition**  
For each element `x` in `arr1` we need to know whether there exists *any* element `y` in `arr2` such that `|x - y| ≤ d`.  
If we sort `arr2`, the elements closest to `x` will be the one at the insertion position of `x` (the first element `≥ x`) and the element immediately before it (the largest element `< x`).  
If neither of these two candidates lies within distance `d`, then *no* element in `arr2` can be within distance `d` (because all other elements are even farther away).

**Algorithm**  
1. Sort `arr2` (O(m log m) where m = len(arr2)).  
2. For each `x` in `arr1`:  
   - Use binary search (`bisect_left`) to find the index `idx` where `x` would be inserted in `arr2`.  
   - Check `arr2[idx]` (if `idx < m`): if `arr2[idx] - x ≤ d`, then a close element exists.  
   - Check `arr2[idx-1]` (if `idx > 0`): if `x - arr2[idx-1] ≤ d`, then a close element exists.  
   - If neither condition holds, increment the answer.  
3. Return the total count.

**Correctness**  
Because `arr2` is sorted, any element `y` with `y < x` is at most `arr2[idx-1]` (the largest element smaller than `x`). If `x - arr2[idx-1] > d`, then for all `y < x` we have `x - y ≥ x - arr2[idx-1] > d`.  
Similarly, any element `y ≥ x` is at least `arr2[idx]`. If `arr2[idx] - x > d`, then for all `y ≥ x` we have `y - x ≥ arr2[idx] - x > d`.  
Thus, checking only these two neighbors is sufficient.

**Complexity Analysis**  
- Time: O(m log m + n log m) where n = len(arr1), m = len(arr2). Sorting dominates if m > n, otherwise the binary searches dominate.  
- Space: O(1) extra space (sorting is in-place, `bisect` uses O(1) space).
