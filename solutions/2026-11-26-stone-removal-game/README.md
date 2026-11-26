# 📖 Chapter 3360: Stone Removal Game

> **Difficulty**: Easy · **Date**: `2026-11-26`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/stone-removal-game/](https://leetcode.com/problems/stone-removal-game/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
Alice and Bob are playing a game where they take turns removing stones from a pile, with Alice going first . Alice starts by removing exactly 10 stones on her first turn. For each subsequent turn, each player removes exactly 1 fewer stone than the previous opponent. The player who cannot make a move loses the game. Given a positive integer `n`, return `true` if Alice wins the game and `false` otherwise. Example 1: Input: n = 12 Output: true Explanation: Alice removes 10 stones on her first turn, leaving 2 stones for Bob. Bob cannot remove 9 stones, so Alice wins. Example 2: Input: n = 1 Output: false Explanation: Alice cannot remove 10 stones, so Alice loses. Constraints: `1 <= n <= 50`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `Math`
- `Simulation`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (Math, Simulation). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
class Solution:
    def canAliceWin(self, n: int) -> bool:
        stones = n
        remove = 10
        alice_turn = True
        
        # Simulate the game turn by turn.
        while stones >= remove:
            stones -= remove
            remove -= 1
            alice_turn = not alice_turn
        
        # When the loop ends, the player whose turn it is cannot make a move and loses.
        # If it is Alice's turn, she loses; if it is Bob's turn, Alice wins.
        return not alice_turn
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

The game proceeds with a fixed sequence of removals: Alice removes 10, Bob removes 9, Alice removes 8, Bob removes 7, and so on. The player who cannot remove the required number of stones loses.

We simulate the turns directly:
- Start with `stones = n`, `remove = 10`, and `alice_turn = True`.
- While there are enough stones for the current removal, subtract the stones, decrease the required removal by 1, and switch turns.
- When the loop exits, the current player cannot move. If it is Alice's turn, she loses (`False`); if it is Bob's turn, Alice wins (`True`).

Since the removal amount starts at 10 and decreases by 1 each turn, the loop runs at most 10 times.

**Time Complexity:** O(1) — at most 10 iterations regardless of `n`.  
**Space Complexity:** O(1) — only a few integer variables are used.
