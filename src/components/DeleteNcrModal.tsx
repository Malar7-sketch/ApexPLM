import React from 'react';
import { X, Trash2, AlertTriangle, Archive, ShieldAlert } from 'lucide-react';
import type { QualityNCR } from '../types/plm';

interface DeleteNcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ncr: QualityNCR | null;
  onConfirmDelete: (ncrId: string) => void;
  onConfirmArchive: (ncrId: string) => void;
}

export const DeleteNcrModal: React.FC<DeleteNcrModalProps> = ({
  isOpen,
  onClose,
  ncr,
  onConfirmDelete,
  onConfirmArchive
}) => {
  if (!isOpen || !ncr) return null;

  const isControlled = ncr.status !== 'Open';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#D9E1EA] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-[#0F172A]">
        
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${
              isControlled ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {isControlled ? <Archive className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                {isControlled ? 'Archive Quality NCR?' : 'Delete NCR?'}
              </h3>
              <span className="text-xs font-mono text-[#64748B]">{ncr.ncrNumber}</span>
            </div>
          </div>

          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-mono">
          {isControlled ? (
            <div className="space-y-3">
              <p className="text-[#334155] font-sans leading-relaxed">
                This Quality Non-Conformance report is currently in stage <b className="text-amber-700">"{ncr.status}"</b> and has active inspection & root-cause compliance records.
              </p>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#64748B] font-sans text-[11px]">
                To satisfy ISO 9001 quality audit requirements, this record cannot be permanently purged. It will be moved to the <b>Quality Archive</b>.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[#334155] font-sans leading-relaxed text-sm">
                Are you sure you want to delete <b className="text-rose-600">{ncr.ncrNumber}</b>? This action cannot be undone.
              </p>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-[#64748B] space-y-1">
                <div>Title: <span className="text-[#0F172A]">{ncr.title}</span></div>
                <div>Target Part: <span className="text-[#0284C7] font-bold">{ncr.targetPartNumber || ncr.linkedPartId}</span></div>
                <div>Severity: <span className="text-amber-700 font-bold">{ncr.severity}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F8FAFC] px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] font-bold cursor-pointer shadow-sm"
          >
            Cancel
          </button>

          {isControlled ? (
            <button
              onClick={() => { onConfirmArchive(ncr.id); onClose(); }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm cursor-pointer"
            >
              Archive NCR
            </button>
          ) : (
            <button
              onClick={() => { onConfirmDelete(ncr.id); onClose(); }}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm cursor-pointer"
            >
              Delete NCR
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
