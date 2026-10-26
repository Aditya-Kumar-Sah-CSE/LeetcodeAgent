# LeetCode AI Agent — Implementation Plan

## Architecture
- **Daily Challenge**: LeetCode public GraphQL endpoint
- **AI Models**: OpenRouter API (free models)
- **Web Search**: DuckDuckGo (free, no key) + browser handoff
- **Profile**: LeetCode public GraphQL profile query
- **Storage**: localStorage (prefs) + IndexedDB (solutions/history)
- **Security**: Backend on 127.0.0.1 only, API keys in .env, no cookies stored

## Phases
1. Foundation: project structure, venv, deps, verify startup
2. Backend: FastAPI services (daily fetch, AI, search, profile, agent pipeline)
3. Frontend: Dashboard, Daily Challenge, AI Workspace, Solutions, Settings
4. Integrations: wire all services end-to-end
5. Testing: pytest + vitest + fix issues
6. Documentation: README, AGENTS.md, .env.example, .gitignore
