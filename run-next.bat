@echo off
setlocal enabledelayedexpansion
title LeetCode Agent - Next.js Fullstack Launcher

echo ========================================================
echo    Launching LeetCode Agent Fullstack (Next.js)
echo ========================================================
echo.

cd /d "%~dp0nextjs"
echo [INFO] Starting Next.js Dev Server on http://localhost:3000...
echo.
npm run dev

