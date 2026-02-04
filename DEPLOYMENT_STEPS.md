# 🚀 Deployment Steps: Exhibition Mode (Laptop + Cloudflare Tunnel)

This mode is perfect for demos or exhibitions where you run the heavy AI on your laptop but want the UI accessible via the web.

## 1. Start the Backend (Terminal 1)
Open a terminal and run:
```powershell
cd "c:\Users\rohit\Downloads\Emotion Detector\Emotion Detector"
python api_backend.py
```
*Keep this window open!*

## 2. Start the Tunnel (Terminal 2)
Open a **new** terminal and run:
```powershell
cd "c:\Users\rohit\Downloads\Emotion Detector\Emotion Detector"
.\start_tunnel.bat
```
*Keep this window open!*

## 3. Get the Tunnel URL
If the URL isn't visible, run this in a **new** terminal:
```powershell
.\find_tunnel_url.bat
```
Copy the URL (e.g., `https://xxxxx.trycloudflare.com`).

## 4. Update Vercel
1. Go to your Vercel Project Settings -> Environment Variables.
2. Edit `NEXT_PUBLIC_API_URL` with your **NEW** tunnel URL.
3. Redeploy the project.

## ✅ Verification
- Visit your Vercel app.
- It should connect to your laptop's camera and AI!
