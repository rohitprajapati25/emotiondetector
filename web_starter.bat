@echo off
title AI Exhibition System - USB Camera Launcher
setlocal

echo ============================================================
echo   CLEANING PREVIOUS SESSIONS...
echo ============================================================
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1

echo.
echo ============================================================
echo   SYSTEM CAMERA MODE
echo ============================================================
echo   Using Default System Camera (Index 0)
echo.

:: Auto-detect Laptop IP (More robust version)
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.' -and $_.IPAddress -notmatch '^192\.168\.56\.' } | Select-Object -ExpandProperty IPAddress | Select-Object -First 1"`) do set LAPTOP_IP=%%a
if "%LAPTOP_IP%"=="" set LAPTOP_IP=localhost

echo.
echo ============================================================
echo   STARTING SYSTEM CORE
echo   Dashboard: http://%LAPTOP_IP%:3000
echo ============================================================
echo.

:: Set Environment for Python and Next.js
set NEXT_PUBLIC_API_URL=http://%LAPTOP_IP%:8000
set NEXT_PUBLIC_API_BASE_URL=http://%LAPTOP_IP%:8000

:: Start AI Backend
start cmd /k "title AI BRAIN && echo Starting Python AI Engine (USB Mode)... && python api_backend.py"

:: Clean and Start Dashboard
if exist "frontend\.next" rmdir /S /Q "frontend\.next"
cd frontend
start cmd /k "title AI DASHBOARD && echo Starting Exhibition Dashboard... && npm run dev -- -H 0.0.0.0"

echo.
echo ✓ System Online. 
echo Close this window to STOP everything.
pause >nul
