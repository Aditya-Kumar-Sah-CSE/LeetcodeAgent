# LeetCode Agent - Next.js Fullstack Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Launching LeetCode Agent Fullstack (Next.js)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path "$ScriptDir\nextjs"
Write-Host "[INFO] Starting Next.js Dev Server on http://localhost:3000..." -ForegroundColor Green
npm run dev

