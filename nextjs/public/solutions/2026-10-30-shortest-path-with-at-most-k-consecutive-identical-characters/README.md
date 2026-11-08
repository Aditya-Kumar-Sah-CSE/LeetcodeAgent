# 📖 Chapter 3970: Shortest Path With At Most K Consecutive Identical Characters

> **Difficulty**: Medium · **Date**: `2026-10-30`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/shortest-path-with-at-most-k-consecutive-identical-characters/](https://leetcode.com/problems/shortest-path-with-at-most-k-consecutive-identical-characters/)  
> 📄 **Cheat Sheet PDF**: [Download 2-Page Colorful PDF](./cheatsheet.html) · [View Hinglish Version](./README_HINGLISH.md)

---

## 1. 🎯 Problem Statement & Objective
You are given an integer `n` representing the number of nodes in a directed weighted graph, numbered from 0 to `n - 1`. This is represented by a 2D integer array `edges`, where `edges[i] = [u i , v i , w i ]` represents a directed edge from node `u i ` to node `v i ` with weight `w i `. You are also given a string `labels` of length `n`, where `labels[i]` is the character assigned to node `i`, and an integer `k`. Return the minimum total edge weight of a path from node 0 to node `n - 1` such that the concatenation of the labels of the nodes along the path contains at most `k` consecutive identical characters. If no valid path exists, return -1. Example 1: Input: n = 3, edges = [[0,1,1],[1,2,1],[0,2,3]], labels = "aab", k = 1 Output: 3 Explanation: The optimal valid path from node 0 to node 2 is as follows: Use `edges[2] = [0, 2, 3]` to reach node 2 with a weight `w i = 3`. The corresponding concatenation of labels is `"ab"`, which satisfies at most `k = 1` consecutive identical characters. Thus, the answer is 3. Example 2: Input: n = 3, edges = [[0,1,1],[1,2,1],[0,2,3]], labels = "aab", k = 2 Output: 2 Explanation: The optimal valid path from node 0 to node 2 is as follows: Use `edges[0] = [0, 1, 1]` to reach node 1 with weight `w i = 1`. Use `edges[1] = [1, 2, 1]` to reach node 2 with weight `w i = 1`. The corresponding concatenation of labels is `"aab"`, which satisfies at most `k = 2` consecutive identical characters. Thus, the answer is 2. Example 3: Input: n = 3, edges = [[0,1,1],[1,2,1]], labels = "aaa", k = 2 Output: -1 Explanation: There is no valid path from node 0 to node 2 that satisfies at most `k = 2` consecutive identical characters. Thus, the answer is -1. Constraints: `1 <= n == labels.length <= 5 * 10 4 ` `0 <= edges.length <= 5 * 10 4 ` `edges[i] == [u i , v i , w i ]` `0 <= u i , v i <= n - 1` `u i != v i ` `1 <= w i <= 10 4 ` `labels` consists of lowercase English letters `1 <= k <= 50`

---

## 2. 🧠 Topics You Need to Know (Prerequisites)
- `String`
- `Graph Theory`
- `Heap (Priority Queue)`
- `Shortest Path`

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
| **Stage 2: Research** | Matched optimal DSA paradigm (String, Graph Theory, Heap (Priority Queue)). |
| **Stage 3: Plan** | Structured invariant and edge case handling. |
| **Stage 4: Code** | Clean, verified implementation in Python. |
| **Stage 5: Validate** | AST syntax validation and testcase execution passed. |
| **Stage 6: Complexity** | Optimal asymptotic bounds. |

---

## 6. 💻 Complete Solution Code

```python
from typing import List
import heapq

class Solution:
    def shortestPath(self, n: int, edges: List[List[int]], labels: str, k: int) -> int:
        # Build adjacency list
        graph = [[] for _ in range(n)]
        for u, v, w in edges:
            graph[u].append((v, w))
        
        # dist[node][count] = minimum total weight to reach node with consecutive count = count
        # count ranges from 1 to k
        INF = float('inf')
        dist = [[INF] * (k + 1) for _ in range(n)]
        
        # Priority queue: (total_weight, node, consecutive_count)
        pq = []
        
        # Start from node 0 with consecutive count = 1 (the first node's label forms a run of length 1)
        dist[0][1] = 0
        heapq.heappush(pq, (0, 0, 1))
        
        while pq:
            weight, node, count = heapq.heappop(pq)
            
            # If we reached the destination node, return the weight
            if node == n - 1:
                return weight
            
            # Skip if we've already found a better path to this state
            if weight > dist[node][count]:
                continue
            
            # Explore all neighbors
            for neighbor, edge_weight in graph[node]:
                # Calculate new consecutive count based on whether labels match
                if labels[node] == labels[neighbor]:
                    new_count = count + 1
                else:
                    new_count = 1
                
                # Only proceed if the new consecutive count doesn't exceed k
                if new_count <= k:
                    new_weight = weight + edge_weight
                    if new_weight < dist[neighbor][new_count]:
                        dist[neighbor][new_count] = new_weight
                        heapq.heappush(pq, (new_weight, neighbor, new_count))
        
        # No valid path found
        return -1
```

---

## 7. ⏱️ Complexity Analysis
### Explanation

**Approach:**
This problem can be solved using Dijkstra's algorithm with an extended state space. The key insight is that the validity of a path depends not only on the current node but also on how many consecutive times the current node's label has appeared at the end of the path.

**State Definition:**
- We define a state as `(node, count)` where `count` is the current consecutive run length of `labels[node]` at the end of the path.
- `count` ranges from 1 to `k` (since we cannot exceed `k` consecutive identical characters).

**Algorithm:**
1. **Graph Construction:** Build an adjacency list from the edges.
2. **Dijkstra's Setup:** Use a priority queue (min-heap) to explore paths in order of increasing total weight. Each entry in the queue is `(total_weight, node, consecutive_count)`.
3. **Initial State:** Start from node 0 with `consecutive_count = 1` (since the path consisting of just node 0 has one character).
4. **Transition:** When moving from node `u` to node `v`:
   - If `labels[u] == labels[v]`, the consecutive count increases by 1 (`new_count = count + 1`)
   - Otherwise, the consecutive count resets to 1 (`new_count = 1`)
   - Only proceed if `new_count <= k`
5. **Termination:** If we reach node `n-1`, return the accumulated weight. If the queue is exhausted without reaching the destination, return -1.

**Correctness:**
- The algorithm explores all valid paths in order of increasing
