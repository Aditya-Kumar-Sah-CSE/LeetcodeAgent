@echo off
setlocal enabledelayedexpansion
title LeetCode Agent - Backend (FastAPI)

set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%backend\app\main.py" (
    if exist "D:\LeetcodeAgent\backend\app\main.py" (
        set "PROJECT_DIR=D:\LeetcodeAgent\"
    ) else if exist "%USERPROFILE%\LeetcodeAgent\backend\app\main.py" (
        set "PROJECT_DIR=%USERPROFILE%\LeetcodeAgent\"
    )
)
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

cd /d "%PROJECT_DIR%\backend"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    echo Starting FastAPI Backend on http://localhost:8000 ...
    uvicorn app.main:app --reload --port 8000
) else (
    echo [ERROR] Virtual environment not found at %PROJECT_DIR%\backend\.venv
    echo Please make sure backend\.venv exists.
    pause
)

