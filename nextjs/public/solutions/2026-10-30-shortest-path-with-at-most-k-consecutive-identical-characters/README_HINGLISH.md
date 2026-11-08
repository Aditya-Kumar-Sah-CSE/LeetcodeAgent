# 📖 Chapter 3970: Shortest Path With At Most K Consecutive Identical Characters (Hinglish Edition)

> **कठिनाई (Difficulty)**: Medium · **तारीख**: `2026-10-30`  
> 🔗 **LeetCode Link**: [https://leetcode.com/problems/shortest-path-with-at-most-k-consecutive-identical-characters/](https://leetcode.com/problems/shortest-path-with-at-most-k-consecutive-identical-characters/)  
> 📄 **Cheat Sheet PDF**: [2-Page Colorful PDF डाउनलोड करें](./cheatsheet.html) · [English Version](./README.md)

---

## 1. 🎯 Problem Ka Asaan Matlab
You are given an integer `n` representing the number of nodes in a directed weighted graph, numbered from 0 to `n - 1`. This is represented by a 2D integer array `edges`, where `edges[i] = [u i , v i , w i ]` represents a directed edge from node `u i ` to node `v i ` with weight `w i `. You are also given a string `labels` of length `n`, where `labels[i]` is the character assigned to node `i`, and...

---

## 2. 🧠 Kaunse Topics Pata Hone Chahiye?
- **String**
- **Graph Theory**
- **Heap (Priority Queue)**
- **Shortest Path**

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
