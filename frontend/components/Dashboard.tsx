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
                            facingMode: 'user',
                            width: isMobile ? { ideal: 640 } : { ideal: 1280 },
                            height: isMobile ? { ideal: 480 } : { ideal: 720 },
                            frameRate: { ideal: 24, max: 30 }
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

    // Ultra-Optimized Frame Capture Loop (Per User Guide)
    useEffect(() => {
        let frameId: number;
        let lastTimestamp = 0;
        const FPS_THROTTLE = isMobile ? 12 : 20; // Super smooth 20 FPS target for analysis
        const interval = 1000 / FPS_THROTTLE;

        const processFrame = async (timestamp: number) => {
            if (!isRunning) return;

            if (timestamp - lastTimestamp >= interval) {
                lastTimestamp = timestamp;

                if (videoRef.current && canvasRef.current && !isAnalyzingRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;

                    if (video.readyState >= 2) {
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            isAnalyzingRef.current = true;

                            // Small Canvas (320x180) for performance
                            canvas.width = 320;
                            canvas.height = 180;

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
                                    // Set data more frequently from analyze response for immediate feel
                                    if (result.data) setData(result.data);
                                }
                            } catch (err) {
                                console.error("Cloud Analytics error:", err);
                            } finally {
                                isAnalyzingRef.current = false;
                            }
                        }
                    }
                }
            }
            frameId = requestAnimationFrame(processFrame);
        };

        if (!isLocalHost && isRunning) {
            frameId = requestAnimationFrame(processFrame);
        }

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
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
                    setLoading(false);
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
                if (command === 'stop') setProcessedImage(null);
            }
        } catch (err) {
            console.error("Control failed:", err);
            setError("Control command failed");
        }
    };

    if (!mounted) return null;

    const currentEmotion = data?.emotion || "Neutral";
    const accentColor = `var(--${data?.heatmap || 'amber'})`;

    const isBrowserCameraActive = !!videoRef.current?.srcObject;
    const isCameraConnected = isBrowserCameraActive || isLocalHost;

    return (
        <main className="min-h-screen p-3 md:p-6 bg-[#020617] text-slate-50 relative flex flex-col gap-4 md:gap-6 overflow-hidden selection:bg-indigo-500/30" data-emotion={currentEmotion}>

            {/* Liquid Background Grain/Blur */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-[140px] transition-all duration-1000"
                    style={{ backgroundColor: accentColor }}
                />
                <div
                    className="absolute top-[40%] -right-[10%] w-[30%] h-[50%] rounded-full blur-[120px] transition-all duration-1000 opacity-20"
                    style={{ backgroundColor: 'var(--blue-600)' }}
                />
            </div>

            {/* Global Frame Glow */}
            <div
                className="fixed inset-0 pointer-events-none transition-all duration-1000 z-50 border-[0.5px]"
                style={{
                    boxShadow: isRunning
                        ? `inset 0 0 100px color-mix(in srgb, ${accentColor} 15%, transparent)`
                        : 'inset 0 0 40px rgba(0, 0, 0, 0.5)',
                    borderColor: isRunning
                        ? `color-mix(in srgb, ${accentColor} 20%, transparent)`
                        : 'rgba(255, 255, 255, 0.03)'
                }}
            />

            {/* Premium Control Header */}
            <header className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-3 glass-dark p-3 md:px-8 md:py-3 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-150 transition-transform group-hover:scale-110" />
                        <div className="relative p-2 rounded-xl md:p-2.5 md:rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
                            <Activity className="w-4 h-4 md:w-6 md:h-6 transition-colors duration-700" style={{ color: accentColor }} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-base md:text-xl font-black tracking-tighter text-white flex items-center gap-2">
                            AURA <span className="text-slate-500 font-extralight tracking-widest">VISION</span>
                        </h1>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <span className={`w-1 h-1 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                            <p className="text-slate-500 uppercase text-[6px] md:text-[7px] tracking-[0.4em] font-black">Neural Core v6.2.0</p>
                        </div>
                    </div>
                </div>

                <div className="hidden xl:flex items-center gap-10">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-500 mb-0.5">Stream Sync</span>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${isRunning ? 'bg-indigo-500' : 'bg-slate-800'}`} style={{ opacity: 1 - (i * 0.2), animationDelay: `${i * 0.1}s` }} />)}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">0.00ms</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-500 mb-0.5">AI Integrity</span>
                        <span className="text-[10px] font-mono text-slate-300">SECURE_LEVEL_4</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={async () => {
                            try {
                                await fetch(`${API_BASE_URL}/reset_camera`, { method: 'POST' });
                                setTimeout(() => { setStreamKey(Date.now()); setError(null); setIsRunning(true); }, 1500);
                            } catch (e) { console.error(e); }
                        }}
                        className="p-3 rounded-xl bg-slate-400/5 hover:bg-slate-400/10 border border-white/5 transition-all active:scale-90 group"
                        title="Reset Sensor"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:rotate-180 transition-all duration-500" />
                    </button>

                    <button
                        onClick={() => toggleSystem(isRunning ? 'stop' : 'start')}
                        className={`flex-grow lg:flex-none px-8 md:px-12 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 ${isRunning
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg hover:border-red-500/40'
                            : 'bg-indigo-600 text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:-translate-y-0.5'
                            }`}
                    >
                        {isRunning ? <><Pause className="w-3.5 h-3.5 fill-current" /> Terminate</> : <><Play className="w-3.5 h-3.5 fill-current" /> Initialize</>}
                    </button>
                </div>
            </header>

            {/* Main Visual Display */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-grow">

                {/* Primary Observer Panel */}
                <section className="col-span-1 lg:col-span-8 flex flex-col gap-4 md:gap-6 relative">
                    {/* Dual Feed Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Live Local Feed */}
                        <div className="group rounded-[2rem] overflow-hidden relative aspect-video border border-white/10 bg-black backdrop-blur-md shadow-xl transition-all">
                            <div className="absolute top-3 left-3 z-[20] px-2 py-1 glass-dark rounded-lg border border-white/10 text-[7px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                Live_Stream
                            </div>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {!isRunning && (
                                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center pointer-events-none">
                                    <Power className="w-8 h-8 text-slate-800" />
                                </div>
                            )}
                        </div>

                        {/* AI Analysis Feed */}
                        <div className={`group rounded-[2rem] overflow-hidden relative aspect-video border border-white/10 bg-black backdrop-blur-md shadow-xl transition-all duration-1000`} style={{ boxShadow: isRunning ? `0 0 40px -20px ${accentColor}44` : 'none' }}>
                            <div className="absolute top-3 left-3 z-[30] px-2 py-1 glass-dark rounded-lg border border-white/10 text-[7px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                <Activity className="w-3 h-3" style={{ color: accentColor }} />
                                Neural_Feed
                            </div>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            {isRunning && (
                                <img
                                    src={isLocalHost ? `${API_BASE_URL}/video_feed?sk=${streamKey}` : (processedImage || "")}
                                    className={`w-full h-full object-cover transition-all duration-500 ${processedImage || isLocalHost ? 'opacity-100' : 'opacity-0 scale-95'}`}
                                    style={{ transform: 'scaleX(-1)' }}
                                    alt="Analysis Feed"
                                    key={streamKey}
                                />
                            )}
                            {!isRunning && (
                                <div className="absolute inset-0 bg-[#020617] flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-slate-800" />
                                </div>
                            )}
                            {/* Scanning Anim */}
                            {isRunning && (
                                <div className="absolute inset-x-0 h-[2px] bg-white/20 blur-[2px] animate-[scan_4s_linear_infinite] z-30" />
                            )}
                        </div>
                    </div>

                    {/* Subject Intelligence HUD - Now below camera */}
                    {isRunning && (
                        <div className="w-full flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                                <div className="col-span-1 md:col-span-7 glass-dark p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-700 hover:scale-[1.01]">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Current Aura</span>
                                            <div className="h-px flex-grow bg-white/10" />
                                        </div>
                                        <span className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter transition-all duration-1000 ease-out" style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}44` }}>
                                            {isRunning ? currentEmotion : 'Offline'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Analysis Mode</span>
                                            <span className="font-black text-xl md:text-2xl text-white tracking-tight">Active Expression Tracking</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-0.5 ml-auto text-right">
                                            <span className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Confidence Score</span>
                                            <div className="flex items-end gap-1">
                                                <span className="font-black text-2xl md:text-3xl text-indigo-400">{(data as any)?.confidence?.toFixed(1) || '0.0'}</span>
                                                <span className="text-[10px] text-indigo-500/50 font-black mb-1.5">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-5 flex flex-col gap-4">
                                    <div className="glass-dark p-6 rounded-3xl border border-white/5 flex-grow backdrop-blur-3xl shadow-xl flex flex-col justify-center gap-4">
                                        <div className="flex items-center gap-3 opacity-40">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">AI Synthesis</span>
                                            <div className="h-px flex-grow bg-white/10" />
                                        </div>
                                        <p className="text-sm md:text-base text-slate-200 font-medium italic leading-relaxed">
                                            {data?.message || "Analyzing neutral patterns in environmental data..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Secondary Intelligence Panel */}
                <section className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    {/* Visitor Matrix */}
                    <div className="glass-dark p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all flex items-center justify-between shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all" />
                        <div>
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Visitor Matrix</p>
                            <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter">{data?.visitors || 0}</h3>
                        </div>
                        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-slate-900 border border-white/5 text-indigo-500 shadow-inner">
                            <Users className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                    </div>

                    {/* Spectral Distribution */}
                    <div className="glass-dark p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col gap-6 md:gap-8 flex-grow shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Neural Spectral</p>
                                <div className="h-px w-20 bg-indigo-500/30" />
                            </div>
                            <Activity className="w-4 h-4 text-slate-700" />
                        </div>

                        <div className="flex flex-col gap-5 md:gap-6">
                            {data && Object.entries(data.emotion_stats).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => {
                                const color = `var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`;
                                return (
                                    <div key={emotion} className="group flex flex-col gap-2.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-200 transition-colors uppercase">{emotion}</span>
                                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-slate-600">{count} UNIT</span>
                                        </div>
                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-full"
                                                style={{
                                                    width: `${(count / (Math.max(...Object.values(data.emotion_stats)) + 0.1)) * 100}%`,
                                                    backgroundColor: color,
                                                    boxShadow: `0 0 20px 2px ${color}33`
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="glass-dark p-4 rounded-xl border border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                            <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase">System Operational</span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-600 uppercase">STABLE_v6.4.1</span>
                    </div>
                </section>
            </div>

            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] glass-dark px-8 py-4 rounded-2xl border border-red-500/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{error}</span>
                </div>
            )}
        </main>
    );
}

export function StatusBadge({ icon, label, status }: { icon: React.ReactNode, label: string, status?: string }) {
    const isActive = status?.includes('Connected') || status?.includes('Ready') || status === 'Running';
    return (
        <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 border border-white/5">
            <div className={isActive ? 'text-green-400' : 'text-slate-400'}>{icon}</div>
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-600 font-black uppercase">{label}</span>
                <span className="text-xs font-bold text-slate-200 mt-1">{status || "..."}</span>
            </div>
        </div>
    );
}
