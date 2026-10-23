import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  FileText,
  FileKey,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  Tag,
  MoreVertical,
  Edit3,
  Trash2,
  Archive,
  Eye,
  ShieldAlert,
  Paperclip,
  FileCode,
  FileSpreadsheet,
  X
} from 'lucide-react';
import type { ECR, ECN, UserPersona, EcnPipelineStage, PartItem, SignoffStatus } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import type { UserAccount } from '../data/mockUsers';
import { CreateEcrModal } from './CreateEcrModal';
import { EditEcrModal } from './EditEcrModal';
import { useTheme } from '../context/ThemeContext';

interface ChangeManagementProps {
  ecrs: ECR[];
  ecns: ECN[];
  partsMap: Record<string, PartItem>;
  currentPersona: UserPersona;
  currentUser?: UserAccount | null;
  onAddEcr: (ecr: ECR) => void;
  onUpdateEcr?: (updatedEcr: ECR) => void;
  onDeleteEcr?: (ecrId: string) => void;
  onArchiveEcr?: (ecrId: string, reason?: string) => void;
  onUpdateEcnSignoff: (ecnId: string, persona: UserPersona, approved: boolean, comments: string) => void;
  onAdvanceEcnStage: (ecnId: string, nextStage: EcnPipelineStage) => void;
  onUpdateEcrSignoff?: (ecrId: string, persona: UserPersona, approved: boolean, comments: string) => void;
  onAdvanceEcrStage?: (ecrId: string, nextStage: EcnPipelineStage) => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const ChangeManagement: React.FC<ChangeManagementProps> = ({
  ecrs,
  ecns,
  partsMap,
  currentPersona,
  currentUser,
  onAddEcr,
  onUpdateEcr,
  onDeleteEcr,
  onArchiveEcr,
  onUpdateEcnSignoff,
  onAdvanceEcnStage,
  onUpdateEcrSignoff,
  onAdvanceEcrStage,
  logAction
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'ecn' | 'ecr'>('ecr');
  const [selectedEcnId, setSelectedEcnId] = useState<string>(ecns[0]?.id || '');
  const [selectedEcrId, setSelectedEcrId] = useState<string>(ecrs[0]?.id || '');
  const [showNewEcrModal, setShowNewEcrModal] = useState<boolean>(false);
  const [editingEcr, setEditingEcr] = useState<ECR | null>(null);
  const [ecrToDelete, setEcrToDelete] = useState<ECR | null>(null);
  const [ecrToArchive, setEcrToArchive] = useState<ECR | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');
  const [openMenuEcrId, setOpenMenuEcrId] = useState<string | null>(null);

  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const [signatureTargetType, setSignatureTargetType] = useState<'ecn' | 'ecr'>('ecr');
  const [signoffComment, setSignoffComment] = useState<string>('');
  const [signaturePassword, setSignaturePassword] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ text: string; subText?: string; type: 'success' | 'error' } | null>(null);

  // Close card menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuEcrId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Sync selected IDs if list updates
  useEffect(() => {
    if (ecrs.length > 0 && !ecrs.some((e) => e.id === selectedEcrId)) {
      setSelectedEcrId(ecrs[0].id);
    }
  }, [ecrs, selectedEcrId]);

  useEffect(() => {
    if (ecns.length > 0 && !ecns.some((e) => e.id === selectedEcnId)) {
      setSelectedEcnId(ecns[0].id);
    }
  }, [ecns, selectedEcnId]);

  const selectedEcn = ecns.find((e) => e.id === selectedEcnId) || ecns[0];
  const selectedEcr = ecrs.find((e) => e.id === selectedEcrId) || ecrs[0];

  const showToast = (text: string, subText?: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, subText, type });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleSaveNewEcr = (newEcr: ECR, isDraft: boolean) => {
    onAddEcr(newEcr);
    setActiveTab('ecr');
    setSelectedEcrId(newEcr.id);
    
    showToast(
      'ECR created successfully.',
      `${newEcr.id} has been created and is now in ${isDraft ? 'Draft' : 'Draft'} stage.`
    );
  };

  const handleSaveEditedEcr = (updatedEcr: ECR) => {
    if (onUpdateEcr) {
      onUpdateEcr(updatedEcr);
    }
    if (logAction) {
      logAction(
        'Updated ECR',
        'ECR/ECN',
        updatedEcr.id,
        `Updated ECR details for ${updatedEcr.id}: ${updatedEcr.title}`
      );
    }
    showToast(
      'ECR Updated Successfully',
      `${updatedEcr.id} details and revision parameters saved.`
    );
    setEditingEcr(null);
  };

  const handleConfirmDelete = () => {
    if (!ecrToDelete) return;
    const deletedId = ecrToDelete.id;

    if (onDeleteEcr) {
      onDeleteEcr(deletedId);
    }
    if (logAction) {
      logAction(
        'Deleted ECR',
        'ECR/ECN',
        deletedId,
        `Deleted draft ECR: ${deletedId}`
      );
    }
    showToast('ECR Deleted', `${deletedId} was permanently removed.`);
    setEcrToDelete(null);
  };

  const handleConfirmArchive = () => {
    if (!ecrToArchive) return;
    const archivedId = ecrToArchive.id;

    if (onArchiveEcr) {
      onArchiveEcr(archivedId, archiveReason);
    }
    if (logAction) {
      logAction(
        'Archived ECR',
        'ECR/ECN',
        archivedId,
        `Archived/Cancelled controlled ECR ${archivedId}. Reason: ${archiveReason || 'Standard PLM Cancellation'}`
      );
    }
    showToast('ECR Cancelled & Archived', `${archivedId} marked as Archived/Cancelled.`);
    setEcrToArchive(null);
    setArchiveReason('');
  };

  // Signoff Execution Handler
  const handleExecuteSignoff = () => {
    if (!signaturePassword) {
      showToast('Signature Failed', 'Enterprise authentication password is required.', 'error');
      return;
    }

    if (signatureTargetType === 'ecn' && selectedEcn) {
      onUpdateEcnSignoff(selectedEcn.id, currentPersona, true, signoffComment || 'Electronically Signed & Approved');
      showToast('ECN Signed Off', `Approved by ${USER_PERSONAS[currentPersona].name}`);
    } else if (signatureTargetType === 'ecr' && selectedEcr) {
      if (onUpdateEcrSignoff) {
        onUpdateEcrSignoff(selectedEcr.id, currentPersona, true, signoffComment || 'Electronically Signed & Approved');
      } else {
        const updatedSignoffs: Record<UserPersona, SignoffStatus> = {
          ...(selectedEcr.signoffs || {
            design: { persona: 'design', approved: false, approverName: 'Alex Rivera, PE' },
            mfg: { persona: 'mfg', approved: false, approverName: 'Marcus Vance' },
            quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
            pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
            admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
          }),
          [currentPersona]: {
            persona: currentPersona,
            approved: true,
            approverName: currentUser?.name || USER_PERSONAS[currentPersona].name,
            date: new Date().toISOString().split('T')[0],
            comments: signoffComment || 'Electronically Signed & Approved',
            digitalSignatureHash: `SIG-${Math.floor(100000 + Math.random() * 900000)}-${currentPersona.toUpperCase()}`
          }
        };

        const allApproved = Object.values(updatedSignoffs).every((s) => s.approved);
        const nextStage: EcnPipelineStage = allApproved ? 'Released' : (selectedEcr.workflowStage || 'Draft');

        selectedEcr.signoffs = updatedSignoffs;
        selectedEcr.workflowStage = nextStage;
        if (allApproved) selectedEcr.status = 'Approved';
      }

      if (logAction) {
        logAction(
          'Signed Off ECR Stage',
          'ECR/ECN',
          selectedEcr.id,
          `${currentUser?.name || USER_PERSONAS[currentPersona].name} (${currentPersona.toUpperCase()}) executed digital signature.`
        );
      }
      showToast('ECR Signed Off', `Approved by ${USER_PERSONAS[currentPersona].name}`);
    }

    setShowSignatureModal(false);
    setSignoffComment('');
    setSignaturePassword('');
  };

  const STAGES: EcnPipelineStage[] = ['Draft', 'Design Review', 'Mfg Review', 'Quality Review', 'Final Signoff', 'Released'];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-xs font-semibold shadow-xl flex items-start space-x-3 border transition-all animate-bounce ${
          toastMsg.type === 'error'
            ? 'bg-rose-500 text-white border-rose-600'
            : 'bg-cyan-500 text-slate-950 border-cyan-600'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{toastMsg.text}</div>
            {toastMsg.subText && <div className="text-[11px] opacity-90">{toastMsg.subText}</div>}
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl text-amber-500 border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}>
            <GitPullRequest className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Engineering Change Management & Workflow Engine
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Traceable ECR/ECN change pipeline with ISO 9001 cryptographic signoffs and automatic revision control.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className={`flex items-center p-1 rounded-xl border space-x-1 text-xs font-medium ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setActiveTab('ecr')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ecr'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span>ECR Requests ({ecrs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ecn')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ecn'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <span>ECN Notices ({ecns.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewEcrModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New ECR</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ECR TAB VIEW (FULL ECR WORKFLOW & ACTIVE CHANGE NOTICES)               */}
      {/* ========================================================================= */}
      {activeTab === 'ecr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ECR Left Sidebar: Active Change Notices / Requests List (4 cols) */}
          <div className={`lg:col-span-4 rounded-[18px] p-5 border shadow-sm space-y-3 flex flex-col justify-between transition-colors ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div>
              <div className={`flex items-center justify-between border-b pb-3 mb-3 ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <h3 className={`text-xs uppercase tracking-wider font-bold flex items-center space-x-2 ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <Layers className="w-4 h-4 text-cyan-500" />
                  <span>Change Requests ({ecrs.length})</span>
                </h3>
                <span className="badge-status badge-active text-[10px]">
                  LIVE PIPELINE
                </span>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {ecrs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <GitPullRequest className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs">No change requests logged.</p>
                  </div>
                ) : (
                  ecrs.map((ecr) => {
                  const targetPart = partsMap[ecr.targetProductId || ecr.impactedPartIds?.[0] || ''];
                  const isSelected = ecr.id === selectedEcr?.id;
                  const currentR = ecr.currentRevision || targetPart?.currentRev || 'B.0';
                  const proposedR = ecr.proposedRevision || 'B.1';
                  const stage = ecr.workflowStage || (ecr.status === 'Draft' ? 'Draft' : 'In Review');

                  // PLM Workflow Protection: Draft vs Controlled Stages
                  const isDraft = (ecr.status === 'Draft' || ecr.workflowStage === 'Draft') && 
                                  ecr.status !== 'Approved' && 
                                  ecr.workflowStage !== 'Released' && 
                                  ecr.workflowStage !== 'Final Signoff' && 
                                  ecr.workflowStage !== 'Quality Review' && 
                                  ecr.workflowStage !== 'Mfg Review' && 
                                  ecr.workflowStage !== 'Design Review';
                  const isProtected = !isDraft;

                  return (
                    <div
                      key={ecr.id}
                      onClick={() => setSelectedEcrId(ecr.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                        isSelected
                          ? isDark ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-cyan-50/70 border-cyan-400 shadow-sm'
                          : isDark ? 'bg-[#0D1628] border-[#243149] hover:border-slate-600' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-500">{ecr.id}</span>
                        
                        <div className="flex items-center space-x-1.5">
                          <span className={`badge-status text-[10px] ${
                            stage === 'Draft'
                              ? 'badge-draft'
                              : stage === 'Released' || ecr.status === 'Approved'
                              ? 'badge-active'
                              : 'badge-review'
                          }`}>
                            {stage}
                          </span>

                          {/* Action Menu Trigger (⋮) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuEcrId(openMenuEcrId === ecr.id ? null : ecr.id);
                              }}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                isDark ? 'hover:bg-slate-800 text-[#94A3B8]' : 'hover:bg-slate-200 text-[#64748B]'
                              }`}
                              title="ECR Actions"
                              aria-label={`Actions for ${ecr.id}`}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Action Menu */}
                            {openMenuEcrId === ecr.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 top-7 z-40 w-56 rounded-xl shadow-xl p-1.5 text-xs space-y-1 border ${
                                  isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
                                }`}
                              >
                                {isProtected && (
                                  <div className="p-2 mb-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-500 flex items-start space-x-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>Controlled workflow item. Cannot be deleted.</span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuEcrId(null);
                                    setEditingEcr(ecr);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
                                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                                  }`}
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
                                  <span>Edit ECR</span>
                                </button>

                                {isProtected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuEcrId(null);
                                      setSelectedEcrId(ecr.id);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer ${
                                      isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                                    }`}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                                    <span>View Details</span>
                                  </button>
                                )}

                                {isDraft ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuEcrId(null);
                                      setEcrToDelete(ecr);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete ECR</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuEcrId(null);
                                      setEcrToArchive(ecr);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Archive / Cancel ECR</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <h4 className={`text-xs font-semibold line-clamp-1 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{ecr.title}</h4>

                      <div className={`flex items-center justify-between text-[11px] font-mono pt-1 border-t ${
                        isDark ? 'border-slate-800 text-[#94A3B8]' : 'border-slate-200 text-[#64748B]'
                      }`}>
                        <span className="truncate max-w-[140px]">
                          {targetPart?.partNumber || ecr.targetProductPartNumber || 'ASM-GBX-5000'}
                        </span>
                        <span className="text-emerald-500 font-bold shrink-0">
                          {currentR} → {proposedR}
                        </span>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>

            <button
              onClick={() => setShowNewEcrModal(true)}
              className="btn-secondary btn-sm w-full mt-3 flex items-center justify-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Another ECR</span>
            </button>
          </div>

          {/* ECR Detailed View (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedEcr ? (
              <div className={`rounded-[18px] p-6 border shadow-sm space-y-6 transition-colors ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                
                {/* Header Info */}
                <div className={`flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-5 gap-4 ${
                  isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-sm font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                        isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      }`}>
                        {selectedEcr.id}
                      </span>
                      <span className={`badge-status text-xs ${
                        (selectedEcr.workflowStage || selectedEcr.status) === 'Draft'
                          ? 'badge-draft'
                          : 'badge-review'
                      }`}>
                        Status: {selectedEcr.workflowStage || selectedEcr.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${
                        isDark ? 'bg-[#0D1628] border-[#243149] text-[#94A3B8]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                      }`}>
                        Risk Score: {selectedEcr.riskScore ?? 'Not Yet Assessed'}
                      </span>
                      {selectedEcr.priority && (
                        <span className="badge-status badge-archived text-xs font-bold">
                          {selectedEcr.priority} Priority
                        </span>
                      )}
                    </div>

                    <h2 className={`text-xl font-bold tracking-tight pt-1 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                      {selectedEcr.title}
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                      {selectedEcr.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingEcr(selectedEcr)}
                      className="btn-secondary btn-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Edit ECR</span>
                    </button>

                    <div className={`text-right font-mono shrink-0 p-3 rounded-xl border ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Revision Upgrade</div>
                      <div className="text-base font-bold text-emerald-500">
                        {selectedEcr.currentRevision || 'Rev B.0'} <ArrowRight className="w-3.5 h-3.5 inline mx-1 text-slate-400" /> {selectedEcr.proposedRevision || 'Rev B.1'}
                      </div>
                      <div className={`text-[10px] mt-0.5 truncate max-w-[170px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        Target: {selectedEcr.targetProductPartNumber || 'ASM-GBX-5000'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Stepper Pipeline */}
                <div>
                  <h4 className={`text-xs uppercase tracking-wider font-bold mb-3 flex items-center justify-between ${
                    isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    <span>Visual Workflow Stage Pipeline</span>
                    <span className="text-cyan-500 font-normal">Active Stage: {selectedEcr.workflowStage || 'Draft'}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {STAGES.map((stg, idx) => {
                      const currentStage = selectedEcr.workflowStage || 'Draft';
                      const isCurrent = currentStage === stg;
                      const isPassed = STAGES.indexOf(currentStage) > idx;

                      return (
                        <div
                          key={stg}
                          className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                            isCurrent
                              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                              : isPassed
                              ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDark ? 'bg-[#0D1628] text-slate-500 border-[#243149]' : 'bg-[#F8FAFC] text-slate-400 border-[#E2E8F0]'
                          }`}
                        >
                          <div className={`text-[10px] ${isCurrent ? 'text-slate-950 font-semibold' : 'text-secondary'}`}>
                            Step 0{idx + 1}
                          </div>
                          <div className="truncate font-semibold mt-0.5">{stg}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Required Electronic Signoffs */}
                <div className={`space-y-4 border-t pt-5 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs uppercase tracking-wider font-bold ${
                      isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      Required Electronic Signoffs
                    </h4>
                    <span className="text-xs text-cyan-500">
                      Active Persona: <b>{USER_PERSONAS[currentPersona].name}</b> ({USER_PERSONAS[currentPersona].role})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['design', 'mfg', 'quality', 'pm'] as UserPersona[]).map((personaKey) => {
                      const personaInfo = USER_PERSONAS[personaKey];
                      const defaultSignoffs: Record<UserPersona, SignoffStatus> = {
                        design: { persona: 'design', approved: false, approverName: 'Alex Rivera, PE' },
                        mfg: { persona: 'mfg', approved: false, approverName: 'Marcus Vance' },
                        quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
                        pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
                        admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
                      };
                      const signoff: SignoffStatus = selectedEcr.signoffs?.[personaKey] || defaultSignoffs[personaKey];
                      const isMyPersona = currentPersona === personaKey;

                      return (
                        <div
                          key={personaKey}
                          className={`p-3.5 rounded-xl border flex items-start justify-between transition-all ${
                            signoff.approved
                              ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${personaInfo.badgeColor}`}>
                                {personaInfo.department}
                              </span>
                              <span className={`text-xs font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{personaInfo.name}</span>
                            </div>

                            {signoff.approved ? (
                              <div className="text-[11px] font-mono text-emerald-500 space-y-0.5 pt-1">
                                <div className="flex items-center space-x-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Approved on {signoff.date || new Date().toISOString().split('T')[0]}</span>
                                </div>
                                {signoff.digitalSignatureHash && (
                                  <div className={`text-[9px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                                    Hash: {signoff.digitalSignatureHash}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-amber-500 flex items-center space-x-1.5 pt-1 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending Signoff</span>
                              </div>
                            )}
                          </div>

                          {isMyPersona && !signoff.approved && (
                            <button
                              onClick={() => {
                                setSignatureTargetType('ecr');
                                setShowSignatureModal(true);
                              }}
                              className="btn-primary btn-sm shrink-0 ml-3"
                            >
                              <FileKey className="w-3.5 h-3.5" />
                              <span>Digital Sign</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target Product & Engineering Change Details */}
                <div className={`border-t pt-5 space-y-3 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-bold ${
                    isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    Target Assembly & Impact Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>REASON FOR CHANGE</span>
                      <span className={`font-medium text-xs mt-1 block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        {selectedEcr.reasonForChange || selectedEcr.description || 'Improve bearing seat tolerance.'}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PROPOSED SOLUTION</span>
                      <span className={`font-medium text-xs mt-1 block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        {selectedEcr.proposedSolution || 'Update 3D model & 2D drawing tolerance stack.'}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>AFFECTED COMPONENTS</span>
                      <span className="text-cyan-500 font-bold text-xs mt-1 block font-mono">
                        {selectedEcr.affectedComponents || 'Housing, Bearing Races'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                {selectedEcr.attachments && selectedEcr.attachments.length > 0 && (
                  <div className={`border-t pt-5 space-y-3 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                    <h4 className={`text-xs uppercase tracking-wider font-bold flex items-center space-x-2 ${
                      isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      <Paperclip className="w-4 h-4 text-cyan-500" />
                      <span>Attached Artefacts & Documents ({selectedEcr.attachments.length})</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedEcr.attachments.map((att) => (
                        <div
                          key={att.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate pr-2">
                            <div className={`p-2 rounded-lg text-cyan-500 shrink-0 ${
                              isDark ? 'bg-[#151F32]' : 'bg-white border border-slate-200'
                            }`}>
                              {att.type.includes('CAD') ? (
                                <FileCode className="w-4 h-4" />
                              ) : att.type.includes('Material') ? (
                                <FileSpreadsheet className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="truncate">
                              <div className={`font-semibold truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{att.name}</div>
                              <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                                {att.type} • {att.size} • {att.uploadedAt}
                              </div>
                            </div>
                          </div>

                          <span className="badge-status badge-active text-[10px] shrink-0">
                            ATTACHED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ECR Activity / Audit Trail */}
                <div className={`border-t pt-5 space-y-3 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-bold ${
                    isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    Activity & Audit History
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-[#0D1628] border-[#243149] text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>
                          <b>ECR Log:</b> {selectedEcr.id} by <b>{selectedEcr.requester || selectedEcr.createdBy || 'Change Author'}</b>
                        </span>
                      </div>
                      <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                        {selectedEcr.dateCreated || new Date().toISOString().split('T')[0]} • Status: {selectedEcr.status}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className={`rounded-[18px] p-12 text-center space-y-3 border ${
                isDark ? 'bg-[#111B2E] border-[#243149] text-[#94A3B8]' : 'bg-white border-[#E2E8F0] text-[#64748B]'
              }`}>
                <GitPullRequest className="w-10 h-10 text-secondary mx-auto opacity-60" />
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  {ecrs.length === 0 ? 'No Engineering Change Requests (ECR) Yet' : 'No ECR Selected'}
                </h3>
                <p className="text-xs max-w-sm mx-auto">
                  {ecrs.length === 0 
                    ? 'Submit a change request to propose design modifications, revision bumps, or cost/weight optimizations.' 
                    : 'Select an ECR from the left sidebar or click "+ New ECR" to create a new change request.'}
                </p>
                {ecrs.length === 0 && (
                  <button
                    onClick={() => setShowNewEcrModal(true)}
                    className="btn-primary btn-sm mx-auto flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First ECR</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ECN TAB VIEW (EXISTING ECN WORKFLOW PIPELINE)                          */}
      {/* ========================================================================= */}
      {activeTab === 'ecn' && (
        ecns.length === 0 ? (
          <div className={`p-12 text-center rounded-[18px] border shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <Layers className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
            <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              No Engineering Change Notices (ECN) Available
            </h3>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Change notices are officially released when an Engineering Change Request (ECR) has completed cross-functional review and electronic signoffs.
            </p>
          </div>
        ) : selectedEcn ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ECN Master List (4 cols) */}
          <div className={`lg:col-span-4 rounded-[18px] p-5 border shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <h3 className={`text-xs uppercase tracking-wider font-bold mb-2 flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Change Notices ({ecns.length})</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {ecns.map((ecn) => {
                const targetPart = partsMap[ecn.targetPartId];
                const isSelected = ecn.id === selectedEcn.id;

                return (
                  <div
                    key={ecn.id}
                    onClick={() => setSelectedEcnId(ecn.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? isDark ? 'bg-amber-500/10 border-amber-500/50' : 'bg-amber-50 border-amber-400 shadow-sm'
                        : isDark ? 'bg-[#0D1628] border-[#243149] hover:border-slate-600' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-500">{ecn.id}</span>
                      <span className="badge-status badge-review text-[10px]">
                        {ecn.pipelineStage}
                      </span>
                    </div>

                    <h4 className={`text-xs font-semibold line-clamp-1 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{ecn.title}</h4>

                    <div className={`mt-2 flex items-center justify-between text-[11px] font-mono pt-1 border-t ${
                      isDark ? 'border-slate-800 text-[#94A3B8]' : 'border-slate-200 text-[#64748B]'
                    }`}>
                      <span>Target: {targetPart?.partNumber || ecn.targetPartId}</span>
                      <span className="text-emerald-500 font-bold">
                        {ecn.fromRevision} → {ecn.toRevision}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ECN Detailed Pipeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className={`rounded-[18px] p-6 border shadow-sm space-y-6 transition-colors ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className={`flex items-start justify-between border-b pb-4 ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedEcn.id}
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Risk Score: {selectedEcn.riskScore} / 100</span>
                  </div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{selectedEcn.title}</h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{selectedEcn.reasonForChange}</p>
                </div>

                <div className={`text-right font-mono p-3 rounded-xl border ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <div className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Revision Upgrade</div>
                  <div className="text-lg font-bold text-emerald-500">
                    {selectedEcn.fromRevision} <ArrowRight className="w-4 h-4 inline mx-1 text-slate-400" /> {selectedEcn.toRevision}
                  </div>
                </div>
              </div>

              {/* Pipeline Stepper */}
              <div>
                <h4 className={`text-xs uppercase tracking-wider font-bold mb-3 ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}>
                  Visual Workflow Stage Pipeline
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {STAGES.map((stg, idx) => {
                    const isCurrent = selectedEcn.pipelineStage === stg;
                    const isPassed = STAGES.indexOf(selectedEcn.pipelineStage) > idx;

                    return (
                      <div
                        key={stg}
                        className={`p-2.5 rounded-xl border text-center text-[11px] transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                            : isPassed
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark ? 'bg-[#0D1628] text-slate-500 border-[#243149]' : 'bg-[#F8FAFC] text-slate-400 border-[#E2E8F0]'
                        }`}
                      >
                        <div className={`text-[10px] ${isCurrent ? 'text-slate-950 font-semibold' : 'text-secondary'}`}>Step 0{idx + 1}</div>
                        <div className="font-semibold">{stg}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signoffs Grid */}
              <div className={`space-y-4 border-t pt-5 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                <h4 className={`text-xs uppercase tracking-wider font-bold flex items-center justify-between ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}>
                  <span>Required Electronic Signoffs</span>
                  <span className="text-[11px] text-cyan-500 normal-case font-normal">
                    Active Persona: {USER_PERSONAS[currentPersona].role}
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['design', 'mfg', 'quality', 'pm'] as UserPersona[]).map((personaKey) => {
                    const personaInfo = USER_PERSONAS[personaKey];
                    const signoff = selectedEcn.signoffs[personaKey];
                    const isMyPersona = currentPersona === personaKey;

                    return (
                      <div
                        key={personaKey}
                        className={`p-3.5 rounded-xl border flex items-start justify-between ${
                          signoff.approved
                            ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${personaInfo.badgeColor}`}>
                              {personaInfo.department}
                            </span>
                            <span className={`text-xs font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{personaInfo.name}</span>
                          </div>

                          {signoff.approved ? (
                            <div className="text-[11px] font-mono text-emerald-500 space-y-0.5 pt-1">
                              <div className="flex items-center space-x-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Approved on {signoff.date}</span>
                              </div>
                              {signoff.digitalSignatureHash && (
                                <div className={`text-[9px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Hash: {signoff.digitalSignatureHash}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] font-mono text-amber-500 flex items-center space-x-1 pt-1 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending Review</span>
                            </div>
                          )}
                        </div>

                        {isMyPersona && !signoff.approved && (
                          <button
                            onClick={() => {
                              setSignatureTargetType('ecn');
                              setShowSignatureModal(true);
                            }}
                            className="btn-primary btn-sm shrink-0 ml-3"
                          >
                            <FileKey className="w-3.5 h-3.5" />
                            <span>Digital Sign</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null
      )}

      {/* CREATE ECR MODAL COMPONENT */}
      <CreateEcrModal
        isOpen={showNewEcrModal}
        onClose={() => setShowNewEcrModal(false)}
        partsMap={partsMap}
        currentPersona={currentPersona}
        currentUser={currentUser}
        existingEcrs={ecrs}
        onSaveEcr={handleSaveNewEcr}
      />

      {/* EDIT ECR MODAL COMPONENT */}
      <EditEcrModal
        isOpen={!!editingEcr}
        onClose={() => setEditingEcr(null)}
        ecr={editingEcr}
        partsMap={partsMap}
        currentPersona={currentPersona}
        currentUser={currentUser}
        onSaveEcr={handleSaveEditedEcr}
      />

      {/* DELETE ECR CONFIRMATION MODAL */}
      {ecrToDelete && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Delete ECR?</h3>
                  <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Permanent Action</span>
                </div>
              </div>
              <button
                onClick={() => setEcrToDelete(null)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className={`leading-relaxed text-xs ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                Are you sure you want to delete <b className="text-rose-500 font-mono font-bold">{ecrToDelete.id}</b>? This action cannot be undone.
              </p>

              <div className={`p-3.5 rounded-xl border space-y-1.5 text-[11px] ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{ecrToDelete.title}</div>
                <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Target: {ecrToDelete.targetProductPartNumber || ecrToDelete.targetProductId || 'Gearbox Assembly'}</div>
                <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Status: {ecrToDelete.status} • Stage: {ecrToDelete.workflowStage || 'Draft'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t pt-4 border-slate-700/30">
              <button
                type="button"
                onClick={() => setEcrToDelete(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-destructive btn-sm flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ECR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE / CANCEL CONTROLLED ECR MODAL */}
      {ecrToArchive && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-start justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Archive / Cancel Controlled ECR</h3>
                  <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PLM Workflow Protection</span>
                </div>
              </div>
              <button
                onClick={() => setEcrToArchive(null)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-xs flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>This ECR has entered the controlled workflow and cannot be permanently deleted.</span>
              </div>

              <p className={`leading-relaxed text-xs ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                <b>{ecrToArchive.id}</b> has progressed to stage <span className="font-mono text-amber-500 font-bold">{ecrToArchive.workflowStage || ecrToArchive.status}</span>. In accordance with ISO 9001 PLM change control standards, it will be marked as Cancelled/Archived with audit retention.
              </p>

              <div>
                <label className={`block text-[11px] uppercase font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Reason for Cancellation / Archive
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design superseded by project freeze..."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="plm-input w-full text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t pt-4 border-slate-700/30">
              <button
                type="button"
                onClick={() => setEcrToArchive(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="btn-primary btn-sm flex items-center space-x-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive / Cancel ECR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Electronic Signature Modal */}
      {showSignatureModal && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                <FileKey className="w-4.5 h-4.5 text-emerald-500" />
                <span>Execute ISO Electronic Signature</span>
              </h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-secondary hover:text-primary cursor-pointer text-base">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Review Comments</label>
                <input
                  type="text"
                  placeholder="Enter engineering signoff comment..."
                  value={signoffComment}
                  onChange={(e) => setSignoffComment(e.target.value)}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Confirm Enterprise Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signaturePassword}
                  onChange={(e) => setSignaturePassword(e.target.value)}
                  className="plm-input w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t pt-4 border-slate-700/30">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSignoff}
                className="btn-primary btn-sm"
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

