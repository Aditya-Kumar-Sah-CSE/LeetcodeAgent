# 📖 Chapter 2914: Minimum Number of Changes to Make Binary String Beautiful

> **Difficulty**: Medium · **Date**: `2026-11-18`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/minimum-number-of-changes-to-make-binary-string-beautiful/](https://leetcode.com/problems/minimum-number-of-changes-to-make-binary-string-beautiful/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given a 0-indexed binary string `s` having an even length. A string is beautiful if it's possible to partition it into one or more substrings such that: Each substring has an even length . Each substring contains only `1`'s or only `0`'s. You can change any character in `s` to `0` or `1`. Return the minimum number of changes required to make the string `s` beautiful . Example 1: ``` Input: s = "1001" Output: 2 Explanation: We change s[1] to 1 and s[3] to 0 to get string "1100". It can be seen that the string "1100" is beautiful because we can partition it into "11|00". It can be proven that 2 is the minimum number of changes needed to make the string beautiful. ``` Example 2: ``` Input: s = "10" Output: 1 Explanation: We change s[1] to 1 to get string "11". It can be seen that the string "11" is beautiful because we can partition it into "11". It can be proven that 1 is the minimum number of changes needed to make the string beautiful. ``` Example 3: ``` Input: s = "0000" Output: 0 Explanation: We don't need to make any changes as the string "0000" is beautiful already. ``` Constraints: `2 <= s.length <= 10 5 ` `s` has an even length. `s[i]` is either `'0'` or `'1'`.

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
    def minChanges(self, s: str) -> int:
        """
        Returns the minimum number of character changes required to make the binary string beautiful.
        A string is beautiful if it can be partitioned into even-length substrings of all '0's or all '1's.
        The optimal strategy is to consider each consecutive pair of characters (since any even-length
        uniform block can be split into length-2 uniform blocks). For each pair, if the two characters
        differ, we need exactly one change to make them equal (either "00" or "11").
        """
        changes = 0
        # Iterate over the string in steps of 2
        for i in range(0, len(s), 2):
            if s[i] != s[i + 1]:
                changes += 1
        return changes
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

**Intuition & Approach**  
A beautiful string can be partitioned into substrings of even length where each substring consists entirely of `0`s or entirely of `1`s. Notice that any such substring of even length can be further divided into blocks of length 2 that are also uniform (e.g., `0000` → `00|00`, `1111` → `11|11`). Therefore, the whole string is beautiful **iff** every consecutive pair of characters (positions `0-1`, `2-3`, `4-5`, …) can be made into either `00` or `11`.

For a given pair:
- If it is already `00` or `11`, no change is needed.
- If it is `01` or `10`, we can change exactly one character to make it uniform (e.g., `01` → `00` or `11`).

Thus, the minimum number of changes is simply the count of pairs where the two characters differ.

**Algorithm**
1. Initialize `changes = 0`.
2. Loop over the string with step size 2 (i.e., `i = 0, 2, 4, …`).
3. For each `i`, if `s[i] != s[i+1]`, increment `changes`.
4. Return `changes`.

**Correctness Proof**  
We prove that the algorithm returns the minimum number of changes.

*Lemma*: Any beautiful string can be partitioned into length-2 blocks that are each `00` or `11`.  
*Proof*: Take a beautiful partition. Each part has even length and is all `0`s or all `1`s. Split each part into length-2 blocks; each block inherits the same character, so it is `00` or `11`. ∎

*Lemma*: For a single length-2 block, the minimum changes to make it `00` or `11` is `0` if the two characters are equal, else `1`.  
*Proof*: If equal, it's already `00` or `11`. If different (`01` or `10`), changing either character yields `00` or `11`; one change is necessary and sufficient. ∎

Since the blocks are disjoint and cover the whole string, changes in one block do not affect others. By the lemmas, the sum of per-block minima is the global minimum. The algorithm computes exactly this sum.

**Complexity Analysis**  
- **Time Complexity**: O(n), where n = len(s). We traverse the string once.
- **Space Complexity**: O(1). Only a few integer variables are used.
