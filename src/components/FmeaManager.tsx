import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Calculator, 
  Plus, 
  CheckCircle2, 
  Activity, 
  Layers 
} from 'lucide-react';
import type { PfmeaRow } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface FmeaManagerProps {
  pfmeaRows: PfmeaRow[];
  onAddPfmea?: (row: PfmeaRow) => void;
}

export const FmeaManager: React.FC<FmeaManagerProps> = ({ pfmeaRows }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'pfmea' | 'dfmea'>('pfmea');

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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              PFMEA & DFMEA Risk Matrix Management
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Process & Design Failure Mode Effects Analysis with automatic RPN calculation (RPN = S x O x D) and risk mitigation plans.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center p-1.5 rounded-xl border space-x-1 text-xs ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <button
            onClick={() => setActiveTab('pfmea')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'pfmea' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            <span>PFMEA (Process)</span>
          </button>
          <button
            onClick={() => setActiveTab('dfmea')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'dfmea' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            <span>DFMEA (Design)</span>
          </button>
        </div>
      </div>

      {/* PFMEA Table */}
      <div className={`rounded-2xl overflow-hidden border shadow-sm ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="plm-table-container">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Process Step</th>
                <th>Potential Failure Mode</th>
                <th>Failure Cause</th>
                <th className="text-center">Sev (S)</th>
                <th className="text-center">Occ (O)</th>
                <th className="text-center">Det (D)</th>
                <th className="text-center">RPN (S x O x D)</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {pfmeaRows.map((row) => {
                const isHighRisk = row.rpn > 80;

                return (
                  <tr key={row.id}>
                    <td className="font-bold text-cyan-500 font-mono">{row.processStep}</td>
                    <td className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{row.potentialProcessFailure}</td>
                    <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{row.cause}</td>
                    <td className="text-center font-bold text-rose-500 font-mono">{row.severity}</td>
                    <td className="text-center text-amber-500 font-mono">{row.occurrence}</td>
                    <td className="text-center text-purple-500 font-mono">{row.detection}</td>
                    <td className="text-center">
                      <span className={`badge-status text-[10px] ${
                        isHighRisk ? 'badge-archived' : 'badge-active'
                      }`}>
                        {row.rpn}
                      </span>
                    </td>
                    <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{row.correctiveAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

