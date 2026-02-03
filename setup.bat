@echo off
echo ============================================================
echo   ENHANCED EMOTION DETECTION SYSTEM - QUICK SETUP
echo ============================================================
echo.

echo [1/3] Installing Python dependencies...
echo.
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo ✓ Dependencies installed successfully!
echo.

echo [2/4] Downloading Age & Gender models...
echo.
python download_models.py
echo.

echo [3/4] Setting up Modern Web UI...
echo.
if exist "frontend" (
    cd frontend
    call npm install
    cd ..
) else (
    echo Note: Frontend folder not found. Skipping web UI setup.
)
echo.

echo [4/4] Setup complete!
echo.
echo ============================================================
echo   READY TO RUN
echo ============================================================
echo.
echo OPTION A (Modern Web UI): run web_starter.bat
echo OPTION B (Classic Window): run python main.py
echo.
echo For detailed documentation, see:
echo   - SETUP_GUIDE.md
echo   - FEATURE_REFERENCE.md
echo.
echo ============================================================
pause
