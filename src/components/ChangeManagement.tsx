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
  X,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
  Lock,
  RefreshCw,
  UploadCloud,
  RotateCcw
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
  const [signingPersonaKey, setSigningPersonaKey] = useState<UserPersona>('design');
  const [signoffComment, setSignoffComment] = useState<string>('');
  const [signaturePassword, setSignaturePassword] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<{ text: string; subText?: string; type: 'success' | 'error' } | null>(null);

  // Lightbox Modal for Full-Screen Defect Photo Inspection
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; caption?: string; ecrId: string; fileName?: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);

  // Quick Photo Upload / Update State
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  const [quickPhotoName, setQuickPhotoName] = useState<string>('');
  const [quickPhotoCaption, setQuickPhotoCaption] = useState<string>('');
  const [quickPhotoError, setQuickPhotoError] = useState<string>('');

  // Permissions: Admin or Assigned Engineers
  const isAdmin = currentPersona === 'admin' || currentUser?.role === 'ADMIN' || currentUser?.systemRole === 'ADMIN';

  const isAssignedToEcr = (ecr: ECR): boolean => {
    if (isAdmin) return true;
    if (currentUser?.name && (currentUser.name === ecr.requester || currentUser.name === ecr.createdBy)) return true;
    if (['design', 'mfg', 'quality', 'pm'].includes(currentPersona)) return true;
    if (ecr.assignedEngineers && currentUser?.name) {
      return Object.values(ecr.assignedEngineers).some(
        (name) => name && name.toLowerCase().includes(currentUser.name.toLowerCase())
      );
    }
    return false;
  };

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

  // Auto-enrich default mock ECR with realistic high-resolution defect inspection photo if not yet attached
  useEffect(() => {
    if (selectedEcr && selectedEcr.id === 'ECR-2026-104' && !selectedEcr.issueImage) {
      const enriched: ECR = {
        ...selectedEcr,
        issueImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        issueImageName: 'gear_tooth_root_microcrack_fea.png',
        issueImageCaption: 'FEA fatigue stress concentration & tooth root trochoid micro-fracture under 450 Nm overload.',
        assignedEngineers: selectedEcr.assignedEngineers || {
          designEngineer: 'Alex Rivera, PE',
          mfgEngineer: 'Marcus Vance',
          qualityEngineer: 'Dr. Elena Rostova',
          pmEngineer: 'David Sterling'
        }
      };
      if (onUpdateEcr) {
        onUpdateEcr(enriched);
      }
    }
  }, [selectedEcrId]);

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

  // Admin Override: Revoke Signoff
  const handleRevokeSignoff = (personaKey: UserPersona) => {
    if (!selectedEcr || !isAdmin) return;
    const defaultSignoffs = {
      design: { persona: 'design' as UserPersona, approved: false, approverName: selectedEcr.assignedEngineers?.designEngineer || 'Alex Rivera, PE' },
      mfg: { persona: 'mfg' as UserPersona, approved: false, approverName: selectedEcr.assignedEngineers?.mfgEngineer || 'Marcus Vance' },
      quality: { persona: 'quality' as UserPersona, approved: false, approverName: selectedEcr.assignedEngineers?.qualityEngineer || 'Dr. Elena Rostova' },
      pm: { persona: 'pm' as UserPersona, approved: false, approverName: selectedEcr.assignedEngineers?.pmEngineer || 'David Sterling' },
      admin: { persona: 'admin' as UserPersona, approved: false, approverName: 'System Admin' }
    };
    const current = selectedEcr.signoffs?.[personaKey] || defaultSignoffs[personaKey];
    const updatedSignoffs = {
      ...(selectedEcr.signoffs || defaultSignoffs),
      [personaKey]: {
        ...current,
        approved: false,
        digitalSignatureHash: undefined,
        comments: undefined
      }
    };
    const updated: ECR = {
      ...selectedEcr,
      signoffs: updatedSignoffs,
      workflowStage: 'Design Review' as EcnPipelineStage,
      status: 'In Review'
    };
    if (onUpdateEcr) {
      onUpdateEcr(updated);
    }
    if (logAction) {
      logAction('Revoked Signoff', 'ECR/ECN', selectedEcr.id, `Admin revoked ${personaKey.toUpperCase()} signoff.`);
    }
    showToast('Signoff Revoked', `${personaKey.toUpperCase()} approval reset to Pending.`);
  };

  // Quick Photo Save / Update
  const handleSaveQuickPhoto = () => {
    if (!selectedEcr) return;
    if (!quickPhotoUrl.trim()) {
      setQuickPhotoError('Please select or upload an image.');
      return;
    }
    const updated: ECR = {
      ...selectedEcr,
      issueImage: quickPhotoUrl.trim(),
      issueImageName: quickPhotoName.trim() || 'defect_evidence.jpg',
      issueImageCaption: quickPhotoCaption.trim() || undefined,
      updatedAt: new Date().toISOString()
    };
    if (onUpdateEcr) {
      onUpdateEcr(updated);
    }
    if (logAction) {
      logAction('Updated Issue Photo', 'ECR/ECN', selectedEcr.id, `Attached defect photo to ${selectedEcr.id}`);
    }
    showToast('Defect Photo Attached', `Visual evidence updated for ${selectedEcr.id}`);
    setShowPhotoModal(false);
    setQuickPhotoError('');
  };

  // Quick Photo File Upload Handler
  const handleQuickImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQuickPhotoError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setQuickPhotoError('Image size exceeds 5MB limit.');
      return;
    }
    setQuickPhotoError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setQuickPhotoUrl(dataUrl);
      setQuickPhotoName(file.name);
      if (!quickPhotoCaption) {
        setQuickPhotoCaption(`Defect inspection photo for ${selectedEcr?.title || selectedEcr?.id}`);
      }
    };
    reader.readAsDataURL(file);
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
      const targetDiscipline = signingPersonaKey;
      if (onUpdateEcrSignoff) {
        onUpdateEcrSignoff(selectedEcr.id, targetDiscipline, true, signoffComment || 'Electronically Signed & Approved');
      } else {
        const defaultSignoffs: Record<UserPersona, SignoffStatus> = {
          design: { persona: 'design', approved: false, approverName: selectedEcr.assignedEngineers?.designEngineer || 'Alex Rivera, PE' },
          mfg: { persona: 'mfg', approved: false, approverName: selectedEcr.assignedEngineers?.mfgEngineer || 'Marcus Vance' },
          quality: { persona: 'quality', approved: false, approverName: selectedEcr.assignedEngineers?.qualityEngineer || 'Dr. Elena Rostova' },
          pm: { persona: 'pm', approved: false, approverName: selectedEcr.assignedEngineers?.pmEngineer || 'David Sterling' },
          admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
        };
        const updatedSignoffs: Record<UserPersona, SignoffStatus> = {
          ...(selectedEcr.signoffs || defaultSignoffs),
          [targetDiscipline]: {
            persona: targetDiscipline,
            approved: true,
            approverName: currentUser?.name || USER_PERSONAS[currentPersona].name,
            date: new Date().toISOString().split('T')[0],
            comments: signoffComment || 'Electronically Signed & Approved',
            digitalSignatureHash: `SIG-${Math.floor(100000 + Math.random() * 900000)}-${targetDiscipline.toUpperCase()}`
          }
        };

        const REQUIRED_DISCIPLINES: UserPersona[] = ['design', 'mfg', 'quality', 'pm'];
        const allApproved = REQUIRED_DISCIPLINES.every((d) => updatedSignoffs[d]?.approved);
        const nextStage: EcnPipelineStage = allApproved ? 'Released' : (selectedEcr.workflowStage || 'Draft');

        const updatedEcrObj: ECR = {
          ...selectedEcr,
          signoffs: updatedSignoffs,
          workflowStage: nextStage,
          status: allApproved ? 'Approved' : selectedEcr.status,
          updatedAt: new Date().toISOString()
        };

        if (onUpdateEcr) {
          onUpdateEcr(updatedEcrObj);
        }
      }

      if (logAction) {
        logAction(
          'Signed Off ECR Stage',
          'ECR/ECN',
          selectedEcr.id,
          `${currentUser?.name || USER_PERSONAS[currentPersona].name} (${targetDiscipline.toUpperCase()}) executed digital signature.`
        );
      }
      showToast('ECR Signed Off', `${targetDiscipline.toUpperCase()} stage approved by ${currentUser?.name || USER_PERSONAS[currentPersona].name}`);
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

                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className={`text-xs font-semibold line-clamp-1 flex-1 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{ecr.title}</h4>
                        {ecr.issueImage && (
                          <span className="shrink-0 p-0.5 px-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1" title="Defect photo attached">
                            <Camera className="w-3 h-3" />
                            <span className="text-[9px] font-mono font-bold">PHOTO</span>
                          </span>
                        )}
                      </div>

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
                      onClick={() => {
                        if (!isAssignedToEcr(selectedEcr)) {
                          showToast('Access Restricted', 'Only assigned discipline engineers or PLM Administrator can edit this ECR.', 'error');
                          return;
                        }
                        setEditingEcr(selectedEcr);
                      }}
                      className={`btn-secondary btn-sm flex items-center space-x-1.5 ${
                        !isAssignedToEcr(selectedEcr) ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      title={!isAssignedToEcr(selectedEcr) ? 'Only assigned engineers or Administrator can edit' : 'Edit ECR'}
                    >
                      {!isAssignedToEcr(selectedEcr) ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Edit3 className="w-3.5 h-3.5 text-cyan-500" />}
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
                      Required Electronic Signoffs (ISO 9001 / 21 CFR Part 11)
                    </h4>
                    <span className="text-xs text-cyan-500">
                      Active Persona: <b>{USER_PERSONAS[currentPersona].name}</b> ({USER_PERSONAS[currentPersona].role})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['design', 'mfg', 'quality', 'pm'] as UserPersona[]).map((personaKey) => {
                      const personaInfo = USER_PERSONAS[personaKey];
                      const defaultSignoffs: Record<UserPersona, SignoffStatus> = {
                        design: { persona: 'design', approved: false, approverName: selectedEcr.assignedEngineers?.designEngineer || 'Alex Rivera, PE' },
                        mfg: { persona: 'mfg', approved: false, approverName: selectedEcr.assignedEngineers?.mfgEngineer || 'Marcus Vance' },
                        quality: { persona: 'quality', approved: false, approverName: selectedEcr.assignedEngineers?.qualityEngineer || 'Dr. Elena Rostova' },
                        pm: { persona: 'pm', approved: false, approverName: selectedEcr.assignedEngineers?.pmEngineer || 'David Sterling' },
                        admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
                      };
                      const signoff: SignoffStatus = selectedEcr.signoffs?.[personaKey] || defaultSignoffs[personaKey];
                      const assignedName =
                        selectedEcr.signoffs?.[personaKey]?.approverName ||
                        (personaKey === 'design' ? selectedEcr.assignedEngineers?.designEngineer :
                         personaKey === 'mfg' ? selectedEcr.assignedEngineers?.mfgEngineer :
                         personaKey === 'quality' ? selectedEcr.assignedEngineers?.qualityEngineer :
                         selectedEcr.assignedEngineers?.pmEngineer) ||
                        personaInfo.name;

                      const isMyPersona = currentPersona === personaKey;
                      const matchesAssigned = Boolean(currentUser?.name && assignedName.toLowerCase().includes(currentUser.name.toLowerCase()));
                      const canSign = (isAdmin || isMyPersona || matchesAssigned) && !signoff.approved;

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
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${personaInfo.badgeColor}`}>
                                {personaInfo.department}
                              </span>
                              <span className={`text-xs font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                                {assignedName}
                              </span>
                            </div>

                            {signoff.approved ? (
                              <div className="text-[11px] font-mono text-emerald-500 space-y-0.5 pt-1">
                                <div className="flex items-center space-x-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Approved by {signoff.approverName || assignedName} on {signoff.date || new Date().toISOString().split('T')[0]}</span>
                                </div>
                                {signoff.digitalSignatureHash && (
                                  <div className={`text-[9px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                                    Hash: {signoff.digitalSignatureHash}
                                  </div>
                                )}
                                {signoff.comments && (
                                  <div className={`text-[10px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    "{signoff.comments}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] font-mono text-amber-500 flex items-center space-x-1.5 pt-1 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending Signoff • Assigned: {assignedName}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 ml-3">
                            {canSign && (
                              <button
                                onClick={() => {
                                  setSigningPersonaKey(personaKey);
                                  setSignatureTargetType('ecr');
                                  setSignoffComment('Electronically Signed & Approved');
                                  setSignaturePassword('');
                                  setShowSignatureModal(true);
                                }}
                                className="btn-primary btn-sm shrink-0 flex items-center space-x-1.5 cursor-pointer shadow-sm"
                              >
                                <FileKey className="w-3.5 h-3.5" />
                                <span>Digital Sign</span>
                              </button>
                            )}

                            {!signoff.approved && !canSign && (
                              <div
                                className={`text-[10px] flex items-center space-x-1 font-mono shrink-0 px-2.5 py-1 rounded-md border ${
                                  isDark ? 'border-[#243149] text-slate-500 bg-[#111B2E]' : 'border-slate-200 text-slate-400 bg-slate-50'
                                }`}
                                title={`Requires digital signature from assigned engineer (${assignedName}) or Administrator`}
                              >
                                <Lock className="w-3 h-3" />
                                <span>{personaKey.toUpperCase()} Only</span>
                              </div>
                            )}

                            {isAdmin && signoff.approved && (
                              <button
                                type="button"
                                onClick={() => handleRevokeSignoff(personaKey)}
                                className="text-[10px] text-rose-500 hover:text-rose-400 font-mono underline cursor-pointer"
                                title="PLM Admin override: Revoke this stage approval"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Defect & Issue Evidence Photo (ECR Visual Inspection) */}
                <div className={`border-t pt-5 space-y-3 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs uppercase tracking-wider font-bold flex items-center space-x-2 ${
                      isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}>
                      <Camera className="w-4 h-4 text-cyan-500" />
                      <span>Issue Evidence & Defect Inspection Photo</span>
                      {selectedEcr.issueImage && (
                        <span className="badge-status badge-review text-[10px] py-0 font-mono">
                          PHOTO ATTACHED
                        </span>
                      )}
                    </h4>

                    <button
                      type="button"
                      onClick={() => {
                        setQuickPhotoUrl(selectedEcr.issueImage || '');
                        setQuickPhotoName(selectedEcr.issueImageName || '');
                        setQuickPhotoCaption(selectedEcr.issueImageCaption || '');
                        setShowPhotoModal(true);
                      }}
                      className="text-xs text-cyan-500 hover:text-cyan-400 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{selectedEcr.issueImage ? 'Replace / Change Photo' : 'Attach Issue Photo'}</span>
                    </button>
                  </div>

                  {selectedEcr.issueImage ? (
                    <div className={`rounded-2xl border p-4 transition-all ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        {/* Interactive Photo Thumbnail */}
                        <div
                          onClick={() => {
                            setLightboxImage({
                              url: selectedEcr.issueImage!,
                              title: selectedEcr.title,
                              caption: selectedEcr.issueImageCaption,
                              ecrId: selectedEcr.id,
                              fileName: selectedEcr.issueImageName
                            });
                            setLightboxZoom(1);
                          }}
                          className="relative group cursor-pointer overflow-hidden rounded-xl border border-cyan-500/30 shadow-lg w-full md:w-80 h-52 shrink-0 bg-black/40"
                        >
                          <img
                            src={selectedEcr.issueImage}
                            alt={selectedEcr.issueImageCaption || 'Issue Evidence'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-85 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                            <span className="self-end px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 flex items-center space-x-1.5 shadow-md">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Click to Inspect Full Photo</span>
                            </span>
                            <div>
                              <div className="text-white font-mono text-xs font-bold truncate">
                                {selectedEcr.issueImageName || 'defect_evidence.png'}
                              </div>
                              <div className="text-slate-300 text-[10px] truncate">
                                ISO 9001 Photographic Defect Record
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Image Metadata & Caption */}
                        <div className="flex-1 space-y-3 w-full">
                          <div className={`p-3.5 rounded-xl border ${
                            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                          }`}>
                            <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                              INSPECTION DEFECT OBSERVATION & CAPTION
                            </span>
                            <p className={`text-xs mt-1.5 leading-relaxed font-medium ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                              {selectedEcr.issueImageCaption || selectedEcr.reasonForChange || 'Physical inspection photographic record for engineering proposal.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                            <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'}`}>
                              <span className={`text-[9px] block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>CAPTURE SOURCE</span>
                              <span className="text-cyan-400 font-bold truncate block">Physical CMM / Test</span>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'}`}>
                              <span className={`text-[9px] block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>TRACEABILITY</span>
                              <span className="text-emerald-400 font-bold truncate block">{selectedEcr.id}</span>
                            </div>
                            <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'}`}>
                              <span className={`text-[9px] block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>EVIDENCE STATUS</span>
                              <span className="text-amber-400 font-bold truncate block">Verified & Stored</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 pt-1 flex-wrap gap-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setLightboxImage({
                                  url: selectedEcr.issueImage!,
                                  title: selectedEcr.title,
                                  caption: selectedEcr.issueImageCaption,
                                  ecrId: selectedEcr.id,
                                  fileName: selectedEcr.issueImageName
                                });
                                setLightboxZoom(1);
                              }}
                              className="btn-primary btn-sm flex items-center space-x-1.5 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Full Photo (ECR with Photo)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickPhotoUrl(selectedEcr.issueImage || '');
                                setQuickPhotoName(selectedEcr.issueImageName || '');
                                setQuickPhotoCaption(selectedEcr.issueImageCaption || '');
                                setShowPhotoModal(true);
                              }}
                              className="btn-secondary btn-sm flex items-center space-x-1.5 text-cyan-500"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Replace Photo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setQuickPhotoUrl('');
                        setQuickPhotoName('');
                        setQuickPhotoCaption('');
                        setShowPhotoModal(true);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                        isDark ? 'border-[#243149] hover:border-cyan-500/50 bg-[#0D1628]/40' : 'border-[#E2E8F0] hover:border-cyan-500 bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-3 rounded-full ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className={`text-xs font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                          No Issue Evidence Photo Attached
                        </div>
                        <p className={`text-[11px] max-w-sm ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                          Click here to attach a defect photo or inspection micrograph to this change request.
                        </p>
                        <span className="btn-primary btn-sm mt-1">
                          + Attach Issue Photo Now
                        </span>
                      </div>
                    </div>
                  )}
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
              <div className="flex items-center space-x-2">
                <FileKey className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                    Execute Digital Signature (ISO 9001 / 21 CFR Part 11)
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    Cryptographic signoff authorization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Discipline & Signer Details */}
            <div className={`p-3 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Discipline Approval:</span>
                <span className="font-bold text-cyan-400 font-mono uppercase">
                  {signatureTargetType === 'ecr' ? USER_PERSONAS[signingPersonaKey].department : USER_PERSONAS[currentPersona].department}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Signing Persona:</span>
                <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  {currentUser?.name || USER_PERSONAS[currentPersona].name} ({USER_PERSONAS[currentPersona].role})
                </span>
              </div>
              {signatureTargetType === 'ecr' && currentPersona === 'admin' && signingPersonaKey !== 'admin' && (
                <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-lg">
                  <b>Administrator Signoff:</b> Signing on behalf of {USER_PERSONAS[signingPersonaKey].name} with administrative override authority.
                </div>
              )}
            </div>

            {/* Legal ISO 9001 Signoff Attestation */}
            <div className={`text-[11px] leading-relaxed p-3 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>ISO 9001 / 21 CFR Part 11 Electronic Record Attestation</span>
              </div>
              <p className="opacity-90">
                I hereby certify that I have reviewed the engineering scope, risk evaluation, and attached inspection photo. I approve this change step with legally binding electronic signoff.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Review Comments / Authorization Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electronically Signed & Approved"
                  value={signoffComment}
                  onChange={(e) => setSignoffComment(e.target.value)}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    Enterprise Authentication Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setSignaturePassword('admin123')}
                    className="text-[10px] text-cyan-500 hover:underline cursor-pointer"
                  >
                    Auto-Fill Demo
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Enter enterprise password"
                  value={signaturePassword}
                  onChange={(e) => setSignaturePassword(e.target.value)}
                  className="plm-input w-full text-xs font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t pt-4 border-slate-700/30">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSignoff}
                className="btn-primary btn-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Digitally Sign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Photo Upload / Replace Modal */}
      {showPhotoModal && selectedEcr && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-500" />
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                    Attach / Replace Defect Photo
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    {selectedEcr.id} • {selectedEcr.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setQuickPhotoError('');
                }}
                className="text-secondary hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => {
                const el = document.getElementById('quick-photo-input') as HTMLInputElement;
                el?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                isDark ? 'border-[#243149] hover:border-cyan-500 bg-[#0D1628]' : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
              }`}
            >
              <input
                id="quick-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleQuickImageFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center space-y-1.5">
                <div className={`p-2.5 rounded-full ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className={`text-xs font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Click to select image file from computer
                </div>
                <div className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  PNG, JPG, WEBP up to 5MB
                </div>
              </div>
            </div>

            {/* Quick Demo Presets */}
            <div className="space-y-1.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Or Select from Inspection Presets
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setQuickPhotoUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80');
                    setQuickPhotoName('gear_root_microcrack_sem.png');
                    setQuickPhotoCaption('SEM micrograph of gear tooth root fatigue crack');
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    isDark ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500' : 'bg-white border-slate-200 hover:border-cyan-500'
                  }`}
                >
                  <div className="font-bold text-cyan-400">Gear Tooth Crack</div>
                  <div className="text-[10px] text-slate-400 truncate">450 Nm overload fatigue</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickPhotoUrl('https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80');
                    setQuickPhotoName('bearing_race_spalling.png');
                    setQuickPhotoCaption('Spalling and surface pitting on outer bearing race');
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    isDark ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500' : 'bg-white border-slate-200 hover:border-cyan-500'
                  }`}
                >
                  <div className="font-bold text-amber-400">Bearing Spalling</div>
                  <div className="text-[10px] text-slate-400 truncate">Race surface pitting</div>
                </button>
              </div>
            </div>

            {/* Image Preview if selected */}
            {quickPhotoUrl && (
              <div className={`p-3 rounded-xl border flex items-center space-x-3 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-slate-50 border-slate-200'
              }`}>
                <img
                  src={quickPhotoUrl}
                  alt="Preview"
                  className="w-16 h-14 object-cover rounded-lg border border-cyan-500/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-bold text-cyan-400 truncate">
                    {quickPhotoName || 'selected_photo.jpg'}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-semibold">
                    Image ready for attachment
                  </div>
                </div>
              </div>
            )}

            {/* Caption Input */}
            <div>
              <label className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Defect Caption / Technical Finding
              </label>
              <input
                type="text"
                placeholder="e.g. Tooth root micro-crack under 450 Nm cyclic endurance test"
                value={quickPhotoCaption}
                onChange={(e) => setQuickPhotoCaption(e.target.value)}
                className="plm-input w-full text-xs"
              />
            </div>

            {quickPhotoError && (
              <div className="text-rose-500 text-xs flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{quickPhotoError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 border-t pt-4 border-slate-700/30">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false);
                  setQuickPhotoError('');
                }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPhoto}
                className="btn-primary btn-sm flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Attach Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Inspection Modal (ECR WITH PHOTO) */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col p-4 md:p-6 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center space-x-3 truncate pr-4">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500 text-slate-950">
                    {lightboxImage.ecrId}
                  </span>
                  <span className="text-sm font-bold truncate text-white">
                    {lightboxImage.title}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                  {lightboxImage.fileName || 'defect_evidence.jpg'} • ISO 9001 Photographic Defect Record
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 space-x-1">
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-2 text-cyan-400 font-bold min-w-[50px] text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxZoom(1)}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <a
                href={lightboxImage.url}
                download={lightboxImage.fileName || 'ecr_defect_photo.jpg'}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Download Photo"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:text-white hover:bg-rose-500 rounded-lg cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Inspection Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div
              style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.15s ease-out' }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={lightboxImage.url}
                alt="Defect Full View"
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl border border-slate-700 shadow-2xl"
              />
            </div>
          </div>

          {/* Lightbox Footer with Caption */}
          {lightboxImage.caption && (
            <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-300 shrink-0 bg-slate-950/60 p-3 rounded-xl border">
              <span className="font-bold text-cyan-400 font-mono uppercase text-[10px] mr-2">
                DEFECT OBSERVATION:
              </span>
              <span>{lightboxImage.caption}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

