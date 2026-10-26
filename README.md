# ⚡ LeetCode AI Agent — Autonomous Problem Solver & Workspace

[![Daily LeetCode Solver](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/daily-solve.yml)
[![Deploy to GitHub Pages](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent/actions/workflows/deploy-pages.yml)
[![Solutions Solved](https://img.shields.io/badge/Solutions%20Solved-2-6c63ff?style=for-the-badge&logo=leetcode)](solutions/manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An intelligent, local-first **LeetCode AI Assistant & Automated Daily Problem Solver**.

- 🌐 **Live Website**: **[https://aditya-kumar-sah-cse.github.io/LeetcodeAgent/](https://aditya-kumar-sah-cse.github.io/LeetcodeAgent/)**
- 📱 **Progressive Web App (PWA)**: Installable directly on Android, iOS, Windows, and macOS as a standalone native-like application with offline access.
- 🤖 **Multi-Stage AI Reasoning**: Understand ➔ Research ➔ Plan ➔ Generate ➔ Validate ➔ Explain.
- 📅 **GitHub Actions Daily Scheduler**: Runs every midnight to fetch the official LeetCode Daily Challenge, generate the optimal solution with OpenRouter AI, validate code syntax with AST, and push commits to GitHub.
- 👤 **LeetCode Profile Integration**: Directly connected to [Aditya_Kumar_Sah-28](https://leetcode.com/u/Aditya_Kumar_Sah-28/).
- 🔒 **Zero Signup / Privacy First**: Direct browser-to-model execution, localStorage & IndexedDB persistence, no external database required.

---

## 🚀 Latest Daily Challenge


> **3619. Count Islands With Total Value Divisible by K** (Medium)  
> 📅 **Date**: `2026-10-26`  
> 🔗 [LeetCode Problem](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/) · [Python Code](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/solution.py) · [English Book](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/README.md) · [Hinglish Book](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/README_HINGLISH.md) · [📄 2-Page PDF](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/cheatsheet.html)


### Progress Summary
| Total Solved | Easy | Medium | Hard | Monthly Book |
|:---:|:---:|:---:|:---:|:---:|
| **2** | 🟢 1 | 🟡 1 | 🔴 0 | [📚 October 2026 Book](solutions/books/2026-10-leetcode-solutions-book.md) |

---

## 📂 Recent Solved Challenges (Online Book Chapters)

| Date | Problem | Difficulty | Topics | Solutions, Notes & PDFs |
|:---|:---|:---:|:---|:---|
| 2026-10-26 | [3619. Count Islands With Total Value Divisible by K](https://leetcode.com/problems/count-islands-with-total-value-divisible-by-k/) | ![Medium](https://img.shields.io/badge/-Medium-yellow?style=flat-square) | `Array`, `DFS`, `BFS`, `Matrix` | [Python](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/solution.py) · [English](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/README.md) · [Hinglish](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/README_HINGLISH.md) · [📄 2-Page PDF](solutions/2026-10-26-count-islands-with-total-value-divisible-by-k/cheatsheet.html) |
| 2026-10-25 | [1. Two Sum](https://leetcode.com/problems/two-sum/) | ![Easy](https://img.shields.io/badge/-Easy-brightgreen?style=flat-square) | `Array`, `Hash Table` | [Python](solutions/2026-10-25-two-sum/solution.py) · [English](solutions/2026-10-25-two-sum/README.md) · [Hinglish](solutions/2026-10-25-two-sum/README_HINGLISH.md) · [📄 2-Page PDF](solutions/2026-10-25-two-sum/cheatsheet.html) |

*Full index in [`solutions/manifest.json`](solutions/manifest.json) · [📚 Monthly Solutions Book](solutions/books/2026-10-leetcode-solutions-book.md).*

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
         (OpenRouter Free Models: Gemini / Llama)
                         │
                         ▼
             Python AST Syntax Validation
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
*(Optionally set `OPENROUTER_API_KEY` in environment for live AI code generation).*

---

## ⚙️ GitHub Actions Daily Automation Setup

To enable daily automated commits to your GitHub repository:

1. Go to your repository on GitHub: `https://github.com/Aditya-Kumar-Sah-CSE/LeetcodeAgent`
2. Navigate to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
3. Click **New repository secret**.
4. Name: `OPENROUTER_API_KEY`
5. Value: Your free OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys).
6. Enable GitHub Actions read & write permissions in **Settings** ➔ **Actions** ➔ **General** ➔ **Workflow permissions** (select *Read and write permissions*).

The daily workflow will automatically run every day at `00:00 UTC` and commit the new solution!

---

## 📄 License
MIT License. Created by [Aditya Kumar Sah](https://github.com/Aditya-Kumar-Sah-CSE).
