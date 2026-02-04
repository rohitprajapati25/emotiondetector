"use client";

import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../lib/config";
import {
    Activity,
    Users,
    Smile,
    Camera,
    Globe,
    RefreshCw,
    AlertCircle,
    Play,
    Pause,
    Power
} from "lucide-react";

// Types
interface EmotionStats {
    [key: string]: number;
}

interface SystemStatus {
    camera: string;
    ai_model: string;
    backend: string;
}

interface BackendData {
    is_running: boolean;
    camera_url: string;
    emotion: string;
    age: string;
    gender: string;
    visitors: number;
    message: string;
    heatmap: string;
    emotion_stats: EmotionStats;
    system_status: SystemStatus;
}

const EMOTION_THEME_MAP = {
    'Happy': 'happy',
    'Sad': 'sad',
    'Angry': 'angry',
    'Neutral': 'amber',
    'Surprise': 'pink',
    'Fear': 'purple',
    'Disgust': 'teal'
};

export default function DashboardContent() {
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<BackendData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [streamKey, setStreamKey] = useState(0);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isLocalHost, setIsLocalHost] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isAnalyzingRef = useRef(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            setIsLocalHost(host === "localhost" || host === "127.0.0.1");
            setIsMobile(window.innerWidth < 768);

            const handleResize = () => setIsMobile(window.innerWidth < 768);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // 1. Browser Camera Administration (Only if not LocalHost)
    useEffect(() => {
        if (!isLocalHost && isRunning && typeof navigator !== "undefined") {
            const startCamera = async () => {
                try {
                    // Mobile-Optimized Constraints
                    const constraints = {
                        video: {
                            facingMode: 'user', // Better for front camera
                            width: isMobile ? { ideal: 480 } : { ideal: 640 },
                            height: isMobile ? { ideal: 360 } : { ideal: 360 },
                            frameRate: { max: 15 } // Reduce sensor load
                        }
                    };

                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Camera access denied:", err);
                    setError("Camera Access Denied");
                }
            };
            startCamera();
        } else {
            // Stop camera when not running
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [isRunning, isLocalHost, isMobile]);

    // Optimized Frame Capture Loop (Faster upload)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!isLocalHost && isRunning) {
            interval = setInterval(async () => {
                if (!videoRef.current || !canvasRef.current || isAnalyzingRef.current) return;

                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (video.readyState < 2) return;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Lock analysis to prevent lag buildup
                isAnalyzingRef.current = true;

                // Adjust canvas to match actual video feed size
                if (canvas.width !== video.videoWidth) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL("image/jpeg", isMobile ? 0.3 : 0.4);

                try {
                    const res = await fetch(`${API_BASE_URL}/analyze`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData })
                    });

                    if (res.ok) {
                        const result = await res.json();
                        setProcessedImage(result.image);
                    }
                } catch (err) {
                    console.error("Analysis loop failed:", err);
                } finally {
                    isAnalyzingRef.current = false;
                }
            }, isMobile ? 250 : 180);
        }
        return () => clearInterval(interval);
    }, [isRunning, isLocalHost, isMobile]);

    // Polling logic for global stats
    useEffect(() => {
        let isMounted = true;
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/status`);
                if (!res.ok) throw new Error("Backend connection failed");
                const json = await res.json();

                if (isMounted) {
                    setData(prev => {
                        if (JSON.stringify(prev) === JSON.stringify(json)) return prev;
                        return json;
                    });
                    setError(null);
                    setLoading(false); // Only stop loading when we actually have data
                }
            } catch (err) {
                if (isMounted) setError("Cloud Brain: Connecting...");
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const toggleSystem = async (command: 'start' | 'stop') => {
        try {
            const res = await fetch(`${API_BASE_URL}/control`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            if (res.ok) {
                setIsRunning(command === 'start');
                setStreamKey(Date.now());
            }
        } catch (err) {
            console.error("Control failed:", err);
            setError("Control command failed");
        }
    };

    if (!mounted) return null;

    const currentEmotion = data?.emotion || "Neutral";
    const accentColor = `var(--${data?.heatmap || 'amber'})`;

    // In Cloud mode, we check if the Browser Camera is active
    const isBrowserCameraActive = !!videoRef.current?.srcObject;
    const isCameraConnected = isBrowserCameraActive;

    return (
        <main className="min-h-screen p-4 md:p-8 bg-grid relative flex flex-col gap-6 overflow-x-hidden" data-emotion={currentEmotion}>

            {/* Dynamic Border Glow */}
            {/* Dynamic Border Glow */}
            <div
                className="fixed inset-0 pointer-events-none transition-all duration-1000 z-50"
                style={{
                    boxShadow: isRunning
                        ? `inset 0 0 120px color-mix(in srgb, ${accentColor} 30%, transparent)`
                        : 'inset 0 0 120px rgba(255, 0, 0, 0.1)',
                    border: isRunning
                        ? `${mounted && window.innerWidth < 768 ? '3px' : '6px'} solid color-mix(in srgb, ${accentColor} 50%, transparent)`
                        : `${mounted && window.innerWidth < 768 ? '3px' : '6px'} solid rgba(255, 0, 0, 0.2)`
                }}
            />

            {/* Header Section */}
            <header className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 md:gap-6 glass p-4 md:p-6 rounded-2xl animate-glow relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-2 rounded-xl bg-opacity-20 transition-colors duration-1000" style={{ backgroundColor: accentColor }}>
                        <Activity className="w-6 h-6 md:w-7 md:h-7" style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 leading-tight">
                            Exhibition AI Brain
                        </h1>
                        <p className="text-slate-400 uppercase text-[8px] md:text-[10px] tracking-[0.4em] font-bold">Wireless Core v5.1</p>
                    </div>
                </div>

                {/* System Camera Status - Optimized for mobile */}
                <div className="flex-grow w-full lg:max-w-xl px-0 lg:px-4 flex items-center justify-start lg:justify-center order-3 lg:order-2">
                    <div className={`w-full lg:w-auto px-4 md:px-6 py-2 md:py-3 rounded-xl border flex items-center gap-3 transition-colors duration-500 ${isCameraConnected ? 'glass-accent border-green-500/30' : 'bg-red-900/10 border-red-500/20'}`}>
                        {isCameraConnected ? (
                            <Camera className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        ) : (
                            <div className="w-4 h-4 md:w-5 md:h-5 relative">
                                <Camera className="w-4 h-4 md:w-5 md:h-5 text-red-500 opacity-50 absolute inset-0" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-0.5 bg-red-500 rotate-45 transform origin-center" />
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-slate-500">Video Source</span>
                            <span className={`text-xs md:text-sm font-bold truncate max-w-[150px] md:max-w-none ${isCameraConnected ? 'text-green-400' : 'text-red-400'}`}>
                                {isCameraConnected ? "Browser Camera Active" : "Searching..."}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 self-stretch lg:self-auto order-2 lg:order-3">
                    {/* Reset Camera Button */}
                    <button
                        onClick={async () => {
                            try {
                                // 1. Trigger Reset on Backend
                                await fetch(`${API_BASE_URL}/reset_camera`, { method: 'POST' });

                                // 2. Force Frontend Refresh after brief delay
                                setTimeout(() => {
                                    setStreamKey(Date.now());
                                    // Also clear any lingering error states
                                    setError(null);
                                    setIsRunning(true); // Assume we want to start back up
                                }, 2000);

                            } catch (e) { console.error(e); }
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 md:px-5 py-2.5 md:py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 border border-white/5"
                        title="Force Camera Re-scan"
                    >
                        <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Reset</span>
                    </button>

                    {/* Master Control Toggle */}
                    {!isRunning ? (
                        <button
                            onClick={() => toggleSystem('start')}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 md:gap-3 bg-green-600 hover:bg-green-500 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs md:text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-30 disabled:grayscale disabled:scale-100"
                        >
                            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            Start AI
                        </button>
                    ) : (
                        <button
                            onClick={() => toggleSystem('stop')}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 md:gap-3 bg-red-600 hover:bg-red-500 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs md:text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                        >
                            <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            Stop AI
                        </button>
                    )}
                </div>
            </header>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow relative z-10">

                {/* Left Column: Input Source & Live Results */}
                <section className="col-span-1 lg:col-span-8 flex flex-col gap-4 md:gap-6 relative">
                    <div className="glass rounded-3xl overflow-hidden relative flex-grow min-h-[300px] md:min-h-[600px] border-2 transition-colors duration-1000" style={{ borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)` }}>

                        {/* Camera Preview */}
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            {/* Hidden but rendering Video & Canvas for processing (Live Cloud only) */}
                            {!isLocalHost && (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        width={640}
                                        height={360}
                                        style={{ display: 'none' }}
                                    />
                                </>
                            )}

                            {isRunning ? (
                                <>
                                    {/* Main Feed: Switch between Browser Capture (Cloud) and Direct MJPEG (Local) */}
                                    <img
                                        src={isLocalHost ? `${API_BASE_URL}/video_feed?sk=${streamKey}` : (processedImage || `${API_BASE_URL}/video_feed?sk=${streamKey}`)}
                                        className="w-full h-full object-contain"
                                        alt="AI Processed Stream"
                                        key={streamKey}
                                    />

                                    <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1.5 md:px-4 md:py-2 glass-accent rounded-xl flex items-center gap-2 md:gap-3 border border-white/10 z-20">
                                        <div className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${isRunning ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'}`} />
                                        <span className="text-[8px] md:text-xs font-black tracking-widest uppercase text-white">
                                            {isRunning ? 'Live AI Analysis' : 'Camera Preview (AI Stopped)'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6 opacity-40">
                                    <Power className="w-20 h-20 text-slate-600" />
                                    <p className="font-black uppercase tracking-[0.5em] text-sm text-slate-500 text-center">
                                        System Camera Standby<br />
                                        <span className="text-[10px] tracking-widest opacity-60">
                                            Ready to Begin
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile-First Result HUD - Stacks below on mobile, floats on desktop */}
                    {isRunning && (
                        <div className="lg:absolute lg:inset-x-8 lg:bottom-8 static flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-4 md:gap-6 pointer-events-none mt-2 lg:mt-0 z-20">
                            <div className="glass p-4 md:p-8 rounded-2xl flex flex-col gap-1 md:gap-2 min-w-0 md:min-w-[340px] border-l-4 md:border-l-8 backdrop-blur-2xl shadow-2xl transition-all duration-1000 pointer-events-auto" style={{ borderColor: accentColor }}>
                                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">Active Subject</span>
                                <span className="text-3xl md:text-7xl font-black leading-none transition-all duration-1000" style={{ color: accentColor }}>
                                    {currentEmotion}
                                </span>
                                <div className="flex gap-4 md:gap-6 mt-2 md:mt-4 pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-slate-600 text-[8px] md:text-[9px] font-black uppercase">Age Group</span>
                                        <span className="font-bold text-sm md:text-lg">{data?.age}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-600 text-[8px] md:text-[9px] font-black uppercase">Bio Gender</span>
                                        <span className="font-bold text-sm md:text-lg">{data?.gender}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass p-4 md:p-6 rounded-2xl max-w-full lg:max-w-sm text-center lg:text-right backdrop-blur-2xl border border-white/10 shadow-2xl pointer-events-auto">
                                <p className="text-sm md:text-xl italic font-semibold leading-relaxed text-slate-200">
                                    {data?.message}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Right Column: Historical Stats */}
                <section className="col-span-1 lg:col-span-4 flex flex-col gap-6">

                    {/* Visitor Count Card */}
                    <div className="glass p-6 md:p-8 rounded-3xl flex items-center justify-between border-b-4 md:border-b-8 border-blue-600 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-blue-500/10 rounded-full -mr-12 md:-mr-16 -mt-12 md:-mt-16 blur-2xl md:blur-3xl text-blue-500" />
                        <div className="relative">
                            <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">Total Visitors Observed</p>
                            <h3 className="text-4xl md:text-6xl font-black mt-1 md:mt-2 tabular-nums transition-all">{data?.visitors}</h3>
                        </div>
                        <div className="p-3 md:p-5 bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 md:w-10 md:h-10 text-blue-400" />
                        </div>
                    </div>

                    {/* Emotion Distribution */}
                    <div className="glass p-6 md:p-8 rounded-3xl flex flex-col gap-6 md:gap-8 flex-grow shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">Emotion Analytics</p>
                            <Smile className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                        </div>

                        <div className="flex flex-col gap-4 md:gap-5 mt-2">
                            {data && Object.entries(data.emotion_stats).map(([emotion, count]) => (
                                <div key={emotion} className="flex flex-col gap-1 md:gap-1.5">
                                    <div className="flex justify-between text-[8px] md:text-[9px] font-black">
                                        <span className="uppercase tracking-widest text-slate-400">{emotion}</span>
                                        <span className="tabular-nums opacity-60 font-bold">{count}</span>
                                    </div>
                                    <div className="h-1.5 md:h-2 bg-background/50 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
                                            style={{
                                                width: `${(count / (Math.max(...Object.values(data.emotion_stats)) + 0.1)) * 100}%`,
                                                backgroundColor: `var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`,
                                                boxShadow: `0 0 10px var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 md:pt-8 border-t border-white/5 flex flex-col gap-1 md:gap-2">
                            <p className="text-[8px] md:text-[9px] text-slate-600 font-black tracking-widest uppercase">Input: Real-Time IP MJPEG</p>
                            <p className="text-[8px] md:text-[9px] text-slate-600 font-black tracking-widest uppercase">Brain: OpenCV Deep Neural Net</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Connection Alert */}
            {error && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-full flex items-center gap-4 border-red-500/50 text-red-400 animate-pulse z-[100] shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">{error}</span>
                </div>
            )}

            {/* Footer Branding */}
            <footer className="flex justify-between items-center text-[9px] text-slate-600 font-black uppercase tracking-[0.5em] mt-2 relative z-10 px-2 opacity-50">
                <span>© 2026 EXHIBITION_CORE // IP_WIFI_CAMERA</span>
                <div className="flex gap-6">
                    <span>STATUS: {isRunning ? 'SECURE_STREAM' : 'READY'}</span>
                    <span>LATENCY: ZERO_TARGET</span>
                    <span>BACKEND: PYTHON_311_AI</span>
                </div>
            </footer>
        </main>
    );
}

export function StatusBadge({ icon, label, status }: { icon: React.ReactNode, label: string, status?: string }) {
    const isActive = status?.includes('Connected') || status?.includes('Ready') || status === 'Running' || status === 'Streaming' || status === 'Online';
    const isError = status === 'Error' || status === 'Disconnected' || status?.includes('Lost');

    return (
        <div className={`glass px-5 py-3 rounded-2xl flex items-center gap-4 border transition-all duration-500 ${isActive ? 'border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : isError ? 'border-red-500/20' : 'border-slate-500/20'}`}>
            <div className={isActive ? 'text-green-400' : isError ? 'text-red-400' : 'text-slate-400'}>{icon}</div>
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-600 font-black uppercase leading-none tracking-tighter">{label}</span>
                <span className="text-xs font-bold text-slate-200 mt-1 leading-tight">{status || "..."}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : isError ? 'bg-red-500' : 'bg-slate-700'} ${isActive ? 'animate-pulse' : ''}`} />
        </div>
    );
}
