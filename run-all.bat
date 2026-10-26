@echo off
title LeetCode Agent - 1-Click Launcher
echo ========================================================
echo    Launching LeetCode Agent (Backend + Frontend)
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "LeetCode Agent - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000) else (echo Virtualenv not found in backend\.venv & pause)"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "LeetCode Agent - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo  Both servers are running in separate terminal windows!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo ========================================================
