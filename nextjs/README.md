# 🧠 LeetCode AI Agent — Next.js Fullstack

A fullstack AI-powered LeetCode companion built with **Next.js 15 (App Router)**. Practice problems, get AI-guided solutions through a 7-stage reasoning pipeline, run code locally, and track your progress — all in one unified app.

![hero](public/hero.png)

## ✨ Features

- 🎯 **Daily Challenge** — Auto-fetched from LeetCode with full description, examples & constraints
- 🧠 **7-Stage AI Agent** — Understand → Approach → Pseudocode → Code → Optimize → Test → Explain
- 💻 **Monaco Editor Workspace** — Full IDE with syntax highlighting, multi-language support
- 🤖 **Multi-Model AI** — Gemini, Groq, OpenRouter (40+ models)
- ▶️ **Code Execution** — Run Python, JavaScript, C++, Java code (local dev)
- 📊 **LeetCode Profile Sync** — Import your solved problems and contest ratings
- 📚 **Solutions Library** — Save, browse, and manage your solutions
- 💬 **AI Chat** — Context-aware chat with persistent history per problem
- 🔍 **Problem Search** — Search by URL, slug, or keyword with topic-based browsing
- 🏆 **Contest Browser** — Browse past and upcoming LeetCode contests
- 📱 **PWA Support** — Install as a standalone app on desktop/mobile

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** or **pnpm**

### Setup

```bash
# Clone the repo
git clone https://github.com/Aditya-Kumar-Sah-CSE/leetcode-agent-nextjs.git
cd leetcode-agent-nextjs

# Install dependencies
npm install

# Copy env template and add your API keys
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# Required — at least one AI provider
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional — solutions directory
SOLUTIONS_DIR=./public/solutions
```

Get API keys:
- **Gemini** → [aistudio.google.com](https://aistudio.google.com/)
- **Groq** → [console.groq.com](https://console.groq.com/)
- **OpenRouter** → [openrouter.ai](https://openrouter.ai/)

## 🏗️ Architecture

```
nextjs/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with metadata & fonts
│   ├── page.tsx            # Dashboard / Home
│   ├── daily/page.tsx      # Daily Challenge + Problems + Contests
│   ├── workspace/page.tsx  # Monaco Editor + AI Agent workspace
│   ├── solutions/page.tsx  # Saved solutions library
│   ├── activity/page.tsx   # Activity tracker
│   ├── settings/page.tsx   # API keys & preferences
│   └── api/                # 20+ API routes
│       ├── health/
│       ├── daily/
│       ├── problems/
│       ├── problem/[slug]/
│       ├── agent/run/
│       ├── code/run/
│       ├── models/
│       ├── solutions/
│       ├── chat/[slug]/
│       ├── profile/[username]/
│       ├── contests/
│       ├── search/
│       └── topics/
├── components/             # React components
│   ├── ClientShell.tsx     # Client-side layout wrapper
│   ├── Sidebar.tsx         # Desktop navigation
│   ├── MobileNav.tsx       # Mobile bottom navigation
│   ├── MonacoEditorWrapper.tsx  # SSR-safe Monaco editor
│   ├── ProblemAIChat.tsx   # AI chat panel
│   ├── SubmissionModal.tsx # Solution submission dialog
│   └── UIComponents.tsx    # Shared UI primitives
├── lib/                    # Shared libraries
│   ├── types.ts            # TypeScript interfaces
│   ├── api.ts              # Client-side API layer
│   ├── storage.ts          # localStorage abstraction (SSR-safe)
│   ├── problemBank.ts      # Offline problem bank (200+ problems)
│   ├── algorithmicAgent.ts # Client-side algorithmic solver
│   ├── chatService.ts      # Chat history management
│   ├── pwa.ts              # PWA install utilities
│   └── services/           # Server-side services
│       ├── aiService.ts    # Multi-provider AI completion
│       ├── codingAgent.ts  # 7-stage reasoning pipeline
│       ├── executionService.ts  # Code execution engine
│       ├── leetcodeService.ts   # LeetCode GraphQL client
│       ├── profileService.ts    # Profile fetching
│       ├── searchService.ts     # Web search
│       ├── solutionService.ts   # Solutions filesystem
│       └── chatService.ts       # Chat persistence
└── public/                 # Static assets
    ├── manifest.webmanifest
    ├── sw.js
    ├── icons/
    └── solutions/
```

## 🌐 Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Aditya-Kumar-Sah-CSE/leetcode-agent-nextjs)

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add your environment variables (`GEMINI_API_KEY`, etc.)
4. Deploy!

> **Note**: Code execution (`/api/code/run`) and filesystem-based solutions (`/api/solutions`) use Node.js `child_process` and `fs` — these work locally but are limited on Vercel's serverless functions. The AI agent, daily challenges, profile sync, and all LeetCode features work perfectly on Vercel.

## 📝 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/daily` | GET | Today's daily challenge |
| `/api/daily/refresh` | POST | Force refresh daily |
| `/api/problems` | GET | Practice problems |
| `/api/problem/[slug]` | GET | Problem details |
| `/api/problem/[slug]/snippets` | GET | Code templates |
| `/api/problem/resolve` | POST | Resolve URL to slug |
| `/api/topics` | GET | Topic tags |
| `/api/models` | GET | Available AI models |
| `/api/agent/run` | POST | Run AI agent stage |
| `/api/code/run` | POST | Execute code |
| `/api/search` | POST | Web search |
| `/api/solutions` | GET/POST | List/save solutions |
| `/api/solutions/[slug]` | GET/DELETE | Get/delete solution |
| `/api/chat/[slug]` | GET/POST | Chat history |
| `/api/profile/[username]` | GET | LeetCode profile |
| `/api/contests` | GET | Contest list |

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Editor**: Monaco Editor (via `@monaco-editor/react`)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm
- **AI Providers**: Google Gemini, Groq, OpenRouter

## 📄 License

MIT

---

Built with ❤️ by [Aditya Kumar Sah](https://github.com/Aditya-Kumar-Sah-CSE)

