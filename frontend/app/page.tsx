"use client";

import dynamic from "next/dynamic";

// Mission Control requires direct browser DOM access for dynamic attributes and real-time state.
// We use ssr: false to prevent hydration mismatches caused by immediate data updates.
const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#05070a]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-[0.3em] uppercase text-slate-500 animate-pulse">
          Initializing Neural Interface...
        </p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <Dashboard />;
}



