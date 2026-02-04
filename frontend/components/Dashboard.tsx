// "use client";

// import { useEffect, useState, useRef } from "react";
// import { API_BASE_URL } from "../lib/config";
// import {
//     Activity,
//     Users,
//     Smile,
//     Camera,
//     Globe,
//     RefreshCw,
//     AlertCircle,
//     Play,
//     Pause,
//     Power
// } from "lucide-react";

// // Types
// interface EmotionStats {
//     [key: string]: number;
// }

// interface SystemStatus {
//     camera: string;
//     ai_model: string;
//     backend: string;
// }

// interface BackendData {
//     is_running: boolean;
//     camera_url: string;
//     emotion: string;
//     age: string;
//     gender: string;
//     visitors: number;
//     message: string;
//     heatmap: string;
//     emotion_stats: EmotionStats;
//     system_status: SystemStatus;
// }

// const EMOTION_THEME_MAP = {
//     'Happy': 'happy',
//     'Sad': 'sad',
//     'Angry': 'angry',
//     'Neutral': 'amber',
//     'Surprise': 'pink',
//     'Fear': 'purple',
//     'Disgust': 'teal'
// };

// export default function DashboardContent() {
//     const [mounted, setMounted] = useState(false);
//     const [data, setData] = useState<BackendData | null>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [isRunning, setIsRunning] = useState(false);
//     const [streamKey, setStreamKey] = useState(0);
//     const [processedImage, setProcessedImage] = useState<string | null>(null);
//     const [isLocalHost, setIsLocalHost] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);
//     const videoRef = useRef<HTMLVideoElement | null>(null);
//     const canvasRef = useRef<HTMLCanvasElement | null>(null);
//     const isAnalyzingRef = useRef(false);

//     useEffect(() => {
//         setMounted(true);
//         if (typeof window !== "undefined") {
//             const host = window.location.hostname;
//             setIsLocalHost(host === "localhost" || host === "127.0.0.1");
//             setIsMobile(window.innerWidth < 768);

//             const handleResize = () => setIsMobile(window.innerWidth < 768);
//             window.addEventListener('resize', handleResize);
//             return () => window.removeEventListener('resize', handleResize);
//         }
//     }, []);

//     // 1. Browser Camera Administration (Only if not LocalHost)
//     useEffect(() => {
//         if (!isLocalHost && isRunning && typeof navigator !== "undefined") {
//             const startCamera = async () => {
//                 try {
//                     // Mobile-Optimized Constraints
//                     const constraints = {
//                         video: {
//                             facingMode: 'user',
//                             width: isMobile ? { ideal: 640 } : { ideal: 1280 },
//                             height: isMobile ? { ideal: 480 } : { ideal: 720 },
//                             frameRate: { ideal: 24, max: 30 }
//                         }
//                     };

//                     const stream = await navigator.mediaDevices.getUserMedia(constraints);
//                     if (videoRef.current) {
//                         videoRef.current.srcObject = stream;
//                     }
//                 } catch (err) {
//                     console.error("Camera access denied:", err);
//                     setError("Camera Access Denied");
//                 }
//             };
//             startCamera();
//         } else {
//             // Stop camera when not running
//             if (videoRef.current?.srcObject) {
//                 const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
//                 tracks.forEach(track => track.stop());
//                 videoRef.current.srcObject = null;
//             }
//         }
//     }, [isRunning, isLocalHost, isMobile]);

//     // Ultra-Optimized Frame Capture Loop (Per User Guide)
//     useEffect(() => {
//         let frameId: number;
//         let lastTimestamp = 0;
//         const FPS_THROTTLE = isMobile ? 8 : 12; // Increased for "Super Fast" feel
//         const interval = 1000 / FPS_THROTTLE;

//         const processFrame = async (timestamp: number) => {
//             if (!isRunning) return;

//             if (timestamp - lastTimestamp >= interval) {
//                 lastTimestamp = timestamp;

//                 if (videoRef.current && canvasRef.current && !isAnalyzingRef.current) {
//                     const video = videoRef.current;
//                     const canvas = canvasRef.current;

//                     if (video.readyState >= 2) {
//                         const ctx = canvas.getContext("2d");
//                         if (ctx) {
//                             isAnalyzingRef.current = true;

//                             // Fixed Small Canvas (320x180) = 4x Less data than HD
//                             canvas.width = 320;
//                             canvas.height = 180;

//                             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//                             const imageData = canvas.toDataURL("image/jpeg", isMobile ? 0.2 : 0.3); // Compressed for faster transmission

//                             try {
//                                 const res = await fetch(`${API_BASE_URL}/analyze`, {
//                                     method: 'POST',
//                                     headers: { 'Content-Type': 'application/json' },
//                                     body: JSON.stringify({ image: imageData })
//                                 });

//                                 if (res.ok) {
//                                     const result = await res.json();
//                                     setProcessedImage(result.image);
//                                 }
//                             } catch (err) {
//                                 console.error("Cloud Analytics error:", err);
//                             } finally {
//                                 isAnalyzingRef.current = false;
//                             }
//                         }
//                     }
//                 }
//             }
//             frameId = requestAnimationFrame(processFrame);
//         };

//         if (!isLocalHost && isRunning) {
//             frameId = requestAnimationFrame(processFrame);
//         }

//         return () => {
//             if (frameId) cancelAnimationFrame(frameId);
//         };
//     }, [isRunning, isLocalHost, isMobile]);

//     // Polling logic for global stats
//     useEffect(() => {
//         let isMounted = true;
//         const fetchStatus = async () => {
//             try {
//                 const res = await fetch(`${API_BASE_URL}/status`);
//                 if (!res.ok) throw new Error("Backend connection failed");
//                 const json = await res.json();

//                 if (isMounted) {
//                     setData(prev => {
//                         if (JSON.stringify(prev) === JSON.stringify(json)) return prev;
//                         return json;
//                     });
//                     setError(null);
//                     setLoading(false); // Only stop loading when we actually have data
//                 }
//             } catch (err) {
//                 if (isMounted) setError("Cloud Brain: Connecting...");
//             }
//         };

//         fetchStatus();
//         const interval = setInterval(fetchStatus, 3000);
//         return () => {
//             isMounted = false;
//             clearInterval(interval);
//         };
//     }, []);

//     const toggleSystem = async (command: 'start' | 'stop') => {
//         try {
//             const res = await fetch(`${API_BASE_URL}/control`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ command })
//             });
//             if (res.ok) {
//                 setIsRunning(command === 'start');
//                 setStreamKey(Date.now());
//             }
//         } catch (err) {
//             console.error("Control failed:", err);
//             setError("Control command failed");
//         }
//     };

//     if (!mounted) return null;

//     const currentEmotion = data?.emotion || "Neutral";
//     const accentColor = `var(--${data?.heatmap || 'amber'})`;

//     // In Cloud mode, we check if the Browser Camera is active
//     const isBrowserCameraActive = !!videoRef.current?.srcObject;
//     const isCameraConnected = isBrowserCameraActive;

//     return (
//         <main className="min-h-screen p-4 md:p-8 bg-grid relative flex flex-col gap-6 overflow-x-hidden" data-emotion={currentEmotion}>

//             {/* Dynamic Border Glow */}
//             <div
//                 className="fixed inset-0 pointer-events-none transition-all duration-1000 z-50"
//                 style={{
//                     boxShadow: isRunning
//                         ? `inset 0 0 120px color-mix(in srgb, ${accentColor} 30%, transparent)`
//                         : 'inset 0 0 120px rgba(255, 0, 0, 0.1)',
//                     border: isRunning
//                         ? `${mounted && window.innerWidth < 768 ? '3px' : '6px'} solid color-mix(in srgb, ${accentColor} 50%, transparent)`
//                         : `${mounted && window.innerWidth < 768 ? '3px' : '6px'} solid rgba(255, 0, 0, 0.2)`
//                 }}
//             />

//             {/* Header Section */}
//             <header className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 md:gap-6 glass p-4 md:p-6 rounded-2xl animate-glow relative z-10">
//                 <div className="flex items-center gap-3 md:gap-4">
//                     <div className="p-2 rounded-xl bg-opacity-20 transition-colors duration-1000" style={{ backgroundColor: accentColor }}>
//                         <Activity className="w-6 h-6 md:w-7 md:h-7" style={{ color: accentColor }} />
//                     </div>
//                     <div>
//                         <h1 className="text-xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 leading-tight">
//                             Exhibition AI Brain
//                         </h1>
//                         <p className="text-slate-400 uppercase text-[8px] md:text-[10px] tracking-[0.4em] font-bold">Wireless Core v5.1</p>
//                     </div>
//                 </div>

//                 {/* System Camera Status */}
//                 <div className="flex-grow w-full lg:max-w-xl px-0 lg:px-4 flex items-center justify-start lg:justify-center order-3 lg:order-2">
//                     <div className={`w-full lg:w-auto px-4 md:px-6 py-2 md:py-3 rounded-xl border flex items-center gap-3 transition-colors duration-500 ${isCameraConnected ? 'glass-accent border-green-500/30' : 'bg-red-900/10 border-red-500/20'}`}>
//                         {isCameraConnected ? (
//                             <Camera className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
//                         ) : (
//                             <Camera className="w-4 h-4 md:w-5 md:h-5 text-red-500 opacity-50" />
//                         )}
//                         <div className="flex flex-col">
//                             <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-slate-500">Video Source</span>
//                             <span className={`text-xs md:text-sm font-bold ${isCameraConnected ? 'text-green-400' : 'text-red-400'}`}>
//                                 {isCameraConnected ? "Browser Camera Active" : "Searching..."}
//                             </span>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="flex items-center gap-2 md:gap-4 self-stretch lg:self-auto order-2 lg:order-3">
//                     <button
//                         onClick={async () => {
//                             try {
//                                 await fetch(`${API_BASE_URL}/reset_camera`, { method: 'POST' });
//                                 setTimeout(() => { setStreamKey(Date.now()); setError(null); setIsRunning(true); }, 2000);
//                             } catch (e) { console.error(e); }
//                         }}
//                         className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 md:px-5 py-2.5 md:py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] md:text-xs border border-white/5"
//                     >
//                         <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
//                         <span>Reset</span>
//                     </button>

//                     {!isRunning ? (
//                         <button
//                             onClick={() => toggleSystem('start')}
//                             className="flex-1 lg:flex-none flex items-center justify-center gap-2 md:gap-3 bg-green-600 hover:bg-green-500 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs md:text-base shadow-[0_0_20px_rgba(34,197,94,0.4)]"
//                         >
//                             <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" />
//                             Start AI
//                         </button>
//                     ) : (
//                         <button
//                             onClick={() => toggleSystem('stop')}
//                             className="flex-1 lg:flex-none flex items-center justify-center gap-2 md:gap-3 bg-red-600 hover:bg-red-500 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs md:text-base shadow-[0_0_20px_rgba(239,68,68,0.4)]"
//                         >
//                             <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
//                             Stop AI
//                         </button>
//                     )}
//                 </div>
//             </header>

//             {/* Main Grid Layout */}
//             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow relative z-10">

//                 <section className="col-span-1 lg:col-span-8 flex flex-col gap-4 md:gap-6 relative">
//                     <div className={`rounded-3xl overflow-hidden relative flex-grow min-h-[450px] md:min-h-[600px] ${isMobile ? 'aspect-[2/3]' : 'aspect-video'} border-2 transition-colors duration-1000 bg-black flex items-center justify-center`} style={{ borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)` }}>

//                         {/* Hidden processing canvas */}
//                         <canvas ref={canvasRef} width={320} height={180} style={{ display: 'none' }} />

//                         {/* Local Video Feed for Instant Feedback */}
//                         {isRunning && !isLocalHost && (
//                             <video
//                                 ref={videoRef}
//                                 autoPlay
//                                 playsInline
//                                 muted
//                                 className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${processedImage ? 'opacity-30' : 'opacity-100'}`}
//                                 style={{ transform: 'scaleX(-1)' }} // Native Mirror Mode
//                             />
//                         )}

//                         {isRunning ? (
//                             <>
//                                 {/* AI Processed Overlay */}
//                                 <img
//                                     src={isLocalHost ? `${API_BASE_URL}/video_feed?sk=${streamKey}` : (processedImage || "")}
//                                     className={`absolute inset-0 w-full h-full object-cover relative z-10 transition-opacity duration-300 ${processedImage || isLocalHost ? 'opacity-100' : 'opacity-0'}`}
//                                     style={{ transform: 'scaleX(-1)' }} // Native Mirror Mode
//                                     alt="AI Stream"
//                                     key={streamKey}
//                                 />

//                                 <div className="absolute top-4 left-4 px-3 py-1.5 glass-accent rounded-xl flex items-center gap-2 border border-white/10 z-20">
//                                     <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
//                                     <span className="text-[8px] md:text-xs font-black tracking-widest uppercase text-white">LIVE AI ANALYSIS</span>
//                                 </div>
//                             </>
//                         ) : (
//                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-40 bg-slate-900">
//                                 <Power className="w-20 h-20 text-slate-600" />
//                                 <p className="font-black uppercase tracking-[0.5em] text-sm text-slate-500 text-center">System Standby</p>
//                             </div>
//                         )}
//                     </div>

//                     {/* Result HUD */}
//                     {isRunning && (
//                         <div className="lg:absolute lg:inset-x-8 lg:bottom-8 static flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-4 pointer-events-none mt-2 lg:mt-0 z-20">
//                             <div className="glass p-4 md:p-8 rounded-2xl flex flex-col gap-1 md:gap-2 min-w-[300px] border-l-8 backdrop-blur-2xl shadow-2xl transition-all duration-1000 pointer-events-auto" style={{ borderColor: accentColor }}>
//                                 <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Active Subject</span>
//                                 <span className="text-4xl md:text-7xl font-black leading-none" style={{ color: accentColor }}>{currentEmotion}</span>
//                                 <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
//                                     <div className="flex flex-col">
//                                         <span className="text-slate-600 text-[9px] font-black uppercase">Age</span>
//                                         <span className="font-bold text-lg">{data?.age}</span>
//                                     </div>
//                                     <div className="flex flex-col">
//                                         <span className="text-slate-600 text-[9px] font-black uppercase">Gender</span>
//                                         <span className="font-bold text-lg">{data?.gender}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="glass p-4 md:p-6 rounded-2xl max-w-sm text-center lg:text-right backdrop-blur-2xl pointer-events-auto border border-white/10">
//                                 <p className="text-sm md:text-xl italic font-semibold text-slate-200">{data?.message}</p>
//                             </div>
//                         </div>
//                     )}
//                 </section>

//                 <section className="col-span-1 lg:col-span-4 flex flex-col gap-6">
//                     <div className="glass p-6 md:p-8 rounded-3xl flex items-center justify-between border-b-8 border-blue-600 relative overflow-hidden shadow-2xl">
//                         <div className="relative z-10">
//                             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Visitors</p>
//                             <h3 className="text-4xl md:text-6xl font-black mt-2">{data?.visitors}</h3>
//                         </div>
//                         <Users className="w-10 h-10 text-blue-400 opacity-50" />
//                     </div>

//                     <div className="glass p-6 md:p-8 rounded-3xl flex flex-col gap-6 flex-grow shadow-2xl">
//                         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-4">Emotion Distribution</p>
//                         <div className="flex flex-col gap-5 mt-2">
//                             {data && Object.entries(data.emotion_stats).map(([emotion, count]) => (
//                                 <div key={emotion} className="flex flex-col gap-1.5">
//                                     <div className="flex justify-between text-[9px] font-black">
//                                         <span className="uppercase tracking-widest text-slate-400">{emotion}</span>
//                                         <span className="opacity-60">{count}</span>
//                                     </div>
//                                     <div className="h-2 bg-background/50 rounded-full overflow-hidden border border-white/5">
//                                         <div
//                                             className="h-full transition-all duration-1000"
//                                             style={{
//                                                 width: `${(count / (Math.max(...Object.values(data.emotion_stats)) + 0.1)) * 100}%`,
//                                                 backgroundColor: `var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`,
//                                                 boxShadow: `0 0 10px var(--${EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP] || 'amber'})`
//                                             }}
//                                         />
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </section>
//             </div>

//             {error && (
//                 <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-full flex items-center gap-4 text-red-400 animate-pulse z-[100] border border-red-500/50">
//                     <AlertCircle className="w-5 h-5" />
//                     <span className="text-sm font-black uppercase tracking-widest">{error}</span>
//                 </div>
//             )}

//             <footer className="flex justify-between items-center text-[9px] text-slate-600 font-black uppercase tracking-widest mt-2 opacity-50">
//                 <span>© 2026 EXHIBITION_CORE</span>
//                 <div className="flex gap-6">
//                     <span>LIVE: {isRunning ? 'SECURE' : 'STANDBY'}</span>
//                     <span>BRAIN: PYTHON_AI</span>
//                 </div>
//             </footer>
//         </main>
//     );
// }

// export function StatusBadge({ icon, label, status }: { icon: React.ReactNode, label: string, status?: string }) {
//     const isActive = status?.includes('Connected') || status?.includes('Ready') || status === 'Running';
//     return (
//         <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 border border-white/5">
//             <div className={isActive ? 'text-green-400' : 'text-slate-400'}>{icon}</div>
//             <div className="flex flex-col">
//                 <span className="text-[9px] text-slate-600 font-black uppercase">{label}</span>
//                 <span className="text-xs font-bold text-slate-200 mt-1">{status || "..."}</span>
//             </div>
//         </div>
//     );
// }



"use client";

import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../lib/config";
import {
    Activity, Users, Camera, RefreshCw, AlertCircle,
    Play, Pause, BrainCircuit, Scan, Fingerprint
} from "lucide-react";

// --- Types ---
interface EmotionStats { [key: string]: number; }
interface BackendData {
    is_running: boolean;
    emotion: string;
    age: string;
    gender: string;
    visitors: number;
    message: string;
    heatmap: string;
    emotion_stats: EmotionStats;
}

const EMOTION_THEME_MAP: Record<string, string> = {
    'Happy': 'var(--happy)', 'Sad': 'var(--sad)', 'Angry': 'var(--angry)',
    'Neutral': 'var(--amber)', 'Surprise': 'var(--pink)', 'Fear': 'var(--purple)', 'Disgust': 'var(--teal)'
};

export default function DashboardContent() {
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<BackendData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isAnalyzingRef = useRef(false);

    useEffect(() => { setMounted(true); }, []);

    // 1. Camera Control
    useEffect(() => {
        if (isRunning) {
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: 640, height: 480 }
                    });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } catch (err) { setError("Camera Access Denied"); }
            };
            startCamera();
        } else if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }, [isRunning]);

    // 2. AI Processing Loop
    useEffect(() => {
        let frameId: number;
        const processFrame = async () => {
            if (!isRunning) return;
            if (videoRef.current && canvasRef.current && !isAnalyzingRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (video.readyState >= 2) {
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        isAnalyzingRef.current = true;
                        ctx.drawImage(video, 0, 0, 320, 180);
                        const imageData = canvas.toDataURL("image/jpeg", 0.3);
                        try {
                            const res = await fetch(`${API_BASE_URL}/analyze`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image: imageData })
                            });
                            if (res.ok) {
                                const result = await res.json();
                                setProcessedImage(result.image);
                                if (result.stats) setData(result.stats);
                            }
                        } catch (err) { console.error(err); }
                        finally { isAnalyzingRef.current = false; }
                    }
                }
            }
            frameId = requestAnimationFrame(processFrame);
        };
        if (isRunning) frameId = requestAnimationFrame(processFrame);
        return () => cancelAnimationFrame(frameId);
    }, [isRunning]);

    if (!mounted) return null;
    const accentColor = EMOTION_THEME_MAP[data?.emotion || 'Neutral'] || 'var(--amber)';

    return (
        <main className="min-h-screen p-4 md:p-8 bg-grid text-white flex flex-col gap-6 overflow-x-hidden" style={{ '--accent': accentColor } as any}>

            {/* Header */}
            <header className="glass p-5 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 z-10 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                        <BrainCircuit className="w-8 h-8" style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter italic uppercase">Neural_Eye v5</h1>
                        <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em]">BRAIN_STATUS: {isRunning ? 'ACTIVE' : 'STANDBY'}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`w-full md:w-auto px-10 py-3 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isRunning ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                        }`}
                >
                    {isRunning ? <Pause /> : <Play />} {isRunning ? 'Stop System' : 'Initialize'}
                </button>
            </header>

            {/* Split Video Feed Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Feed */}
                <div className="relative glass rounded-[2rem] overflow-hidden aspect-video bg-[#05070a] border border-white/5">
                    <div className="absolute top-4 left-4 z-20 glass-accent px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-2">
                        <Camera size={12} className="text-blue-400" /> SOURCE_INPUT
                    </div>
                    {isRunning ? (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] opacity-60" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <Fingerprint size={48} className="text-slate-800 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-700 tracking-[0.4em]">WAITING_FOR_SIGNAL</span>
                        </div>
                    )}
                </div>

                {/* Right Feed (AI) */}
                <div className="relative glass rounded-[2rem] overflow-hidden aspect-video bg-black border-2 transition-all duration-500" style={{ borderColor: isRunning ? accentColor : 'transparent' }}>
                    <div className="absolute top-4 left-4 z-20 bg-[#f59e0b] text-black px-4 py-1 rounded-xl text-[10px] font-black flex items-center gap-2">
                        <Scan size={12} /> NEURAL_SYNC
                    </div>
                    {processedImage ? (
                        <img src={processedImage} alt="AI" className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Activity className="w-12 h-12 text-slate-800 animate-pulse" />
                        </div>
                    )}
                    {isRunning && <div className="absolute inset-0 pointer-events-none z-30 scan-line" />}
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Subject Details & Multi-Emotion Bars */}
                <div className="lg:col-span-8 glass p-6 md:p-8 rounded-[2.5rem] border-t-4" style={{ borderColor: accentColor }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Detection Text */}
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Primary Emotion</span>
                            <h2 className="text-6xl font-black italic tracking-tighter mb-6" style={{ color: accentColor }}>
                                {data?.emotion || "Scanning..."}
                            </h2>
                            <div className="flex gap-8">
                                <div className="flex flex-col"><span className="text-slate-600 text-[10px] font-bold uppercase">Age</span><span className="text-2xl font-black">{data?.age || '--'}</span></div>
                                <div className="flex flex-col"><span className="text-slate-600 text-[10px] font-bold uppercase">Gender</span><span className="text-2xl font-black uppercase">{data?.gender || '---'}</span></div>
                            </div>
                        </div>

                        {/* Multi-Progress Bars */}
                        <div className="flex flex-col gap-4 bg-black/20 p-5 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Neural Distribution</p>
                            {data && Object.entries(data.emotion_stats).map(([emotion, count]) => (
                                <div key={emotion} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                                        <span className="text-slate-400">{emotion}</span>
                                        <span style={{ color: EMOTION_THEME_MAP[emotion] || 'white' }}>{count}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000"
                                            style={{
                                                width: `${count}%`,
                                                backgroundColor: EMOTION_THEME_MAP[emotion] || 'var(--amber)',
                                                boxShadow: `0 0 10px ${EMOTION_THEME_MAP[emotion]}66`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visitor Stats */}
                <div className="lg:col-span-4 glass p-8 rounded-[2.5rem] flex items-center justify-between group">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Total Visitors</p>
                        <div className="text-7xl font-black mt-2">{data?.visitors || 0}</div>
                    </div>
                    <Users className="w-12 h-12 text-slate-800" />
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" width={320} height={180} />
        </main>
    );
}