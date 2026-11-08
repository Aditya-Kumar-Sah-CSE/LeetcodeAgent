@echo off
setlocal enabledelayedexpansion
title LeetCode Agent - Frontend (Vite)

set "PROJECT_DIR=%~dp0"
if not exist "%PROJECT_DIR%frontend\package.json" (
    if exist "D:\LeetcodeAgent\frontend\package.json" (
        set "PROJECT_DIR=D:\LeetcodeAgent\"
    ) else if exist "%USERPROFILE%\LeetcodeAgent\frontend\package.json" (
        set "PROJECT_DIR=%USERPROFILE%\LeetcodeAgent\"
    )
)
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

cd /d "%PROJECT_DIR%\frontend"
echo Starting Vite Frontend on http://localhost:5173 ...
npm run dev

