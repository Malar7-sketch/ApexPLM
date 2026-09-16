import React, { useState } from 'react';
import { 
  Wind, 
  Activity, 
  Flame, 
  Layers, 
  CheckCircle2, 
  Play 
} from 'lucide-react';
import type { PartItem } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface CfdSolverProps {
  part?: PartItem;
}

export const CfdSolver: React.FC<CfdSolverProps> = ({ part: propPart }) => {
  const { isDark } = useTheme();
  const part = propPart || INITIAL_PARTS[0];
  const [fluidType, setFluidType] = useState<'air' | 'oil' | 'coolant'>('coolant');
  const [inletVelocity, setInletVelocity] = useState(15);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-cyan-500 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>CFD Computational Fluid Dynamics & Thermal Streamlines</span>
              <span className="badge-status badge-active text-xs">
                {part.partNumber}
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Fluid flow streamlines, particle tracking, pressure drop ($\Delta P$), and conjugate heat transfer cooling efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* CFD KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Inlet Flow Velocity</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">{inletVelocity} m/s</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Pressure Drop (ΔP)</span>
          <div className="text-2xl font-bold text-purple-500 font-mono">{(inletVelocity * 1.8).toFixed(1)} kPa</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Thermal Cooling Efficiency</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">92.4%</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Turbulence Model</span>
          <div className="text-2xl font-bold text-amber-500 font-mono">k-ε Realizable</div>
        </div>
      </div>
    </div>
  );
};

