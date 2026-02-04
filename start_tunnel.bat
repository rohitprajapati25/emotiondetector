@echo off
echo ============================================================
echo   CLOUDFLARE TUNNEL - EMOTION DETECTOR BACKEND
echo ============================================================
echo.
echo Starting Cloudflare Tunnel for Backend (Port 8000)...
echo.
echo IMPORTANT: Copy the tunnel URL that appears below!
echo You will need it to update your Vercel deployment.
echo.
cloudflared tunnel --url http://localhost:8000
