# 📖 Chapter 1: Two Sum

> **Difficulty**: Easy · **Category**: Hash Table / Array · **Date**: `2026-10-25`  
> 🔗 **LeetCode Link**: [1. Two Sum](https://leetcode.com/problems/two-sum/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.
- Exactly one valid answer exists.
- You may not use the same element twice.
- You can return the answer in any order.

### Example
```text
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 2 + 7 == 9, so return [0, 1].
```

---

## 2. 🧠 Topics You Need to Know (Prerequisites)

1. **Hash Table Lookup**: $O(1)$ average time key-value retrieval.
2. **Complement Calculation**: $\text{complement} = \text{target} - \text{current\_number}$.
3. **One-Pass Invariant**: Checking for the complement before inserting current number prevents self-pairing.

---

## 3. 💡 Core Concept Used

Instead of checking every pair with nested loops ($O(N^2)$ brute force), transform the condition:
$$a + b = \text{target} \iff b = \text{target} - a$$
Store each number's index in a hash map as we scan the array. When processing `num`, check if `target - num` already exists in our map.

---

## 4. ⚡ Trick to Remember (Interview Intuition)

> 💡 **"Remember the Complement":**
> Don't look forward for the match — look backwards! Ask: *"Did I already meet the missing puzzle piece `target - num` earlier?"* If yes, return both indices immediately!

---

## 5. 🔄 All Stages Summary

| Stage | Activity | Key Decision / Output |
|:---|:---|:---|
| **Stage 1: Understand** | Parse constraints: $2 \le N \le 10^4$. Exactly one solution. | $O(N^2)$ will pass but $O(N)$ is interview expected. |
| **Stage 2: Research** | Hash Table lookup vs Sorting Two Pointers. | Hash Map preserves original indices without sorting overhead. |
| **Stage 3: Plan** | Single-pass hash map: check `target - num in seen`. | Insert after lookup to handle duplicates cleanly. |
| **Stage 4: Code** | Implement in Python, C++, Java. | Concise, readable dictionary implementation. |
| **Stage 5: Validate** | Tested negatives, duplicates (`[3,3], target=6`). | All passed. |
| **Stage 6: Complexity** | Time: $O(N)$, Space: $O(N)$. | Optimal. |

---

## 6. 💻 Complete Code

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
```
