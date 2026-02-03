@echo off
title AI Exhibition System - Full Setup & Installer
setlocal enabledelayedexpansion

echo ============================================================
echo   AI EXHIBITION SYSTEM - ONE-CLICK INSTALLER
echo ============================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/
    pause
    exit /b
)
echo [OK] Python detected.

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b
)
echo [OK] Node.js detected.

echo.
echo ============================================================
echo   STEP 1: INSTALLING PYTHON DEPENDENCIES
echo ============================================================
echo Running: pip install -r requirements.txt
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARN] Pip installation had some issues, retrying...
    pip install opencv-python numpy tensorflow tf-keras fastapi uvicorn scipy
)
echo [OK] Python dependencies installed.

echo.
echo ============================================================
echo   STEP 2: INSTALLING FRONTEND DEPENDENCIES
echo ============================================================
if not exist "frontend" (
    echo [ERROR] Frontend folder not found. Please ensure you copied the whole project.
    pause
    exit /b
)

cd frontend
echo Running: npm install
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b
)
cd ..
echo [OK] Frontend dependencies installed.

echo.
echo ============================================================
echo   SETUP COMPLETE!
echo ============================================================
echo You can now run the project using: web_starter.bat
echo.
pause
