# 📖 Chapter 1385: Find the Distance Value Between Two Arrays (Hinglish Edition)

> **कठिनाई (Difficulty)**: Easy · **तारीख**: `2026-11-05`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/find-the-distance-value-between-two-arrays/](https://leetcode.com/problems/find-the-distance-value-between-two-arrays/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
Given two integer arrays `arr1` and `arr2`, and the integer `d`, return the distance value between the two arrays . The distance value is defined as the number of elements `arr1[i]` such that there is not any element `arr2[j]` where `|arr1[i]-arr2[j]| <= d`. Example 1: ``` Input: arr1 = [4,5,8], arr2 = [10,9,1,8], d = 2 Output: 2 Explanation: For arr1[0]=4 we have: |4-10|=6 > d=2 |4-9|=5 > d=2 |4-...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **Array**
- **Two Pointers**
- **Binary Search**
- **Sorting**

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
