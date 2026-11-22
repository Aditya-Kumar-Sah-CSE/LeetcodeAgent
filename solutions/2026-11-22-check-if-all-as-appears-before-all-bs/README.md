# 📖 Chapter 2124: Check if All A's Appears Before All B's

> **Difficulty**: Easy · **Date**: `2026-11-22`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/check-if-all-as-appears-before-all-bs/](https://leetcode.com/problems/check-if-all-as-appears-before-all-bs/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Given a string `s` consisting of only the characters `'a'` and `'b'`, return `true` if every `'a'` appears before every `'b'` in the string . Otherwise, return `false`. Example 1: ``` Input: s = "aaabbb" Output: true Explanation: The 'a's are at indices 0, 1, and 2, while the 'b's are at indices 3, 4, and 5. Hence, every 'a' appears before every 'b' and we return true. ``` Example 2: ``` Input: s = "abab" Output: false Explanation: There is an 'a' at index 2 and a 'b' at index 1. Hence, not every 'a' appears before every 'b' and we return false. ``` Example 3: ``` Input: s = "bbb" Output: true Explanation: There are no 'a's, hence, every 'a' appears before every 'b' and we return true. ``` Constraints: `1 <= s.length <= 100` `s[i]` is either `'a'` or `'b'`.

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `String`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (String). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
class Solution:
    def checkString(self, s: str) -> bool:
        return "ba" not in s
```

---

## 7. ⏱️ Complexity Analysis
### Explanation
The problem requires checking whether all occurrences of `'a'` appear before all occurrences of `'b'` in the string. This is equivalent to ensuring that the substring `"ba"` does not exist anywhere in the string. If `"ba"` is present, it means there is a `'b'` that appears before an `'a'`, violating the condition.

- **Approach**: Use Python's substring membership check to see if `"ba"` is in `s`. If it is, return `False`; otherwise, return `True`.
- **Time Complexity**: O(n), where n is the length of the string, because the substring check scans the string once.
- **Space Complexity**: O(1), as no extra data structures are used.
