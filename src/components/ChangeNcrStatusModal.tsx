import React, { useState } from 'react';
import { X, Activity, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import type { QualityNCR, NcrStatus } from '../types/plm';

interface ChangeNcrStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  ncr: QualityNCR | null;
  currentUser?: { name: string; email?: string } | null;
  onSave: (updatedNcr: QualityNCR) => void;
}

const STATUS_OPTIONS: { status: NcrStatus; label: string; desc: string }[] = [
  { status: 'Open', label: 'Open', desc: 'Initial logging & tagging in quarantine' },
  { status: 'Under Investigation', label: 'Under Investigation', desc: 'Active CMM scan & 5-Why root cause engineering analysis' },
  { status: 'Containment', label: 'Containment', desc: 'Lot quarantine, machine pause, or tool offset adjustment' },
  { status: 'Corrective Action', label: 'Corrective Action', desc: 'CAPA execution, tooling replacement, CNC program edit' },
  { status: 'Verification', label: 'Verification', desc: 'First article re-inspection & CMM statistical confirmation' },
  { status: 'Closed', label: 'Closed', desc: 'Non-conformance resolved & disposition signed off' }
];

export const ChangeNcrStatusModal: React.FC<ChangeNcrStatusModalProps> = ({
  isOpen,
  onClose,
  ncr,
  currentUser,
  onSave
}) => {
  if (!isOpen || !ncr) return null;

  const [selectedStatus, setSelectedStatus] = useState<NcrStatus>(ncr.status);
  const [transitionNote, setTransitionNote] = useState<string>('');

  const handleUpdate = () => {
    const updated: QualityNCR = {
      ...ncr,
      status: selectedStatus,
      history: [
        ...(ncr.history || []),
        {
          action: `Status changed to ${selectedStatus}`,
          user: currentUser?.name || 'Quality Engineer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          details: transitionNote.trim() || `Workflow moved from ${ncr.status} to ${selectedStatus}.`
        }
      ]
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#D9E1EA] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-[#0F172A]">
        
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-50 border border-sky-200 rounded-xl text-[#0284C7]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Advance NCR Workflow Stage</h3>
              <p className="text-xs text-[#64748B] font-mono">{ncr.ncrNumber}: {ncr.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          <div className="space-y-2">
            <span className="text-[#475569] font-bold block font-sans">Select New Workflow Stage:</span>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <div
                  key={opt.status}
                  onClick={() => setSelectedStatus(opt.status)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStatus === opt.status
                      ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-[#0F172A]">{opt.label}</span>
                    <span className="text-[10px] text-[#64748B] font-sans">{opt.desc}</span>
                  </div>
                  {selectedStatus === opt.status && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="text-[#475569] font-bold font-mono text-[11px]">Disposition & Quality Audit Note:</label>
            <textarea
              rows={2}
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="Provide reason for status advance or verification note..."
              className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm cursor-pointer"
          >
            Update Status
          </button>
        </div>

      </div>
    </div>
  );
};
