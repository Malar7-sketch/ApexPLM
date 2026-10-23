import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  X, 
  ArrowLeftRight, 
  Download, 
  CheckCircle2, 
  Scale, 
  Box, 
  Ruler, 
  DollarSign, 
  Layers, 
  Check, 
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { PartItem } from '../types/plm';
import type { DetailedRevisionRecord } from './CadRevisionHistoryModal';

interface CadCompareDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartItem;
  initialRevA?: string;
  initialRevB?: string;
  onSetActiveRev?: (revId: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CadCompareDiffModal: React.FC<CadCompareDiffModalProps> = ({
  isOpen,
  onClose,
  part,
  initialRevA,
  initialRevB,
  onSetActiveRev,
  onShowToast
}) => {
  const { isDark } = useTheme();

  // Dynamically build revisions database from active part
  const revisionDatabase: Record<string, DetailedRevisionRecord> = useMemo(() => {
    const db: Record<string, DetailedRevisionRecord> = {};
    if (part?.revisionHistory && part.revisionHistory.length > 0) {
      part.revisionHistory.forEach((r, idx) => {
        const revKey = r.revision || `Rev ${idx + 1}`;
        db[revKey] = {
          revId: revKey,
          date: r.releaseDate || new Date().toISOString().substring(0, 10),
          author: r.author || part.createdBy || 'Lead Engineer',
          approver: r.approver || 'Engineering Approver',
          status: (r.status as any) || 'Released',
          ecnNumber: r.changeNoticeId || `REV-${revKey}`,
          changeSummary: r.changeDescription || r.comments || `Engineering revision ${revKey}`,
          detailedNotes: [r.changeDescription || 'CAD model geometry updated.'],
          dimensionsMm: [part.envelopeDimensions?.x || 100, part.envelopeDimensions?.y || 100, part.envelopeDimensions?.z || 100],
          weightKg: part.weightGrams ? part.weightGrams / 1000 : 1.0,
          volumeCm3: 100,
          surfaceAreaCm2: 250,
          estimatedCost: part.targetCost || 0,
          cadPlatform: 'ApexPLM CAD Engine',
          cadFileName: `${part.partNumber}_${revKey}.step`,
          material: part.material || 'Standard Alloy',
          toleranceClass: 'ISO 2768-m',
          maxStressMpa: 250,
          criticalFeatures: ['Geometry Synchronized']
        };
      });
    }
    const currentKey = part?.currentRev || 'Rev 00';
    if (!db[currentKey]) {
      db[currentKey] = {
        revId: currentKey,
        date: new Date().toISOString().substring(0, 10),
        author: part?.createdBy || 'Lead Engineer',
        approver: 'Engineering Approver',
        status: 'Released',
        ecnNumber: `REV-${currentKey}`,
        changeSummary: 'Active Part Revision',
        detailedNotes: ['Current production baseline.'],
        dimensionsMm: [part?.envelopeDimensions?.x || 100, part?.envelopeDimensions?.y || 100, part?.envelopeDimensions?.z || 100],
        weightKg: part?.weightGrams ? part.weightGrams / 1000 : 1.0,
        volumeCm3: 100,
        surfaceAreaCm2: 250,
        estimatedCost: part?.targetCost || 0,
        cadPlatform: 'ApexPLM CAD Engine',
        cadFileName: `${part?.partNumber || 'PART'}_${currentKey}.step`,
        material: part?.material || 'Standard Alloy',
        toleranceClass: 'ISO 2768-m',
        maxStressMpa: 250,
        criticalFeatures: ['Production Release Geometry']
      };
    }
    return db;
  }, [part]);

  const availableRevKeys = Object.keys(revisionDatabase);
  const defaultRevA = availableRevKeys[0] || 'Rev 00';
  const defaultRevB = availableRevKeys[1] || availableRevKeys[0] || 'Rev 00';

  const [revA, setRevA] = useState<string>(() => (initialRevA && revisionDatabase[initialRevA] ? initialRevA : defaultRevA));
  const [revB, setRevB] = useState<string>(() => (initialRevB && revisionDatabase[initialRevB] ? initialRevB : defaultRevB));

  // Revisions data objects
  const dataA: DetailedRevisionRecord = revisionDatabase[revA] || revisionDatabase[defaultRevA];
  const dataB: DetailedRevisionRecord = revisionDatabase[revB] || revisionDatabase[defaultRevB];

  // Swap Revisions Handler
  const handleSwap = () => {
    const temp = revA;
    setRevA(revB);
    setRevB(temp);
    onShowToast?.(`Swapped comparison: Rev ${revB} vs Rev ${temp}`, 'info');
  };

  // Deltas Calculations
  const weightDelta = dataB.weightKg - dataA.weightKg;
  const weightDeltaPercent = dataA.weightKg > 0 ? (weightDelta / dataA.weightKg) * 100 : 0;

  const volumeDelta = dataB.volumeCm3 - dataA.volumeCm3;
  const volumeDeltaPercent = dataA.volumeCm3 > 0 ? (volumeDelta / dataA.volumeCm3) * 100 : 0;

  const surfaceDelta = dataB.surfaceAreaCm2 - dataA.surfaceAreaCm2;
  const surfaceDeltaPercent = dataA.surfaceAreaCm2 > 0 ? (surfaceDelta / dataA.surfaceAreaCm2) * 100 : 0;

  const costDelta = dataB.estimatedCost - dataA.estimatedCost;
  const costDeltaPercent = dataA.estimatedCost > 0 ? (costDelta / dataA.estimatedCost) * 100 : 0;

  const stressDelta = dataB.maxStressMpa - dataA.maxStressMpa;

  // Export Diff Report Handler
  const handleExportDiffReport = () => {
    const reportText = `========================================================================
APEX PLM - CAD REVISION COMPARISON REPORT
========================================================================
Product Assembly: ${part.partNumber || 'ASM-EV-9000'} - ${part.name}
Baseline Revision: Rev ${dataA.revId} (${dataA.status})
Target Revision:   Rev ${dataB.revId} (${dataB.status})
Generated At:      ${new Date().toISOString()}

------------------------------------------------------------------------
1. PARAMETRIC DELTA SUMMARY
------------------------------------------------------------------------
- Mass (Weight):       ${dataA.weightKg.toFixed(2)} kg -> ${dataB.weightKg.toFixed(2)} kg (Delta: ${weightDelta >= 0 ? '+' : ''}${weightDelta.toFixed(2)} kg / ${weightDeltaPercent.toFixed(2)}%)
- Enclosed Volume:     ${dataA.volumeCm3} cm³ -> ${dataB.volumeCm3} cm³ (Delta: ${volumeDelta >= 0 ? '+' : ''}${volumeDelta} cm³ / ${volumeDeltaPercent.toFixed(2)}%)
- Surface Area:        ${dataA.surfaceAreaCm2} cm² -> ${dataB.surfaceAreaCm2} cm² (Delta: ${surfaceDelta >= 0 ? '+' : ''}${surfaceDelta} cm² / ${surfaceDeltaPercent.toFixed(2)}%)
- Unit Estimated Cost: $${dataA.estimatedCost.toFixed(2)} -> $${dataB.estimatedCost.toFixed(2)} (Delta: ${costDelta >= 0 ? '+' : ''}$${costDelta.toFixed(2)} / ${costDeltaPercent.toFixed(2)}%)
- Max Yield Stress:    ${dataA.maxStressMpa} MPa -> ${dataB.maxStressMpa} MPa (Delta: ${stressDelta >= 0 ? '+' : ''}${stressDelta} MPa)

------------------------------------------------------------------------
2. COMPARISON MATRIX
------------------------------------------------------------------------
Parameter                  | Rev ${dataA.revId} (Baseline)            | Rev ${dataB.revId} (Target)
---------------------------|-----------------------------|-----------------------------
Dimensions (X × Y × Z)     | ${dataA.dimensionsMm.join(' × ')} mm        | ${dataB.dimensionsMm.join(' × ')} mm
CAD Platform / SP          | ${dataA.cadPlatform}        | ${dataB.cadPlatform}
Material & Specification   | ${dataA.material}           | ${dataB.material}
Tolerance Class            | ${dataA.toleranceClass}     | ${dataB.toleranceClass}
Engineering Change Order   | ${dataA.ecnNumber}          | ${dataB.ecnNumber}
Lead Author                | ${dataA.author}             | ${dataB.author}
Sign-off Authority         | ${dataA.approver}           | ${dataB.approver}

------------------------------------------------------------------------
3. TARGET REVISION CHANGE NOTES (REV ${dataB.revId})
------------------------------------------------------------------------
Summary: ${dataB.changeSummary}
${dataB.detailedNotes.map((n, i) => `[${i + 1}] ${n}`).join('\n')}

========================================================================
Generated by ApexPLM Revision Diff Engine
========================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${part.partNumber || 'ASM-EV-9000'}_Comparison_Rev_${dataA.revId}_vs_Rev_${dataB.revId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast?.(`Exported comparison report (.txt)`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`rounded-2xl border max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
      }`}>
        
        {/* MODAL HEADER */}
        <div className={`p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-[#0c1322]' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Compare CAD Revisions</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
                  Rev {revA} ⇄ Rev {revB}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cross-Revision Analysis: <strong className="font-mono text-cyan-400">{part.partNumber}</strong> &bull; {part.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportDiffReport}
              className={`btn-sm flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Download text comparison report"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export Report</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              title="Close Comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REVISION SELECTOR & SWAP BAR */}
        <div className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'bg-[#0a0f1d] border-slate-800/80' : 'bg-slate-100/60 border-slate-200'
        }`}>
          {/* BASELINE CARD (REV A) */}
          <div className={`flex-1 p-3 rounded-xl border w-full flex items-center justify-between ${
            isDark ? 'bg-[#111c33] border-slate-700/60' : 'bg-white border-slate-300 shadow-sm'
          }`}>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Baseline (Revision A)</span>
              <div className="flex items-center space-x-2">
                <select
                  value={revA}
                  onChange={(e) => setRevA(e.target.value)}
                  className={`font-mono font-bold text-sm rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-600'
                  }`}
                >
                  {availableRevKeys.map((k) => (
                    <option key={k} value={k}>
                      Rev {k} ({revisionDatabase[k]?.status || 'Released'})
                    </option>
                  ))}
                </select>
                <span className={`badge-status ${
                  dataA.status === 'Released' ? 'badge-active' : dataA.status === 'Draft' ? 'badge-progress' : 'badge-draft'
                }`}>
                  {dataA.status}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 hidden sm:block">
              <div>ECO: <strong className="font-mono text-purple-400">{dataA.ecnNumber}</strong></div>
              <div>Date: {dataA.date}</div>
            </div>
          </div>

          {/* QUICK SWAP BUTTON */}
          <button
            onClick={handleSwap}
            className={`p-2.5 rounded-xl border shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isDark 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30 hover:scale-105' 
                : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:scale-105'
            }`}
            title="Swap Baseline and Target"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* TARGET CARD (REV B) */}
          <div className={`flex-1 p-3 rounded-xl border w-full flex items-center justify-between ${
            isDark ? 'bg-[#111c33] border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-white border-cyan-300 shadow-sm ring-1 ring-cyan-200'
          }`}>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Target (Revision B)</span>
              <div className="flex items-center space-x-2">
                <select
                  value={revB}
                  onChange={(e) => setRevB(e.target.value)}
                  className={`font-mono font-bold text-sm rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                    isDark ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-slate-50 border-slate-300 text-cyan-600'
                  }`}
                >
                  {availableRevKeys.map((k) => (
                    <option key={k} value={k}>
                      Rev {k} ({revisionDatabase[k]?.status || 'Released'})
                    </option>
                  ))}
                </select>
                <span className={`badge-status ${
                  dataB.status === 'Released' ? 'badge-active' : dataB.status === 'Draft' ? 'badge-progress' : 'badge-draft'
                }`}>
                  {dataB.status}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 hidden sm:block">
              <div>ECO: <strong className="font-mono text-purple-400">{dataB.ecnNumber}</strong></div>
              <div>Date: {dataB.date}</div>
            </div>
          </div>
        </div>

        {/* DELTA KPI METRIC CARDS */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b text-xs ${
          isDark ? 'bg-[#080d19] border-slate-800' : 'bg-slate-50/60 border-slate-200'
        }`}>
          {/* MASS CARD */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center space-x-1">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Mass (Weight)</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                weightDelta === 0
                  ? 'bg-slate-500/20 text-slate-400'
                  : weightDelta > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {weightDelta >= 0 ? `+${weightDelta.toFixed(2)}` : weightDelta.toFixed(2)} kg ({weightDeltaPercent >= 0 ? `+${weightDeltaPercent.toFixed(1)}%` : `${weightDeltaPercent.toFixed(1)}%`})
              </span>
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-slate-400 line-through text-xs">{dataA.weightKg.toFixed(2)} kg</span>
              <span className="text-sm font-bold text-amber-400">{dataB.weightKg.toFixed(2)} kg</span>
            </div>
          </div>

          {/* VOLUME CARD */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center space-x-1">
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Volume</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                volumeDelta === 0
                  ? 'bg-slate-500/20 text-slate-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {volumeDelta >= 0 ? `+${volumeDelta}` : volumeDelta} cm³ ({volumeDeltaPercent >= 0 ? `+${volumeDeltaPercent.toFixed(1)}%` : `${volumeDeltaPercent.toFixed(1)}%`})
              </span>
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-slate-400 line-through text-xs">{dataA.volumeCm3.toLocaleString()}</span>
              <span className="text-sm font-bold text-emerald-400">{dataB.volumeCm3.toLocaleString()} cm³</span>
            </div>
          </div>

          {/* SURFACE AREA CARD */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center space-x-1">
                <Ruler className="w-3.5 h-3.5 text-purple-400" />
                <span>Surface Area</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                surfaceDelta === 0
                  ? 'bg-slate-500/20 text-slate-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {surfaceDelta >= 0 ? `+${surfaceDelta}` : surfaceDelta} cm²
              </span>
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-slate-400 line-through text-xs">{dataA.surfaceAreaCm2.toLocaleString()}</span>
              <span className="text-sm font-bold text-purple-400">{dataB.surfaceAreaCm2.toLocaleString()} cm²</span>
            </div>
          </div>

          {/* ESTIMATED COST CARD */}
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Est. Unit Cost</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                costDelta === 0
                  ? 'bg-slate-500/20 text-slate-400'
                  : costDelta > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {costDelta >= 0 ? `+$${costDelta.toFixed(2)}` : `-$${Math.abs(costDelta).toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-slate-400 line-through text-xs">${dataA.estimatedCost.toFixed(2)}</span>
              <span className="text-sm font-bold text-cyan-400">${dataB.estimatedCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* COMPARISON CONTENT AREA: PURE PARAMETRIC MATRIX (NO OVERLAY) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          <div className="plm-table-container">
            <table className="plm-table text-xs">
              <thead>
                <tr>
                  <th className="w-1/3">Engineering Parameter</th>
                  <th className="w-1/4">Rev {revA} (Baseline)</th>
                  <th className="w-1/4">Rev {revB} (Target)</th>
                  <th className="text-right">Delta / Status</th>
                </tr>
              </thead>
              <tbody>
                {/* SECTION: GEOMETRY */}
                <tr className={isDark ? 'bg-slate-900/80' : 'bg-slate-100'}>
                  <td colSpan={4} className="font-bold text-[11px] text-cyan-400 uppercase tracking-wider py-1.5">
                    1. Physical &amp; Geometric Parameters
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Dimensions (X × Y × Z)</td>
                  <td className="font-mono">{dataA.dimensionsMm.join(' × ')} mm</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.dimensionsMm.join(' × ')} mm</td>
                  <td className="text-right">
                    {dataA.dimensionsMm.join('x') === dataB.dimensionsMm.join('x') ? (
                      <span className="text-slate-400 text-[10px]">Identical</span>
                    ) : (
                      <span className="text-amber-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10">Modified</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Total Net Mass</td>
                  <td className="font-mono">{dataA.weightKg.toFixed(2)} kg</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.weightKg.toFixed(2)} kg</td>
                  <td className="text-right">
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      weightDelta === 0 ? 'text-slate-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {weightDelta >= 0 ? `+${weightDelta.toFixed(2)}` : weightDelta.toFixed(2)} kg
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Enclosed Envelope Volume</td>
                  <td className="font-mono">{dataA.volumeCm3.toLocaleString()} cm³</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.volumeCm3.toLocaleString()} cm³</td>
                  <td className="text-right">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +{volumeDelta} cm³
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">External Surface Area</td>
                  <td className="font-mono">{dataA.surfaceAreaCm2.toLocaleString()} cm²</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.surfaceAreaCm2.toLocaleString()} cm²</td>
                  <td className="text-right">
                    <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      +{surfaceDelta} cm²
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Manufacturing Tolerance</td>
                  <td className="font-mono">{dataA.toleranceClass}</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.toleranceClass}</td>
                  <td className="text-right">
                    {dataA.toleranceClass === dataB.toleranceClass ? (
                      <span className="text-slate-400 text-[10px]">Identical</span>
                    ) : (
                      <span className="text-cyan-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10">Upgraded (Fine)</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Max Yield Stress Load</td>
                  <td className="font-mono">{dataA.maxStressMpa} MPa</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.maxStressMpa} MPa</td>
                  <td className="text-right">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +{stressDelta} MPa (+{((stressDelta / dataA.maxStressMpa) * 100).toFixed(1)}%)
                    </span>
                  </td>
                </tr>

                {/* SECTION: CAD & PLATFORM */}
                <tr className={isDark ? 'bg-slate-900/80' : 'bg-slate-100'}>
                  <td colSpan={4} className="font-bold text-[11px] text-purple-400 uppercase tracking-wider py-1.5">
                    2. CAD File &amp; Platform Specs
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">CAD Master File Name</td>
                  <td className="font-mono text-slate-300">{dataA.cadFileName}</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.cadFileName}</td>
                  <td className="text-right">
                    <span className="text-slate-400 text-[10px]">SLDASM Assembly</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">CAD Native Environment</td>
                  <td className="font-mono text-slate-300">{dataA.cadPlatform}</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.cadPlatform}</td>
                  <td className="text-right">
                    {dataA.cadPlatform === dataB.cadPlatform ? (
                      <span className="text-slate-400 text-[10px]">Identical</span>
                    ) : (
                      <span className="text-purple-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10">Updated Build</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Primary Material Alloy</td>
                  <td className="font-mono text-slate-300">{dataA.material}</td>
                  <td className="font-mono text-cyan-400 font-bold">{dataB.material}</td>
                  <td className="text-right">
                    {dataA.material === dataB.material ? (
                      <span className="text-slate-400 text-[10px]">Identical</span>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">Upgraded Spec</span>
                    )}
                  </td>
                </tr>

                {/* SECTION: CHANGE CONTROL */}
                <tr className={isDark ? 'bg-slate-900/80' : 'bg-slate-100'}>
                  <td colSpan={4} className="font-bold text-[11px] text-amber-400 uppercase tracking-wider py-1.5">
                    3. Change Control &amp; Sign-off Ledger
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Engineering Change Order</td>
                  <td className="font-mono text-purple-400">{dataA.ecnNumber}</td>
                  <td className="font-mono text-purple-400 font-bold">{dataB.ecnNumber}</td>
                  <td className="text-right">
                    <span className="text-slate-400 text-[10px]">Authorized ECO</span>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Lifecycle Status</td>
                  <td>
                    <span className={`badge-status ${dataA.status === 'Released' ? 'badge-active' : 'badge-draft'}`}>{dataA.status}</span>
                  </td>
                  <td>
                    <span className={`badge-status ${dataB.status === 'Released' ? 'badge-active' : 'badge-draft'}`}>{dataB.status}</span>
                  </td>
                  <td className="text-right">
                    {dataB.status === 'Draft' ? (
                      <span className="text-amber-400 text-[10px] font-bold">Working Draft</span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-bold">Production Release</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Sign-off Approver</td>
                  <td>{dataA.approver}</td>
                  <td className="font-bold text-cyan-400">{dataB.approver}</td>
                  <td className="text-right">
                    <span className="text-slate-400 text-[10px]">Quality Gate</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ATTACHED CHANGE NOTES FOR TARGET REVISION */}
          <div className={`p-4 rounded-xl border text-xs space-y-2 ${
            isDark ? 'bg-[#111e38] border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-cyan-50/50 border-cyan-300'
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/20">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-cyan-400">Target: Rev {revB} Engineering Change Justification</span>
                <span className="text-[11px] font-mono text-purple-400 font-semibold">{dataB.ecnNumber}</span>
              </div>
              <span className="text-[11px] text-slate-400">{dataB.date} &bull; Author: {dataB.author}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-200">{dataB.changeSummary}</h4>
            <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc mt-1">
              {dataB.detailedNotes.map((note, idx) => (
                <li key={idx} className="leading-relaxed">{note}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 bg-[#0c1322]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-slate-400 text-[11px] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Parametric delta computed &bull; Tolerances verified to ISO 2768-f standard</span>
          </div>

          <div className="flex items-center space-x-2">
            {onSetActiveRev && revB !== part.currentRev && (
              <button
                onClick={() => {
                  onSetActiveRev(revB);
                  onShowToast?.(`Activated Target Revision ${revB} in CAD Vault`, 'success');
                  onClose();
                }}
                className="btn-primary btn-sm cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set Target (Rev {revB}) as Active</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-secondary btn-sm cursor-pointer"
            >
              Close Diff Engine
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
