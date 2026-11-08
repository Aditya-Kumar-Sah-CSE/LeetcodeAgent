@echo off
setlocal enabledelayedexpansion
title LeetCode Agent - 1-Click Launcher

echo ========================================================
echo    Launching LeetCode Agent (Backend + Frontend)
echo ========================================================
echo.

:: Detect the actual LeetCodeAgent project directory
set "PROJECT_DIR="

:: 1. Check if batch file is running from inside the project directory
if exist "%~dp0backend\app\main.py" (
    set "PROJECT_DIR=%~dp0"
    goto :DIR_FOUND
)

:: 2. Check if current working directory is the project directory
if exist "%CD%\backend\app\main.py" (
    set "PROJECT_DIR=%CD%\"
    goto :DIR_FOUND
)

:: 3. Check known workspace paths
if exist "D:\LeetcodeAgent\backend\app\main.py" (
    set "PROJECT_DIR=D:\LeetcodeAgent\"
    goto :DIR_FOUND
)
if exist "%USERPROFILE%\LeetcodeAgent\backend\app\main.py" (
    set "PROJECT_DIR=%USERPROFILE%\LeetcodeAgent\"
    goto :DIR_FOUND
)
if exist "C:\LeetcodeAgent\backend\app\main.py" (
    set "PROJECT_DIR=C:\LeetcodeAgent\"
    goto :DIR_FOUND
)
if exist "%~dp0..\LeetcodeAgent\backend\app\main.py" (
    set "PROJECT_DIR=%~dp0..\LeetcodeAgent\"
    goto :DIR_FOUND
)

:: 4. If still not found, prompt the user for the path
echo [WARNING] Script launched from: %~dp0
echo Could not automatically find the LeetCodeAgent project folder.
echo.
set /p USER_INPUT="Please enter full path to LeetcodeAgent (e.g. D:\LeetcodeAgent): "
if exist "!USER_INPUT!\backend\app\main.py" (
    set "PROJECT_DIR=!USER_INPUT!\"
    goto :DIR_FOUND
) else (
    echo [ERROR] Project folder not found at: "!USER_INPUT!"
    echo Please make sure the folder contains 'backend' and 'frontend'.
    pause
    exit /b 1
)

:DIR_FOUND
:: Trim trailing backslash if present
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo [INFO] Project Directory: %PROJECT_DIR%
cd /d "%PROJECT_DIR%"
echo.

echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "LeetCode Agent - Backend (FastAPI)" cmd /k "cd /d "%PROJECT_DIR%\backend" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000) else (echo Virtualenv not found in backend\.venv & pause)"

ping 127.0.0.1 -n 3 >nul 2>&1

echo [2/3] Starting Vite Frontend on http://localhost:5173 ...
start "LeetCode Agent - Frontend (Vite)" cmd /k "cd /d "%PROJECT_DIR%\frontend" && npm run dev"

ping 127.0.0.1 -n 4 >nul 2>&1

echo [3/3] Opening Browser on http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  Both servers are running in separate terminal windows!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173 (Opened in browser)
echo ========================================================

