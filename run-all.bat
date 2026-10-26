@echo off
title LeetCode Agent - 1-Click Launcher
echo ========================================================
echo    Launching LeetCode Agent (Backend + Frontend)
echo ========================================================
echo.
echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "LeetCode Agent - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000) else (echo Virtualenv not found in backend\.venv & pause)"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Vite Frontend on http://localhost:5173 ...
start "LeetCode Agent - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser on http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  Both servers are running in separate terminal windows!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173 (Opened in browser)
echo ========================================================
