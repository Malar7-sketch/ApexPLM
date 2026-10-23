import React from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building2, 
  Wrench, 
  Cpu, 
  Layers, 
  FileText, 
  Paperclip, 
  Edit3, 
  ArrowRight, 
  Clock, 
  Activity,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import type { QualityNCR, PartItem, NcrStatus } from '../types/plm';

interface NcrDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ncr: QualityNCR | null;
  partsMap: Record<string, PartItem>;
  onEdit: (ncr: QualityNCR) => void;
  onChangeStatus: (ncr: QualityNCR) => void;
}

const WORKFLOW_STAGES: { key: NcrStatus; label: string }[] = [
  { key: 'Open', label: 'Open' },
  { key: 'Under Investigation', label: 'Investigation' },
  { key: 'Containment', label: 'Containment' },
  { key: 'Corrective Action', label: 'Corrective Action' },
  { key: 'Verification', label: 'Verification' },
  { key: 'Closed', label: 'Closed' }
];

export const NcrDetailModal: React.FC<NcrDetailModalProps> = ({
  isOpen,
  onClose,
  ncr,
  partsMap,
  onEdit,
  onChangeStatus
}) => {
  if (!isOpen || !ncr) return null;

  const part = partsMap[ncr.linkedPartId] || Object.values(partsMap).find(p => p.partNumber === ncr.targetPartNumber);

  const getStageIndex = (status: NcrStatus): number => {
    switch (status) {
      case 'Open': return 0;
      case 'Under Investigation': return 1;
      case 'Containment': return 2;
      case 'Corrective Action': return 3;
      case 'Verification': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(ncr.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#D9E1EA] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  {ncr.ncrNumber}
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                  ncr.severity === 'Critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : ncr.severity === 'Major'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  {ncr.severity} SEVERITY
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                  {ncr.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-[#0F172A] mt-1">{ncr.title}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => onChangeStatus(ncr)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#0284C7] font-bold border border-[#CBD5E1] transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Change Status</span>
            </button>

            <button
              onClick={() => onEdit(ncr)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit NCR</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKFLOW STAGE PROGRESSION STEPPER */}
        <div className="bg-[#F1F5F9] px-6 py-3.5 border-b border-[#E2E8F0] overflow-x-auto">
          <div className="flex items-center space-x-1 min-w-[650px] font-mono text-xs">
            {WORKFLOW_STAGES.map((stg, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <React.Fragment key={stg.key}>
                  <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-sm'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                      : 'bg-white text-[#94A3B8] border-[#E2E8F0]'
                  }`}>
                    {isPast ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] opacity-70">0{idx + 1}.</span>
                    )}
                    <span>{stg.label}</span>
                  </div>

                  {idx < WORKFLOW_STAGES.length - 1 && (
                    <ArrowRight className={`w-3.5 h-3.5 ${idx < currentStageIdx ? 'text-emerald-600' : 'text-[#CBD5E1]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans text-[#0F172A]">
          
          {/* Section 1: Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] block uppercase">Target Part Number</span>
              <span className="text-sm font-bold text-[#0284C7]">{part?.partNumber || ncr.targetPartNumber || ncr.linkedPartId}</span>
              <span className="text-[10px] text-[#64748B] block truncate">{part?.name || ncr.productAssembly || 'Machined Part'}</span>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] block uppercase">Date Detected</span>
              <span className="text-sm font-bold text-[#0F172A]">{ncr.dateDetected || ncr.dateReported}</span>
              <span className="text-[10px] text-[#64748B] block truncate">By {ncr.detectedBy || ncr.reportedBy}</span>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] block uppercase">Department & Cell</span>
              <span className="text-sm font-bold text-amber-700">{ncr.department || 'CNC Machining'}</span>
              <span className="text-[10px] text-[#64748B] block truncate">{ncr.machineEquipment || 'Mazak INTEGREX #01'}</span>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] text-[#64748B] block uppercase">Units Affected / Work Order</span>
              <span className="text-sm font-bold text-rose-600">{ncr.quantityAffected || 1} Units</span>
              <span className="text-[10px] text-[#64748B] block truncate">{ncr.workOrder || 'WO-2026-0884'}</span>
            </div>
          </div>

          {/* Section 2: Problem Description & Comparison */}
          <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase font-mono flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Non-Conformance Description & Variance</span>
            </h4>
            
            <p className="text-[#334155] text-xs leading-relaxed">
              {ncr.nonConformanceDescription || ncr.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2 border-t border-[#E2E8F0]">
              <div className="bg-white p-3 rounded-xl border border-[#CBD5E1]">
                <span className="text-[10px] text-[#64748B] block">Specification Limit:</span>
                <span className="text-[#0F172A] font-bold">{ncr.specificationRequirement || ncr.specificationLimit || '18.000 ± 0.005 mm'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#CBD5E1]">
                <span className="text-[10px] text-[#64748B] block">Actual Measured Condition:</span>
                <span className="text-rose-600 font-bold">{ncr.actualCondition || ncr.measurementValue || '18.014 mm (+9 µm deviation)'}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#CBD5E1]">
                <span className="text-[10px] text-[#64748B] block">Expected Nominal Condition:</span>
                <span className="text-emerald-700 font-bold">{ncr.expectedCondition || '17.995 – 18.005 mm'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Root Cause & Corrective Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase font-mono flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-[#0284C7]" />
                <span>Root Cause & 5-Why Analysis</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">Category</span>
                  <span className="text-amber-700 font-bold">{ncr.rootCauseCategory || 'Tooling Wear / Thermal Expansion'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">Root Cause Description</span>
                  <p className="text-[#334155] text-xs">{ncr.rootCause5Why || ncr.rootCauseDescription || 'Tool wear on CNC lathe reamer fixture caused thermal drift during batch machining.'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase font-mono flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Containment & Corrective Actions</span>
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono text-rose-600 uppercase block">Immediate Containment</span>
                  <p className="text-[#334155] text-xs">{ncr.containmentAction || 'Quarantine batch Lot in Red Bin; halt CNC Cell finish cut.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 uppercase block">Corrective & Preventive Action</span>
                  <p className="text-[#334155] text-xs">{ncr.correctiveAction || 'Re-tooling fixture with diamond PCD inserts and in-process laser gauging.'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Attachments */}
          {ncr.attachments && ncr.attachments.length > 0 && (
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-2">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase font-mono flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                <span>Attached Inspection Reports & Evidence ({ncr.attachments.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                {ncr.attachments.map((att) => (
                  <div key={att.id} className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#0284C7] shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-[#0F172A] block truncate">{att.name}</span>
                        <span className="text-[10px] text-[#64748B]">{att.type} • {att.size}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ATTACHED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFC] px-6 py-3.5 border-t border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
          <span className="text-[#64748B]">
            Quality Record ID: {ncr.id}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] font-bold transition-colors cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
