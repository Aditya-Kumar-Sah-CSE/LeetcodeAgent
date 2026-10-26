@echo off
title LeetCode Agent - Backend (FastAPI)
cd /d "%~dp0backend"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    echo Starting FastAPI Backend on http://localhost:8000 ...
    uvicorn app.main:app --reload --port 8000
) else (
    echo [ERROR] Virtual environment not found at backend\.venv
    echo Please make sure backend\.venv exists.
    pause
)
