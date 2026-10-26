@echo off
title LeetCode Agent - Launcher
echo Launching Backend and Frontend in separate windows...
start "LeetCode Agent Backend" "%~dp0run-backend.bat"
start "LeetCode Agent Frontend" "%~dp0run-frontend.bat"
echo Done! Both servers are starting up.
