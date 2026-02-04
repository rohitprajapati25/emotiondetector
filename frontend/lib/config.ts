const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
        return envUrl;
    }

    // Client-side dynamic detection
    if (typeof window !== "undefined") {
        // If we are on localhost, use localhost
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            return "http://localhost:8000";
        }
    }

    // Default fallback to Cloudflare Tunnel for Vercel/Production
    return "https://human-foster-instructors-clone.trycloudflare.com";
};

export const API_BASE_URL = getBaseUrl();
