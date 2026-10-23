import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  FileText, 
  Scale 
} from 'lucide-react';
import type { KnowledgeStandard } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

export const KnowledgeCenter: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'standards' | 'materials' | 'calc'>('standards');
  const [torqueNm, setTorqueNm] = useState<number>(250);
  const [shaftDiameterMm, setShaftDiameterMm] = useState<number>(35);

  // Mechanical Torsional Stress Calculator: Tau = (16 * T) / (pi * d^3)
  const shearStressMpa = Math.round(
    (16 * torqueNm * 1000) / (Math.PI * Math.pow(shaftDiameterMm, 3))
  );

  const [standards] = useState<KnowledgeStandard[]>([
    { id: 'STD-01', code: 'ASME Y14.5-2018', title: 'Geometric Dimensioning and Tolerancing (GD&T)', organization: 'ASME', category: 'Design', status: 'Active' },
    { id: 'STD-02', code: 'ISO 9001:2015', title: 'Quality Management Systems Requirements', organization: 'ISO', category: 'Quality', status: 'Active' },
    { id: 'STD-03', code: 'DIN 5480', title: 'Involute Spline Shaft Connections', organization: 'DIN', category: 'Machine Elements', status: 'Active' },
    { id: 'STD-04', code: 'ASTM B221', title: 'Aluminum and Aluminum-Alloy Extruded Bars', organization: 'ASTM', category: 'Materials', status: 'Active' }
  ]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-blue-500 border ${
            isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Engineering Knowledge Center & Standards Library
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              ISO, ASME Y14.5, DIN, ASTM standards vault, material specs, bearing catalogs, and mechanical engineering calculators.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center p-1.5 rounded-xl border space-x-1 text-xs ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <button
            onClick={() => setActiveTab('standards')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'standards' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Standards ({standards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('calc')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'calc' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Engineering Calculators</span>
          </button>
        </div>
      </div>

      {/* STANDARDS TAB */}
      {activeTab === 'standards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {standards.map((std) => (
            <div
              key={std.id}
              className={`rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:shadow-md ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold font-mono px-2 py-0.5 rounded border text-xs ${
                  isDark ? 'text-blue-400 bg-[#0D1628] border-[#243149]' : 'text-blue-600 bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  {std.code}
                </span>
                <span className="badge-status badge-active text-[10px]">
                  {std.organization}
                </span>
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{std.title}</h3>
              <div className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Category: {std.category}</div>
            </div>
          ))}
        </div>
      )}

      {/* CALCULATORS TAB */}
      {activeTab === 'calc' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 text-xs ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 border-b pb-3 ${
            isDark ? 'border-[#243149] text-[#F1F5F9]' : 'border-[#E2E8F0] text-[#172033]'
          }`}>
            <Calculator className="w-4 h-4 text-blue-500" />
            <span>Shaft Torsional Shear Stress Calculator (Tau = 16T / &pi;d&sup3;)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Applied Torque (T in Nm)</label>
              <input
                type="number"
                value={torqueNm}
                onChange={(e) => setTorqueNm(Number(e.target.value))}
                className="plm-input w-full text-xs"
              />
            </div>

            <div>
              <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Shaft Diameter (d in mm)</label>
              <input
                type="number"
                value={shaftDiameterMm}
                onChange={(e) => setShaftDiameterMm(Number(e.target.value))}
                className="plm-input w-full text-xs"
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Calculated Torsional Shear Stress (τ):</span>
            <span className="text-xl font-bold text-cyan-500 font-mono">{shearStressMpa} MPa</span>
          </div>
        </div>
      )}
    </div>
  );
};

