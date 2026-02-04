@echo off
title Emotion Detector - All-in-One Local Starter

echo [1/2] Starting Python Backend...
start cmd /k "python api_backend.py"

echo [2/2] Starting Next.js Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ======================================================
echo.
echo Keep both terminal windows open!
pause
