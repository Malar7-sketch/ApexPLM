import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Play, 
  Pause, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import type { PartItem, CaeResult } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface CaeSolverProps {
  part?: PartItem;
}

export const CaeSolver: React.FC<CaeSolverProps> = ({ part: propPart }) => {
  const { isDark } = useTheme();
  const part = propPart || INITIAL_PARTS[0];
  const [loadForceKn, setLoadForceKn] = useState<number>(45);
  const [isDeforming, setIsDeforming] = useState<boolean>(true);

  // Dynamic FEA physics calculations based on applied load force
  const stressMpa = Math.round((loadForceKn / 45) * 215);
  const displacementMm = +((loadForceKn / 45) * 0.18).toFixed(3);
  const fos = +((680 / stressMpa)).toFixed(2);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-rose-500 border ${
            isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>CAE Finite Element Analysis (FEA) Physics Studio</span>
              <span className="badge-status badge-draft text-xs">
                {part.partNumber}
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Structural von Mises stress distribution, principal strain, Factor of Safety (FoS), and modal thermal dissipation.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDeforming(!isDeforming)}
          className={`btn-sm rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shadow transition-all cursor-pointer ${
            isDeforming ? 'btn-destructive' : 'btn-secondary'
          }`}
        >
          {isDeforming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isDeforming ? 'Pause Deformation' : 'Animate Mesh'}</span>
        </button>
      </div>

      {/* FEA KPI Physics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Max von Mises Stress</span>
          <div className={`text-2xl font-bold font-mono ${stressMpa > 350 ? 'text-rose-500' : 'text-cyan-500'}`}>
            {stressMpa} MPa
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Yield Limit: 680 MPa</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Max Static Displacement</span>
          <div className="text-2xl font-bold text-purple-500 font-mono">{displacementMm} mm</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Under {loadForceKn} kN Load</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Factor of Safety (FoS)</span>
          <div className={`text-2xl font-bold font-mono ${fos < 2.0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {fos} <span className={`text-xs font-normal ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>({fos >= 2.5 ? 'PASS' : 'RISK'})</span>
          </div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Fatigue Life Prediction</span>
          <div className="text-2xl font-bold text-amber-500 font-mono">1.2 &times; 10⁷</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Reversal Cycles</div>
        </div>
      </div>

      {/* Interactive Physics Mesh Heatmap Canvas Controls */}
      <div className={`rounded-2xl p-6 border shadow-sm space-y-4 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 ${
            isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
          }`}>
            <Sliders className="w-4 h-4 text-cyan-500" />
            <span>Apply Overload Torque / Load Force Slider</span>
          </h3>
          <span className="text-cyan-500 font-bold font-mono">{loadForceKn} kN Force</span>
        </div>

        <input
          type="range"
          min="10"
          max="120"
          value={loadForceKn}
          onChange={(e) => setLoadForceKn(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />

        {/* Visual FEA Spectrum Bar */}
        <div className="space-y-1">
          <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Stress Contour Gradient (MPa):</div>
          <div className="h-4 w-full rounded-lg bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600 shadow-inner flex items-center justify-between px-2 text-[9px] font-bold text-slate-950">
            <span>0 MPa</span>
            <span>150 MPa</span>
            <span>300 MPa</span>
            <span>450 MPa</span>
            <span>680 MPa (Yield)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

