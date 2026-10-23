import React, { useState } from 'react';
import { 
  Code, 
  Wrench, 
  Play, 
  Cpu, 
  CheckCircle2, 
  FileCode, 
  Download 
} from 'lucide-react';
import type { PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface CamStudioProps {
  part: PartItem;
}

export const CamStudio: React.FC<CamStudioProps> = ({ part }) => {
  const { isDark } = useTheme();
  const [gCodeSnippet] = useState(
    `%
O5001 (ASM-CAR-510 - MAZAK 5-AXIS ROUTING)
(TOOL 01: 12MM ENDMILL)
G90 G21 G17 G40 G80
G28 G91 Z0.
M06 T01
S12000 M03
G00 G90 X-45.0 Y-30.0 B0. C0.
G43 H01 Z50. M08
G01 Z-5.0 F1200
G02 X45.0 Y-30.0 R45.0 F2400
G01 Y30.0
M09 M05
G28 G91 Z0.
M30
%`
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>CAM CNC Toolpath Studio & G-Code Generator</span>
              <span className="badge-status badge-active text-xs">
                {part.partNumber}
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              5-Axis high-speed toolpath preview, G-code post-processing, cutting speeds, and material removal simulation.
            </p>
          </div>
        </div>
      </div>

      {/* CAM Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Spindle Speed</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">12,000 RPM</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Cutting Feed Rate</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">2,400 mm/min</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Material Removal Rate</span>
          <div className="text-2xl font-bold text-purple-500 font-mono">145 cm³/min</div>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Post-Processor</span>
          <div className="text-2xl font-bold text-amber-500 font-mono">Mazak Fanuc 31i</div>
        </div>
      </div>

      {/* G-Code Viewer */}
      <div className={`rounded-2xl p-5 border shadow-sm space-y-3 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Post-Processed CNC G-Code Output</h3>
          </div>
        </div>

        <pre className={`p-4 rounded-xl border font-mono text-[11px] overflow-x-auto ${
          isDark ? 'bg-[#0D1628] border-[#243149] text-emerald-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-emerald-700'
        }`}>
          {gCodeSnippet}
        </pre>
      </div>
    </div>
  );
};

