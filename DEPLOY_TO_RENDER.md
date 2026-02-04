# 🚀 Permanent Cloud Deployment (Render.com)

To make your "Brain" live 24/7 without your laptop, follow these steps.

## Phase 1: Push Code (Already Done)
I have already prepared your code and `render.yaml` file.

## Phase 2: Deploy Backend
1.  Go to **[dashboard.render.com](https://dashboard.render.com)** and Sign Up (GitHub login recommended).
2.  Click **"New +"** -> **"Blueprint"**.
3.  Connect your GitHub repository: `rohitprajapati25/emotiondetector`.
4.  Render will find `render.yaml` automatically.
5.  Click **"Apply"** / **"Create Service"**.

*Render will now build your potentially heavy Docker image. This may take 5-10 minutes.*

## Phase 3: Connect Frontend
1.  Once Render finishes, copy your new Backend URL (e.g., `https://emotion-detector.onrender.com`).
2.  Go to **Vercel Dashboard** -> Your Project -> **Settings** -> **Environment Variables**.
3.  Update `NEXT_PUBLIC_API_URL` with this new URL.
4.  Redeploy Vercel.

**Done!** Now you can turn off your laptop. 💻💤
