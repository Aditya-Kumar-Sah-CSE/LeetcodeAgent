# LeetCode Agent - 1-Click Launch Script for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Launching LeetCode Agent (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot
if (-not (Test-Path "$root\backend\app\main.py")) {
    if (Test-Path "$PWD\backend\app\main.py") {
        $root = "$PWD"
    } elseif (Test-Path "D:\LeetcodeAgent\backend\app\main.py") {
        $root = "D:\LeetcodeAgent"
    } elseif (Test-Path "$env:USERPROFILE\LeetcodeAgent\backend\app\main.py") {
        $root = "$env:USERPROFILE\LeetcodeAgent"
    } elseif (Test-Path "C:\LeetcodeAgent\backend\app\main.py") {
        $root = "C:\LeetcodeAgent"
    } elseif (Test-Path "$PSScriptRoot\..\LeetcodeAgent\backend\app\main.py") {
        $root = (Resolve-Path "$PSScriptRoot\..\LeetcodeAgent").Path
    } else {
        Write-Host "[WARNING] Script launched from: $PSScriptRoot" -ForegroundColor Yellow
        $root = Read-Host "Please enter full path to LeetcodeAgent folder (e.g. D:\LeetcodeAgent)"
    }
}
Write-Host "[INFO] Project Directory: $root" -ForegroundColor Green
Write-Host ""

Write-Host "[1/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (Test-Path '.venv\Scripts\activate.ps1') { .\.venv\Scripts\activate.ps1; uvicorn app.main:app --reload --port 8000 } elseif (Test-Path '.venv\Scripts\activate.bat') { cmd /c 'call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000' } else { Write-Host 'Virtualenv not found' -ForegroundColor Red; pause }"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening Browser on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " Both servers launched in separate terminal windows!" -ForegroundColor Green
Write-Host " Backend:  http://localhost:8000" -ForegroundColor White
Write-Host " Frontend: http://localhost:5173 (Opened in browser)" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
