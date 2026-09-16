import React, { useState } from 'react';
import { 
  GitMerge, 
  Box, 
  FileText, 
  Layers, 
  Wrench, 
  Building2, 
  Cpu, 
  ShieldCheck, 
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import type { PartItem, DigitalThreadStageId } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface DigitalThreadProps {
  part?: PartItem;
}

export const DigitalThread: React.FC<DigitalThreadProps> = ({ part: rawPart }) => {
  const part = rawPart || INITIAL_PARTS[0];
  const { isDark } = useTheme();
  const [activeStage, setActiveStage] = useState<DigitalThreadStageId>('product');

  const STAGES: { id: DigitalThreadStageId; label: string; icon: any; summary: string }[] = [
    { id: 'product', label: '1. Product Requirements', icon: Box, summary: 'System specification & envelope freeze' },
    { id: 'cad', label: '2. 3D CAD Geometry', icon: Box, summary: `${part.cadMetadata.fileName} (${part.cadMetadata.format})` },
    { id: 'drawing', label: '3. 2D ASME Drawing', icon: FileText, summary: 'DWG-GBX-5000-01 Rev B.1' },
    { id: 'ebom', label: '4. Engineering BOM', icon: Layers, summary: '8 CAD Component line items' },
    { id: 'mbom', label: '5. Manufacturing BOM', icon: Wrench, summary: '+2 Process consumables (grease, sealant)' },
    { id: 'capp', label: '6. Process Plan (CAPP)', icon: Cpu, summary: 'Op 10 -> Op 20 -> Op 30 Mazak Routing' },
    { id: 'supplier', label: '7. Supplier Sourcing', icon: Building2, summary: 'VND-PREC-902 (Apex Precision Corp)' },
    { id: 'manufacturing', label: '8. Shop Floor Build', icon: Cpu, summary: 'Batch #B-902 Mazak INTEGREX Run' },
    { id: 'inspection', label: '9. CMM Inspection', icon: ShieldCheck, summary: 'First Article FAI Report #INSP-CAR-510' },
    { id: 'service', label: '10. Field Service (SBOM)', icon: RotateCcw, summary: 'KIT-SEAL-GBX-500 (2,500 hr interval)' }
  ];

  const currentStageInfo = STAGES.find((s) => s.id === activeStage) || STAGES[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-extrabold shadow-sm">
            <GitMerge className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Digital Thread End-to-End Traceability Matrix</span>
              <span className="badge-status badge-active text-[10px]">
                100% Connected
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Complete digital lineage connecting requirements, 3D CAD, drawings, BOMs, CAPP process plans, suppliers, shop-floor execution, and field service.
            </p>
          </div>
        </div>
      </div>

      {/* 10-Stage Clickable Horizontal Traceability Pipeline */}
      <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <h3 className={`text-xs uppercase tracking-wider font-bold mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
          Click Any Node to Inspect Cross-Lifecycle Traceability Links
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STAGES.map((stg, idx) => {
            const Icon = stg.icon;
            const isSelected = activeStage === stg.id;

            return (
              <div
                key={stg.id}
                onClick={() => setActiveStage(stg.id)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? isDark ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm' : 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-sm'
                    : isDark ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500/40 text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-500/40 text-[#475569]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-500' : isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
                  <span className="badge-status badge-active text-[10px]">Node 0{idx + 1}</span>
                </div>
                <div className={`text-xs font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{stg.label}</div>
                <div className={`text-[10px] line-clamp-1 font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{stg.summary}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Stage Node Inspector Panel */}
      <div className={`rounded-2xl p-6 border shadow-sm space-y-4 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-500" />
            <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{currentStageInfo.label} Inspector</h3>
          </div>
          <span className="text-cyan-500 font-mono font-bold">Linked Target: {part.partNumber}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-[10px] uppercase block font-bold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Upstream Dependency</span>
            <div className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>ASME Y14.5 Design Specs</div>
            <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>FEA fatigue stress analysis passed at 450 Nm overload torque.</p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-[10px] uppercase block font-bold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Node Summary</span>
            <div className="text-cyan-500 font-bold font-mono">{currentStageInfo.summary}</div>
            <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>All electronic signoffs and CAD revisions locked.</p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-[10px] uppercase block font-bold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Downstream Impact</span>
            <div className="text-emerald-500 font-bold font-mono">CAPP Process Routing Op 10..30</div>
            <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Mazak INTEGREX e-420H CNC program automatically generated.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

