# 📖 Chapter 1: Two Sum (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **Topic**: Array, Hash Map · **तारीख**: `2026-10-25`  
> 🔗 **LeetCode Link**: [1. Two Sum](https://leetcode.com/problems/two-sum/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab

Hume ek numbers ki array `nums` aur ek `target` sum diya gaya hai.
Hume array me se aise **do numbers ke indices (positions)** batane hain jinko jodne par `target` ke barabar aa jaye!

### Example:
```text
nums = [2, 7, 11, 15], target = 9
- 2 aur 7 milke 9 bante hain (nums[0] + nums[1] = 9)
Output: [0, 1]
```

---

## 2. 🧠 Kaun-Kaun Se Topics Aane Chahiye?

1. **Hash Table (Dictionary / Map)**: Kisi bhi value ko $O(1)$ constant time me search karne ke liye.
2. **Complement Logic**: `Zaroori Number = target - current_number`.

---

## 3. 💡 Main Concept

Agar hum do nested loop chalayein ($O(N^2)$), toh time lagta hai.
Iska smart tarika:
- Jab hum kisi number `x` par hain, hume bas ye dekhna hai ki kya humne pehle `target - x` dekha hai?
- Agar dekha hai, toh wahi dono hamara answer hain!
- Agar nahi dekha, toh `x` ko uske index ke sath dictionary me save kar lo.

---

## 4. ⚡ Yaad Rakhne Ki Mast Trick

> 💡 **"Aage Mat Dekho, Peeche Dekho!"**:
> Aage dhundhne ki bajaye socho: *"Kya iska partner pehle aa chuka hai?"*
> `complement = target - num`. Agar `seen` map me complement hai, toh instant return karo!

---

## 5. 🔄 All Stages Summary

- **Stage 1**: $2 \le N \le 10^4$, exactly ek solution hamesha hoga.
- **Stage 2**: Hash Map select kiya.
- **Stage 3**: Single-pass loop with dictionary lookup.
- **Stage 4**: Clean 6-line code.
- **Stage 5**: Edge cases tested (negative numbers, repeated numbers).
- **Stage 6**: Time: $O(N)$, Space: $O(N)$.

---

## 6. 💻 Python Code

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
```
