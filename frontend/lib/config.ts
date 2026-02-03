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
        // Otherwise, use the current hostname (which would be the laptop IP if accessed from phone)
        return `http://${window.location.hostname}:8000`;
    }

    // Default fallback
    return "http://localhost:8000";
};

export const API_BASE_URL = getBaseUrl();
