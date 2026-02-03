# 🚀 Deployment Guide: Emotion Detection System

Follow these steps to upload your project to GitHub and deploy the frontend to Vercel.

---

## 📂 Phase 1: Upload to GitHub

1. **Initialize Git:**
   Open your terminal in the `Emotion Detector` folder and run:
   ```bash
   git init
   ```

2. **Create a .gitignore:**
   Create a file named `.gitignore` in the root folder and add:
   ```text
   .venv/
   __pycache__/
   node_modules/
   .next/
   *.h5
   *.caffemodel
   .env
   ```
   *(Note: Large AI models like `.h5` and `.caffemodel` should ideally be downloaded via script on the server, as GitHub has a 100MB limit.)*

3. **Commit & Push:**
   ```bash
   git add .
   git commit -m "Exhibition ready release"
   # Create a repo on github.com then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Phase 2: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **Important Settings:**
   - **Root Directory:** Select `frontend`
   - **Framework Preset:** Next.js
5. **Environment Variables:**
   Add a variable named `NEXT_PUBLIC_API_BASE_URL` and set its value to your **Python Backend URL** (see Phase 3).
6. Click **Deploy**.

---

## 🐍 Phase 3: The Python Backend (FastAPI)

Vercel is for frontend/serverless; it cannot run your persistent OpenCV/TensorFlow backend. You have two options for the backend:

### Option A: Professional Hosting (Render.com)
1. Create an account on [Render.com](https://render.com).
2. Create a **Web Service** and connect your GitHub repo.
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `python api_backend.py` (ensure uvicorn is used)
5. Copy the Render URL (e.g., `https://my-api.onrender.com`) and paste it into the Vercel `NEXT_PUBLIC_API_BASE_URL` env variable.

### Option B: Exhibition Mode (Laptop + Tunnel)
If you are running this at an actual exhibition:
1. Run `python api_backend.py` on your laptop.
2. Run `secure_tunnel.bat` on your laptop to get a public HTTPS URL.
3. Update the Vercel environment variable with that tunnel URL.

---

## ✅ Deployment Summary
- **GitHub:** Stores your code and syncs with Vercel/Render.
- **Vercel:** Hosts the beautiful UI (Dashboard).
- **Render/Laptop:** Runs the AI brain (Python).

**Tip:** For the best performance, keep the Backend running on a laptop with a dedicated GPU if possible!
