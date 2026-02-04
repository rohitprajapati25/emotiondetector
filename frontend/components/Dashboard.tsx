"use client";

import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../lib/config";
import * as faceapi from 'face-api.js';
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
    system_status: { camera: string; ai_model: string; backend: string; };
}

const EMOTION_THEME_MAP = {
    'happy': 'green',
    'sad': 'blue',
    'angry': 'red',
    'neutral': 'amber',
    'surprised': 'pink',
    'fearful': 'purple',
    'disgusted': 'teal',
    'contempt': 'indigo'
};

const EMOTION_MESSAGES = {
    'happy': "Keep smiling! 😄",
    'sad': "Everything will be okay 🌱",
    'angry': "Take a deep breath 💨",
    'surprised': "What a surprise! 😮",
    'fearful': "Stay calm, you're safe 🛡️",
    'disgusted': "Stay positive! ✨",
    'neutral': "Have a great day! 👋",
    'contempt': "Feeling critical? Research-standard detection active."
}

export default function DashboardContent() {
    const [mounted, setMounted] = useState(false);
    // Initialize with default data safely
    const [data, setData] = useState<BackendData>({
        is_running: false,
        camera_url: "",
        emotion: "Neutral",
        age: "N/A",
        gender: "N/A",
        visitors: 0,
        total_visitors: 0,
        active_visitors: 0,
        message: "System Ready",
        heatmap: "amber",
        emotion_stats: {
            'happy': 0, 'sad': 0, 'angry': 0, 'neutral': 0,
            'surprised': 0, 'fearful': 0, 'disgusted': 0, 'contempt': 0
        },
        system_status: { camera: "Ready", ai_model: "Loading...", backend: "Client-Side" }
    });

    const [error, setError] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");

    const [isRunning, setIsRunning] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isLocalHost, setIsLocalHost] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [streamKey, setStreamKey] = useState(0);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Initial Setup
    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const host = window.location.hostname;
            setIsLocalHost(host === "localhost" || host === "127.0.0.1");
            setIsMobile(window.innerWidth < 768);

            const key = 'aura_session_id';
            let id = localStorage.getItem(key);
            if (!id) {
                id = Math.random().toString(36).substring(2, 15);
                localStorage.setItem(key, id);
            }
            setSessionId(id);

            const loadModels = async () => {
                try {
                    // Models assumed to be in public/models
                    // Use window.location.origin to ensure absolute path, avoiding relative path issues
                    const MODEL_URL = window.location.origin + '/models';
                    console.log("[AURA] Loading models from:", MODEL_URL);
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                    ]);
                    setModelsLoaded(true);
                    console.log("[AURA] FaceAPI Models Loaded");
                    setData(d => ({ ...d, system_status: { ...d.system_status, ai_model: "Active (Client)" } }));
                } catch (e) {
                    console.error("Model load failed", e);
                    setError("Failed to load AI Models. Check /models folder.");
                }
            };
            loadModels();
        }
    }, []);

    // Camera Start/Stop
    useEffect(() => {
        if (isRunning && typeof navigator !== "undefined") {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setError(null);
                } catch (err) {
                    console.error(err);
                    setError("Camera Access Denied");
                }
            };
            startCamera();
        } else {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [isRunning]);

    // Client-Side Detection Loop
    useEffect(() => {
        if (!isRunning || !modelsLoaded || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        let animationId: number;
        let lastTime = 0;
        const FPS = 24;
        const interval = 1000 / FPS;

        const detect = async (time: number) => {
            if (time - lastTime >= interval) {
                lastTime = time;
                if (video.readyState === 4) { // ENOUGH_DATA

                    // Match canvas size to video
                    const displaySize = { width: video.videoWidth, height: video.videoHeight };
                    faceapi.matchDimensions(canvas, displaySize);

                    // DETECT FACES
                    // Using TinyFaceDetector for speed on mobile/web
                    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    const resizedDetections = faceapi.resizeResults(detections, displaySize);

                    // Draw
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Clear previous frame
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Custom UI Logic
                        if (resizedDetections.length > 0) {
                            const det = resizedDetections[0];
                            const { expressions } = det;
                            // Find dominant emotion
                            const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
                            const dominant = sorted[0][0]; // e.g. 'happy'
                            const score = sorted[0][1];

                            // Update State if confidence is high enough
                            if (score > 0.3) {
                                const emotionLabel = dominant.charAt(0).toUpperCase() + dominant.slice(1);
                                setData(prev => ({
                                    ...prev,
                                    emotion: emotionLabel,
                                    heatmap: EMOTION_THEME_MAP[dominant as keyof typeof EMOTION_THEME_MAP] || 'amber',
                                    message: EMOTION_MESSAGES[dominant as keyof typeof EMOTION_MESSAGES] || "Processing...",
                                    emotion_stats: {
                                        ...prev.emotion_stats,
                                        [dominant]: (prev.emotion_stats[dominant] || 0) + 1
                                    }
                                }));

                                // Draw Custom Box
                                const { x, y, width: w, height: h } = det.detection.box;
                                const themeColor = EMOTION_THEME_MAP[dominant as keyof typeof EMOTION_THEME_MAP] || 'amber';

                                // Glowing Box
                                ctx.strokeStyle = themeColor === 'amber' ? 'orange' : themeColor;
                                ctx.lineWidth = 3;
                                ctx.shadowColor = themeColor === 'amber' ? 'orange' : themeColor;
                                ctx.shadowBlur = 10;
                                ctx.strokeRect(x, y, w, h);
                                ctx.shadowBlur = 0;

                                // Draw Neural Dots (Landmarks) - cool visual
                                const landmarks = det.landmarks;
                                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                                landmarks.positions.forEach(pt => {
                                    ctx.beginPath();
                                    ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
                                    ctx.fill();
                                });

                                // Draw Label
                                ctx.font = "bold 16px monospace";
                                ctx.fillStyle = themeColor === 'amber' ? 'orange' : themeColor;
                                ctx.fillText(`${emotionLabel} ${(score * 100).toFixed(0)}%`, x, y - 10);
                            }
                        }
                    }
                }
            }
            animationId = requestAnimationFrame(detect);
        };

        detect(0);

        return () => cancelAnimationFrame(animationId);
    }, [isRunning, modelsLoaded]);


    if (!mounted) return null;

    const currentEmotion = data?.emotion || "Neutral";
    // Construct valid CSS variable for color or fallback
    const accentColor = `var(--${data?.heatmap || 'amber'})`;

    return (
        <main className="min-h-screen p-3 md:p-6 bg-[#020617] text-slate-50 relative flex flex-col gap-4 md:gap-6 overflow-hidden selection:bg-indigo-500/30" data-emotion={currentEmotion}>

            {/* Liquid Background Grain/Blur */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full blur-[140px] transition-all duration-1000"
                    style={{ backgroundColor: accentColor }}
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
                            <p className="text-slate-500 uppercase text-[7px] tracking-[0.4em] font-black">Client-Side AI v8.0.0</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={async () => {
                            setIsResetting(true);
                            // Simple reset simulation
                            setTimeout(() => {
                                setStreamKey(Date.now());
                                setIsResetting(false);
                            }, 1000);
                        }}
                        disabled={isResetting}
                        className={`p-3 rounded-xl bg-slate-400/5 hover:bg-slate-400/10 border border-white/5 transition-all active:scale-90 group ${isResetting ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Reset Sensor"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-all duration-500 ${isResetting ? 'animate-spin text-indigo-400' : 'group-hover:rotate-180'}`} />
                    </button>

                    <button
                        onClick={() => setIsRunning(!isRunning)}
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

                        {/* Video and Canvas Layer */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            {isRunning ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ transform: 'scaleX(-1)' }} // Mirror effect
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
                                        style={{ transform: 'scaleX(-1)' }} // Overlay must match mirror
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-6">
                                    <Power className="w-16 h-16 text-slate-800" />
                                    <p className="font-black uppercase tracking-[0.5em] text-[10px] text-slate-600">Visual Core Disconnected</p>
                                </div>
                            )}
                        </div>

                        {/* HUD Interface Overlays */}
                        <div className="absolute inset-0 pointer-events-none z-30">
                            {isRunning && (
                                <div className="absolute inset-x-0 h-[2px] bg-white/20 blur-[2px] animate-[scan_4s_linear_infinite]" />
                            )}
                            <div className="absolute top-8 left-8 p-3 glass-dark rounded-2xl border border-white/10 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`} />
                                <span className="text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase">
                                    {modelsLoaded ? "AI_ACTIVE" : "AI_LOADING..."}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Result Panel */}
                    {isRunning && (
                        <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex-grow glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                                <span className="text-5xl md:text-7xl font-black tracking-tighter transition-all duration-1000" style={{ color: accentColor, textShadow: `0 0 40px ${accentColor}44` }}>
                                    {currentEmotion}
                                </span>
                            </div>
                            {data?.message && (
                                <div className="w-full md:max-w-xs glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl flex flex-col justify-center">
                                    <p className="italic text-slate-300 font-medium leading-relaxed text-sm">
                                        &quot;{data.message}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Secondary Intelligence Panel (Stats) */}
                <section className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    {/* Visitor Matrix (Simulated for client-side demo) */}
                    <div className="glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all flex items-center justify-between shadow-2xl">
                        <div>
                            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Visitor Matrix</p>
                            <div className="flex flex-col">
                                <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter" title="Total unique visitors">
                                    1
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Live Session
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 rounded-3xl bg-slate-900 border border-white/5 text-indigo-500 shadow-inner">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>

                    <div className="glass-dark p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-8 flex-grow shadow-2xl">
                        <div className="flex flex-col gap-6">
                            {Object.entries(data.emotion_stats).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => {
                                const color = `var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`;
                                return (
                                    <div key={emotion} className="group flex flex-col gap-2.5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{emotion}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-600">{count} UNIT</span>
                                        </div>
                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full transition-all duration-1000 rounded-full"
                                                style={{ width: `${Math.min((count / ((Math.max(...Object.values(data.emotion_stats)) + 1))) * 100, 100)}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="glass-dark p-4 rounded-2xl border border-white/5 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono text-slate-500">
                            Running Client-Side face-api.js • Direct Video
                        </span>
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

// Minimal Status Badge export if needed elsewhere
export function StatusBadge({ icon, label, status }: { icon: React.ReactNode, label: string, status?: string }) {
    return (
        <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 border border-white/5">
            <div className="text-slate-400">{icon}</div>
            <div>{label}</div>
        </div>
    )
}
