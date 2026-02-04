@echo off
cls
echo ============================================================
echo   CLOUDFLARE TUNNEL URL FINDER
echo ============================================================
echo.
echo Looking for your Cloudflare Tunnel URL...
echo.
echo Please check the PowerShell window where you ran:
echo   cloudflared tunnel --url http://localhost:8000
echo.
echo The URL should look like:
echo   https://xxxxx-xxxxx-xxxxx.trycloudflare.com
echo.
echo If you don't see it, follow these steps:
echo.
echo 1. Close the tunnel window (Ctrl+C)
echo 2. Run this command:
echo    cloudflared tunnel --url http://localhost:8000
echo.
echo 3. Look for the line that says:
echo    "Your quick Tunnel has been created! Visit it at:"
echo.
echo 4. Copy the URL that appears below that line
echo.
echo ============================================================
pause
