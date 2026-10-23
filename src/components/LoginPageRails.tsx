import React, { useState, useEffect } from 'react';
import { Shield, Radio, Lock, Activity, Cpu, Compass } from 'lucide-react';

interface RailProps {
  isDark?: boolean;
}

export const CadDatumRail: React.FC<RailProps> = ({ isDark = true }) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 284.5, y: 142.8 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setCoords({
        x: Math.round(e.clientX * 0.25 * 10) / 10,
        y: Math.round(e.clientY * 0.25 * 10) / 10
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <aside 
      className={`hidden 2xl:flex flex-col justify-between items-center w-16 fixed left-0 top-0 bottom-0 z-20 py-8 border-r pointer-events-none transition-colors ${
        isDark 
          ? 'border-slate-800/80 bg-slate-950/40 text-slate-400' 
          : 'border-slate-200/90 bg-white/40 text-slate-500'
      } backdrop-blur-xs`}
    >
      {/* Top Coordinate Target */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 rounded-lg border border-cyan-500/40 flex items-center justify-center bg-cyan-500/10 text-cyan-400">
          <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '18s' }} />
        </div>
        <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-cyan-500">
          DATUM-A
        </span>
      </div>

      {/* Vertical Vernier Ruler Scale */}
      <div className="flex flex-col items-center space-y-4 my-auto select-none opacity-80">
        <div className="text-[8px] font-mono tracking-tighter text-slate-400 -rotate-90">0.00mm</div>
        <div className="flex flex-col items-center space-y-1.5">
          <div className="w-4 h-[1px] bg-cyan-500/50" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-3 h-[1px] bg-cyan-500/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-4 h-[1px] bg-cyan-500/50" />
        </div>
        <div className="text-[8px] font-mono tracking-tighter text-cyan-400 -rotate-90">50.0mm</div>
        <div className="flex flex-col items-center space-y-1.5">
          <div className="w-4 h-[1px] bg-cyan-500/50" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-3 h-[1px] bg-cyan-500/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-2 h-[1px] bg-slate-400/40" />
          <div className="w-4 h-[1px] bg-cyan-500/50" />
        </div>
        <div className="text-[8px] font-mono tracking-tighter text-slate-400 -rotate-90">100mm</div>
      </div>

      {/* Live Coordinate Box */}
      <div className="flex flex-col items-center space-y-1 text-center font-mono">
        <div className="text-[8px] tracking-wider text-slate-400 uppercase font-semibold">POS</div>
        <div className="text-[9px] font-bold text-cyan-400">X:{coords.x}</div>
        <div className="text-[9px] font-bold text-sky-400">Y:{coords.y}</div>
      </div>
    </aside>
  );
};

export const SecurityTelemetryRail: React.FC<RailProps> = ({ isDark = true }) => {
  const [pulse, setPulse] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(Math.floor(Math.random() * 6) + 8);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside 
      className={`hidden 2xl:flex flex-col justify-between items-center w-16 fixed right-0 top-0 bottom-0 z-20 py-8 border-l pointer-events-none transition-colors ${
        isDark 
          ? 'border-slate-800/80 bg-slate-950/40 text-slate-400' 
          : 'border-slate-200/90 bg-white/40 text-slate-500'
      } backdrop-blur-xs`}
    >
      {/* Top Security Status */}
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 rounded-lg border border-emerald-500/40 flex items-center justify-center bg-emerald-500/10 text-emerald-400">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-emerald-500">
          SEC-256
        </span>
      </div>

      {/* Vertical Heartbeat Waveform */}
      <div className="flex flex-col items-center space-y-3 select-none">
        <div className="flex flex-col items-center space-y-1 text-[8px] font-mono text-slate-400">
          <div className="w-1.5 h-6 rounded-full bg-cyan-500/30 animate-pulse" />
          <div className="w-1.5 h-10 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-4 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '400ms' }} />
          <div className="w-1.5 h-8 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '600ms' }} />
        </div>
        <div className="text-[9px] font-mono tracking-widest text-slate-400 -rotate-90 whitespace-nowrap mt-4">
          TLS 1.3 // LIVE
        </div>
      </div>

      {/* Cluster Node Ping */}
      <div className="flex flex-col items-center space-y-1 text-center font-mono">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mb-1" />
        <div className="text-[8px] tracking-wider text-slate-400 uppercase font-semibold">PING</div>
        <div className="text-[9px] font-bold text-emerald-400">{pulse}ms</div>
      </div>
    </aside>
  );
};
