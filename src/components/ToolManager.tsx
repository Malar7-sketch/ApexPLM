import React from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Layers, 
  Search 
} from 'lucide-react';
import type { ToolItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface ToolManagerProps {
  tools: ToolItem[];
}

export const ToolManager: React.FC<ToolManagerProps> = ({ tools }) => {
  const { isDark } = useTheme();

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
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Manufacturing Tool & Fixture Management
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Cutting tools, CNC collets, welding jigs, fixtures, tool life % tracking, and calibration maintenance schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {tools.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:shadow-md ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold font-mono px-2 py-0.5 rounded border text-xs ${
                isDark ? 'text-cyan-400 bg-[#0D1628] border-[#243149]' : 'text-cyan-600 bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                {t.toolNumber}
              </span>
              <span className={`badge-status text-[10px] ${
                t.status === 'Available' ? 'badge-active' : 'badge-review'
              }`}>
                {t.status}
              </span>
            </div>

            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{t.name}</h3>
            <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{t.category} • Location: {t.location}</div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Remaining Tool Life</span>
                <span className="text-emerald-500 font-mono font-bold">{t.toolLifePercent}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-[#0D1628]' : 'bg-[#E2E8F0]'
              }`}>
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${t.toolLifePercent}%` }} />
              </div>
            </div>

            <div className={`border-t pt-2 text-[10px] flex justify-between font-mono ${
              isDark ? 'border-[#243149] text-[#94A3B8]' : 'border-[#E2E8F0] text-[#64748B]'
            }`}>
              <span>Calibration Date: {t.calibrationDate}</span>
              <span className="badge-status badge-active text-[10px]">CALIBRATED</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

