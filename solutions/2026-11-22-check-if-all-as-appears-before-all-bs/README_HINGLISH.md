# 📖 Chapter 2124: Check if All A's Appears Before All B's (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-22`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/check-if-all-as-appears-before-all-bs/](https://leetcode.com/problems/check-if-all-as-appears-before-all-bs/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
Given a string `s` consisting of only the characters `'a'` and `'b'`, return `true` if every `'a'` appears before every `'b'` in the string . Otherwise, return `false`. Example 1: ``` Input: s = "aaabbb" Output: true Explanation: The 'a's are at indices 0, 1, and 2, while the 'b's are at indices 3, 4, and 5. Hence, every 'a' appears before every 'b' and we return true. ``` Example 2: ``` Input: s ...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **String**

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
class Solution:
    def checkString(self, s: str) -> bool:
        return "ba" not in s
```
