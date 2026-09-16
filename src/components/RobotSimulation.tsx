import React, { useState } from 'react';
import { 
  Bot, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Play 
} from 'lucide-react';
import type { RobotCell } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

export const RobotSimulation: React.FC = () => {
  const { isDark } = useTheme();
  const [cells] = useState<RobotCell[]>([
    { id: 'ROB-01', robotName: 'KUKA KR 210 R2700 6-Axis Arm', type: 'Pick & Place', reachRadiusMm: 2700, payloadKg: 210, collisionStatus: 'Clear', cycleTimeSec: 14.5 },
    { id: 'ROB-02', robotName: 'ABB IRB 6700 Spot Welding Robot', type: 'Arc Welding', reachRadiusMm: 3200, payloadKg: 175, collisionStatus: 'Clear', cycleTimeSec: 22.0 },
    { id: 'ROB-03', robotName: 'FANUC LR Mate 200iD Inspection Arm', type: 'Laser Inspection', reachRadiusMm: 911, payloadKg: 7, collisionStatus: 'Clear', cycleTimeSec: 8.2 }
  ]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-indigo-500 border ${
            isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Robotic Work Cell Kinematics & Reach Simulation
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              6-Axis robot arm kinematics, collision detection, reach envelope validation, and automated welding/assembly cycle times.
            </p>
          </div>
        </div>
      </div>

      {/* Robot Cells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {cells.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:shadow-md ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold font-mono px-2 py-0.5 rounded border text-xs ${
                isDark ? 'text-indigo-400 bg-[#0D1628] border-[#243149]' : 'text-indigo-600 bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                {r.id}
              </span>
              <span className="badge-status badge-active text-[10px]">
                {r.collisionStatus}
              </span>
            </div>

            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{r.robotName}</h3>
            <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{r.type}</div>

            <div className={`p-3 rounded-xl border space-y-1.5 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Reach Radius:</span>
                <span className="text-cyan-500 font-bold font-mono">{r.reachRadiusMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Payload Capacity:</span>
                <span className="text-purple-500 font-bold font-mono">{r.payloadKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Cycle Time:</span>
                <span className="text-emerald-500 font-bold font-mono">{r.cycleTimeSec}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

