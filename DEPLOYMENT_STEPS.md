# 🚀 Instant Deployment Guide

### 1. Push to GitHub
```powershell
git init; git add .; git commit -m "Deploy"; git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy Backend (Render)
1. Go to [Render](https://dashboard.render.com/select-repo).
2. Connect Repo -> **Web Service**.
3. **Runtime**: `Docker`.
4. **Copy the URL** (e.g., `https://backend.onrender.com`).

### 3. Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/new).
2. Import Repo.
3. **Environment Variables**: 
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `YOUR_RENDER_URL`
4. Click **Deploy**.
