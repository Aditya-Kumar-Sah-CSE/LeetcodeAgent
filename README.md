# ⚡ LeetCode AI Agent — Autonomous Problem Solver & Workspace

[![Daily LeetCode Solver](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml)
[![Deploy to GitHub Pages](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml)
[![Solutions Solved](https://img.shields.io/badge/Solutions%20Solved-3-6c63ff?style=for-the-badge&logo=leetcode)](solutions/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An intelligent, local-first **LeetCode AI Assistant & Automated Daily Problem Solver**.

- 🌐 **Interactive Web Workspace**: Built with React, TypeScript, Tailwind CSS, and Monaco Editor.
- 🤖 **Multi-Stage AI Reasoning**: Understand ➔ Research ➔ Plan ➔ Generate ➔ Validate ➔ Explain.
- 📅 **GitHub Actions Daily Scheduler**: Runs every midnight (00:00 UTC) to fetch the official LeetCode Daily Challenge, generate the optimal solution with OpenRouter AI, validate code syntax with AST, and push commits to GitHub.
- 🔒 **Zero Signup / Privacy First**: Direct browser-to-model execution, localStorage & IndexedDB persistence, no external database required.

---

## 🚀 Latest Daily Challenge


> **3882. Minimum XOR Path in a Grid** (Medium)  
> 📅 **Date**: `2026-10-28`  
> 🔗 [View on LeetCode](https://leetcode.com/problems/minimum-xor-path-in-a-grid/) · [View Solution Code](solutions/2026-10-28-minimum-xor-path-in-a-grid/solution.py) · [View Editorial](solutions/2026-10-28-minimum-xor-path-in-a-grid/README.md)


### Progress Summary
| Total Solved | Easy | Medium | Hard |
|:---:|:---:|:---:|:---:|
| **3** | 🟢 1 | 🟡 2 | 🔴 0 |

---

## 📂 Recent Solved Challenges

| Date | Problem | Difficulty | Topics | Solution & Notes |
|:---|:---|:---:|:---|:---|
| 2026-10-28 | [3882. Minimum XOR Path in a Grid](https://leetcode.com/problems/minimum-xor-path-in-a-grid/) | ![Medium](https://img.shields.io/badge/-Medium-yellow?style=flat-square) | `Array`, `Dynamic Programming`, `Bit Manipulation` | [Python](solutions/2026-10-28-minimum-xor-path-in-a-grid/solution.py) · [Notes](solutions/2026-10-28-minimum-xor-path-in-a-grid/README.md) |
| 2026-10-26 | [3619. Count Islands With Total Value Divisible by K](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/) | ![Medium](https://img.shields.io/badge/-Medium-yellow?style=flat-square) | `Array`, `Depth-First Search`, `Breadth-First Search` | [Python](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/solution.py) · [Notes](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/README.md) |
| 2026-10-25 | [1. Two Sum](https://leetcode.com/problems/two-sum/) | ![Easy](https://img.shields.io/badge/-Easy-brightgreen?style=flat-square) | `Array`, `Hash Table` | [Python](solutions/2026-10-25-two-sum/solution.py) · [Notes](solutions/2026-10-25-two-sum/README.md) |

*See full index in [`solutions/manifest.json`](solutions/manifest.json).*

---

## 🛠️ System Architecture

```text
       GitHub Actions (Daily Scheduler: 00:00 UTC)
                         │
                         ▼
             Fetch LeetCode Daily Challenge
                         │
                         ▼
               AI Multi-Stage Reasoning
         (OpenRouter Free Models: Gemini / Gemma)
                         │
                         ▼
             Python AST Syntax & Test Validation
                         │
                         ▼
            Generate Solution & Editorial
                         │
                         ▼
       Update solutions/ & manifest.json & README.md
                         │
                         ▼
           Git Auto-Commit & Push to Repo
```

---

## 💻 Local Development Setup

### 1. Frontend (React + Vite + Monaco Editor)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Optional Backend (FastAPI + Python)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Run Daily Solver Manually
```bash
python scripts/daily_solver.py
```
*(Requires `OPENROUTER_API_KEY` in environment for live AI code generation).*

---

## ⚙️ GitHub Actions Daily Automation Setup

To enable daily automated commits to your GitHub repository:

1. Go to your repository on GitHub: `https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent`
2. Navigate to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click **New repository secret**.
4. Name: `OPENROUTER_API_KEY`
5. Value: Your free OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys).
6. Enable GitHub Actions write permissions in **Settings** ➔ **Actions** ➔ **General** ➔ **Workflow permissions** (select *Read and write permissions*).

The daily workflow will automatically run every day at `00:00 UTC` and commit the new solution!

---

## 📄 License
MIT License. Created by [Aditya Kumar Sah](https://github.com/Aditya-Kumar-Sah-CSE).
