# 📖 Chapter 3619: Count Islands With Total Value Divisible by K (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **Topic**: 2D Matrix, Graph DFS/BFS · **तारीख**: `2026-10-26`  
> 🔗 **LeetCode Link**: [3619. Count Islands With Total Value Divisible by K](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab (Problem Summary)

Hume ek 2D Grid (matrix) di gayi hai aur ek integer `k` diya gaya hai.
- **Island kya hota hai?**: Wo cells jinki value positive integer (`> 0`) hai aur jo 4 directions me (Up, Down, Left, Right) aapas me jude huye hain.
- **Island Ki Total Value**: Island me aane wale sabhi cells ke numbers ka jod (sum).
- **Hume kya nikalna hai?**: Hume aise kitne islands hain jinka **total sum `k` se poora divide ho jaye** (yani `island_sum % k == 0`), unka count return karna hai!

### Example Samajhte Hain
```text
Grid:
[0, 2, 1]
[0, 0, 3]
[4, 2, 0]
k = 3

Yahan 2 alag-alag islands hain:
1. Island 1: Cells (0,1), (0,2), (1,2) jinki values hain 2 + 1 + 3 = 6.
   Kya 6, 3 se divide hota hai? Haan (6 % 3 == 0) -> Count = 1!
2. Island 2: Cells (2,0), (2,1) jinki values hain 4 + 2 = 6.
   Kya 6, 3 se divide hota hai? Haan (6 % 3 == 0) -> Count = 2!

Final Answer: 2 islands!
```

---

## 2. 🧠 Kaun-Kaun Se Topics Aane Chahiye? (Prerequisites)

1. **Matrix Ko Graph Ki Tarah Dekhna**:
   - Har ek cell `(r, c)` ek node/vertex hai.
   - Uske 4 padosi (neighbors) hote hain: `(r-1, c)`, `(r+1, c)`, `(r, c-1)`, `(r, c+1)`.
2. **DFS / BFS Traversal**:
   - Ek naye island ko poora explore karne ke liye recursion ya explicit stack use karna.
3. **Visited Cell Ko 0 Karna (In-Place Mutation)**:
   - Jaise hi kisi cell ko count kar lo, uski value ko `0` kar do taaki dubara wahan na ja sakein aur infinite loop na bane.
4. **Modulo Operator (`%`)**:
   - Check karna ki `island_sum % k == 0` hai ya nahi.

---

## 3. 💡 Main Concept (Kaise Kaam Karta Hai?)

Ye problem LeetCode ke mashhoor problem **#200 Number of Islands** ka bhai hai!
Farak sirf itna hai:
- Number of Islands me hum sirf island milne par `count++` kar dete the.
- Is problem me hume **us island ke andar jitne bhi cells hain, unki values ko sum karna hai**, aur last me check karna hai:
  $$\text{Agar } (\text{island\_sum} \% k == 0) \implies \text{answer}++$$

---

## 4. ⚡ Yaad Rakhne Ki Mast Trick (Interview Formula)

> 💡 **"Dekhte Hi Sink Karo Aur Jodte Chalo!"**:
> 1. Matrix me double loop chalao.
> 2. Jaise hi `grid[r][c] > 0` mile, samajh jao naya island shuru ho gaya!
> 3. Cell ko turant `0` bana do (sink), aur stack me daal ke DFS chalao.
> 4. Island ke sabhi padosiyo ka number `island_sum` me jodte jao aur unhe bhi `0` karte jao.
> 5. Jab stack khali ho jaye, tab check karo: `if (island_sum % k == 0) ans++`.
> 6. *Pro Tip*: Python me bada matrix hone par recursion limit error aa sakti hai, isliye **stack wala iterative DFS** sabse safe aur fast hai!

---

## 5. 🔄 All Stages Summary (Pura Safar)

| Stage | Humne Kya Kiya? | Khas Baat |
|:---|:---|:---|
| **Stage 1: Samajhna (Understand)** | Grid ka size $M \times N \le 2 \times 10^5$, values $10^6$ tak ho sakti hain. | Sum bohot bada ho sakta hai, C++/Java me `long long` lena zaroori hai. |
| **Stage 2: Topic Chunna (Research)** | Connected Components, DFS, BFS, Flood Fill. | DFS se ek baar me pura island explore ho jata hai. |
| **Stage 3: Plan Banana (Plan)** | 2 nested loops (rows aur cols). Unvisited cell milte hi traversal shuru karo aur values jodo. | In-place marking se extra space $O(1)$ rehti hai. |
| **Stage 4: Code Likhna (Code)** | Direction array `[(-1,0), (1,0), (0,-1), (0,1)]` se clean 4-directional move. | Code clean, simple aur easy to read hai. |
| **Stage 5: Test Karna (Validate)** | Saare 0 wale matrix, 1x1 matrix, aur divisible/non-divisible cases test kiye. | Dono official testcases pass huye! |
| **Stage 6: Speed & Memory (Complexity)** | Time: $O(M \times N)$ · Space: $O(M \times N)$ worst case stack. | Optimal performance, koi TLE ya Memory Limit Exceeded nahi! |

---

## 6. 💻 Complete Code (Hinglish Comments Ke Saath)

### Python 3
```python
from typing import List

class Solution:
    def countIslands(self, grid: List[List[int]], k: int) -> int:
        if not grid or not grid[0]:
            return 0

        m, n = len(grid), len(grid[0])
        divisible_islands = 0

        for r in range(m):
            for c in range(n):
                # Agar positive cell mila, to naya island mila!
                if grid[r][c] > 0:
                    island_sum = 0
                    stack = [(r, c)]
                    island_sum += grid[r][c]
                    grid[r][c] = 0  # Visit mark kar diya

                    # Iterative DFS se island ke saare cells explore karo
                    while stack:
                        curr_r, curr_c = stack.pop()
                        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                            nr, nc = curr_r + dr, curr_c + dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] > 0:
                                island_sum += grid[nr][nc]
                                grid[nr][nc] = 0  # Duplicate avoid karne ke liye turant 0 karo
                                stack.append((nr, nc))

                    # Check karo kya pura sum k se divide hota hai
                    if island_sum % k == 0:
                        divisible_islands += 1

        return divisible_islands
```

---

## 7. ⏱️ Time & Space Complexity (Speed Aur Memory)

- **Time Complexity**: $\mathcal{O}(M \times N)$  
  Matrix ke har cell par hum zyada se zyada 1 ya 2 baar jate hain. Pura matrix ek hi baar scan hota hai.
- **Space Complexity**: $\mathcal{O}(M \times N)$  
  Sirf DFS stack ka memory lagta hai worst case me jab pura matrix ek hi bada island ho. Humne koi alag se visited array nahi banaya kyunki hum matrix me hi `0` mark kar dete hain.
