@echo off
title Emotion Detector - Secure Tunnel
echo ============================================================
echo   REMOTE PHONE ACCESS SETUP (Secure Tunnel)
echo ============================================================
echo.
echo Modern browsers require HTTPS to access the phone camera.
echo This script will use 'localtunnel' to create a secure URL.
echo.

:: Check if localtunnel is installed
call lt --version >npm_lt_check.txt 2>&1
if %errorlevel% neq 0 (
    echo [!] Localtunnel is not installed. Installing it now...
    call npm install -g localtunnel
)
del npm_lt_check.txt

echo.
echo [1/2] Creating tunnel for Frontend (Port 3000)...
start cmd /k "lt --port 3000 --subdomain emotion-frontend-%RANDOM%"

echo.
echo [2/2] IMPORTANT: Your Python Backend MUST also be accessible.
echo If your phone is on the same WiFi as this PC, use:
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0."') do set IP=%%a
echo IP ADDRESS: %IP%
echo.
echo ============================================================
echo   INSTRUCTIONS FOR PHONE:
echo ============================================================
echo 1. Wait for the Frontend tunnel URL to appear in the new window.
echo 2. Open that URL on your Phone.
echo 3. The system should now have Camera access (HTTPS).
echo ============================================================
pause
