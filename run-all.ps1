# LeetCode Agent - 1-Click Launch Script for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Launching LeetCode Agent (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (Test-Path '.venv\Scripts\activate.ps1') { .\.venv\Scripts\activate.ps1; uvicorn app.main:app --reload --port 8000 } elseif (Test-Path '.venv\Scripts\activate.bat') { cmd /c 'call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000' } else { Write-Host 'Virtualenv not found' -ForegroundColor Red; pause }"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " Both servers launched in separate terminal windows!" -ForegroundColor Green
Write-Host " Backend:  http://localhost:8000" -ForegroundColor White
Write-Host " Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
