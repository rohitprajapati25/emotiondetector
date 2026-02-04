"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { API_BASE_URL } from "../lib/config";
import {
    Activity,
    Users,
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
    total_visitors?: number;
    active_visitors?: number;
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
    const [isResetting, setIsResetting] = useState(false);

    // Generate/Persistent Session ID for unique visitor tracking
    const sessionId = useMemo(() => {
        const key = 'aura_session_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            localStorage.setItem(key, id);
        }
        return id;
    }, []);
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

                            // Optimized resolution (480x270) for high-accuracy mobile detection
                            canvas.width = 480;
                            canvas.height = 270;

                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            // Quality increased to 0.6 for better detail
                            const imageData = canvas.toDataURL("image/jpeg", 0.6);

                            try {
                                const res = await fetch(`${API_BASE_URL}/analyze`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ image: imageData })
                                });

                                if (res.ok) {
                                    const result = await res.json();
                                    setProcessedImage(result.image);

                                    // NEW: Sync local data state with analyzed result for instant UI update
                                    if (result.data) {
                                        setData(prev => ({
                                            ...prev!,
                                            emotion: result.data.emotion,
                                            age: result.data.age,
                                            gender: result.data.gender,
                                            heatmap: result.data.heatmap,
                                            message: result.data.message,
                                            is_running: true
                                        }));
                                    }
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
                const res = await fetch(`${API_BASE_URL}/status?session_id=${sessionId}`);
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
            <header className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 glass-dark p-3 md:px-8 md:py-3 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-full scale-150 transition-transform group-hover:scale-110" />
                        <div className="relative p-2.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
                            <Activity className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-700" style={{ color: accentColor }} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-black tracking-tighter text-white flex items-center gap-2">
                            AURA <span className="text-slate-500 font-extralight tracking-widest">VISION</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-1 h-1 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                            <p className="text-slate-500 uppercase text-[7px] tracking-[0.4em] font-black">Neural Core v6.2.0</p>
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
                                setIsResetting(true);
                                await fetch(`${API_BASE_URL}/reset_camera`, { method: 'POST' });
                                setTimeout(() => {
                                    setStreamKey(Date.now());
                                    setError(null);
                                    setIsRunning(true);
                                    setIsResetting(false);
                                }, 3000);
                            } catch (e) {
                                console.error(e);
                                setIsResetting(false);
                            }
                        }}
                        disabled={isResetting}
                        className={`p-3 rounded-xl bg-slate-400/5 hover:bg-slate-400/10 border border-white/5 transition-all active:scale-90 group ${isResetting ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Reset Sensor"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-all duration-500 ${isResetting ? 'animate-spin text-indigo-400' : 'group-hover:rotate-180'}`} />
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
                <section className="col-span-1 lg:col-span-8 flex flex-col gap-4 relative">
                    <div className={`group rounded-[3rem] overflow-hidden relative flex-grow min-h-[420px] md:min-h-[580px] border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl transition-all duration-1000`} style={{ boxShadow: isRunning ? `0 0 80px -40px ${accentColor}66` : 'none' }}>

                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {/* Video Layer Container */}
                        <div className="absolute inset-0">
                            {isRunning && !isLocalHost && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover transition-all duration-1000 ${processedImage ? 'opacity-40 scale-105' : 'opacity-100 scale-100'}`}
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            )}
                            {isRunning && (
                                <img
                                    src={isLocalHost ? `${API_BASE_URL}/video_feed?sk=${streamKey}` : (processedImage || "")}
                                    className={`absolute inset-0 w-full h-full object-cover z-10 transition-all duration-500 ${processedImage || isLocalHost ? 'opacity-100' : 'opacity-0 scale-95'}`}
                                    style={{ transform: 'scaleX(-1)' }}
                                    alt="Vision Feed"
                                    key={streamKey}
                                />
                            )}
                            {!isRunning && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#020617]">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
                                        <Power className="w-16 h-16 text-slate-800 relative z-10" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="font-black uppercase tracking-[0.5em] text-[10px] text-slate-600">Visual Core Disconnected</p>
                                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* HUD Interface Overlays (Keep only scanning and technical bits) */}
                        <div className="absolute inset-0 pointer-events-none z-20">
                            {isRunning && (
                                <div className="absolute inset-x-0 h-[2px] bg-white/20 blur-[2px] animate-[scan_4s_linear_infinite] z-30" />
                            )}
                            <div className="absolute top-8 left-8 p-3 glass-dark rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`} />
                                <span className="text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase">Input_Main</span>
                            </div>
                            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                                <div className="px-3 py-1.5 glass-dark rounded-xl border border-white/5 text-[8px] font-black text-slate-500 tracking-widest uppercase">
                                    Encrypted_X2
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Result Panel Below Camera (Responsive Flex) */}
                    {isRunning && (
                        <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                            {/* Current Aura Dashboard */}
                            <div className="flex-grow glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl group/stats">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Current Aura</span>
                                        <div className="h-px w-12 bg-white/10" />
                                    </div>
                                    <span className="text-5xl md:text-7xl font-black tracking-tighter transition-all duration-1000" style={{ color: accentColor, textShadow: `0 0 40px ${accentColor}44` }}>
                                        {currentEmotion}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Profile</span>
                                        <span className="font-black text-lg text-white">
                                            {(data?.age && data.age !== "N/A") ? (
                                                <>{data.age} <span className="text-slate-600 font-light mx-1">/</span> {data.gender}</>
                                            ) : (
                                                <span className="text-slate-500 animate-pulse">Scanning...</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Match</span>
                                        <div className="flex items-end gap-1">
                                            <span className="font-black text-lg text-white">96.8</span>
                                            <span className="text-xs text-indigo-500 font-black mb-1">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Synthesis Message */}
                            {data?.message && (
                                <div className="w-full md:max-w-xs glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl flex flex-col justify-center relative overflow-hidden group/synthesis">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover/synthesis:opacity-100 transition-opacity duration-700" />
                                    <div className="flex items-center gap-2 mb-3 opacity-30">
                                        <div className="w-8 h-[1px] bg-slate-400 group-hover/synthesis:w-12 transition-all duration-700" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">AI Synthesis</span>
                                    </div>
                                    <p className="italic text-slate-300 font-medium leading-relaxed text-sm relative z-10 transition-transform duration-500 group-hover/synthesis:scale-[1.02]">
                                        &quot;{data.message}&quot;
                                    </p>
                                    <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent w-full" />
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Secondary Intelligence Panel */}
                <section className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    {/* Visitor Matrix */}
                    <div className="glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all flex items-center justify-between shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all" />
                        <div>
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Visitor Matrix</p>
                            <div className="flex flex-col">
                                <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter" title="Total unique visitors">
                                    {data?.total_visitors || 0}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {data?.active_visitors || 0} Live Now
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-slate-900 border border-white/5 text-indigo-500 shadow-inner">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>

                    {/* Spectral Distribution */}
                    <div className="glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-8 flex-grow shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Neural Spectral</p>
                                <div className="h-px w-20 bg-indigo-500/30" />
                            </div>
                            <Activity className="w-4 h-4 text-slate-700" />
                        </div>

                        <div className="flex flex-col gap-6">
                            {data && Object.entries(data.emotion_stats).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => {
                                const color = `var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`;
                                return (
                                    <div key={emotion} className="group flex flex-col gap-2.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-200 transition-colors">{emotion}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">{count} UNIT</span>
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
                    <div className="glass-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                            <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase">System Operational</span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-600">STABLE_v6.4.1</span>
                    </div>
                </section>
            </div>

            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] glass-dark px-8 py-4 rounded-2xl border border-red-500/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-red-500">{error}</span>
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






