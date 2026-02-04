const getBaseUrl = () => {
    // 1. Priority: Explicit Environment Variable (Set in Vercel Dashboard)
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl;

    // 2. Priority: Local Development (running 'npm run dev' locally)
    // This ensures that when you run locally, it ALWAYS uses localhost:8000
    if (process.env.NODE_ENV === "development") {
        return "http://localhost:8000";
    }

    // 3. Status Check: Logs for debugging (Visible in Browser Console)
    if (typeof window !== "undefined") {
        console.log("🌐 Production Mode Detected: Using Cloudflare Tunnel");
    }

    // 4. Default Fallback: Cloudflare Tunnel for Vercel/Production
    return "https://gary-epinions-fifteen-understood.trycloudflare.com";
};

export const API_BASE_URL = getBaseUrl();
