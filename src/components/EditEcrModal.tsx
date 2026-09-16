import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitPullRequest, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  ShieldAlert, 
  Tag, 
  Layers, 
  FileText, 
  Save, 
  Plus,
  Paperclip,
  Trash2,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  FileImage,
  AlertTriangle
} from 'lucide-react';
import type { ECR, PartItem, UserPersona, EcrSeverity, EcrRootCause, EcrAttachment } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';

interface EditEcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecr: ECR | null;
  partsMap: Record<string, PartItem>;
  currentPersona: UserPersona;
  currentUser?: UserAccount | null;
  onSaveEcr: (updatedEcr: ECR) => void;
}

export const EditEcrModal: React.FC<EditEcrModalProps> = ({
  isOpen,
  onClose,
  ecr,
  partsMap,
  currentPersona,
  currentUser,
  onSaveEcr
}) => {
  const { isDark } = useTheme();
  const partsList = Object.values(partsMap);


  // Form States
  const [ecrNumber, setEcrNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [targetPartId, setTargetPartId] = useState<string>('');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [riskScore, setRiskScore] = useState<string>('25');
  const [currentRev, setCurrentRev] = useState<string>('Rev B.0');
  const [proposedRev, setProposedRev] = useState<string>('Rev B.1');
  const [reasonForChange, setReasonForChange] = useState<string>('');
  const [changeDescription, setChangeDescription] = useState<string>('');
  const [changeType, setChangeType] = useState<string>('Design Change');
  const [affectedComponents, setAffectedComponents] = useState<string>('');
  const [attachments, setAttachments] = useState<EcrAttachment[]>([]);
  
  // New attachment input state
  const [newAttName, setNewAttName] = useState<string>('');
  const [newAttType, setNewAttType] = useState<string>('PDF Report');
  const [showAddAttachment, setShowAddAttachment] = useState<boolean>(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync state when ecr changes or modal opens
  useEffect(() => {
    if (isOpen && ecr) {
      setEcrNumber(ecr.id || '');
      setTitle(ecr.title || '');
      setDescription(ecr.description || '');
      
      const foundPartId = ecr.targetProductId || ecr.impactedPartIds?.[0] || partsList[0]?.id || '';
      setTargetPartId(foundPartId);
      
      setPriority(ecr.priority || (ecr.severity === 'Critical' ? 'Critical' : ecr.severity === 'Minor' ? 'Low' : 'High'));
      setRiskScore(String(ecr.riskScore ?? '35'));
      setCurrentRev(ecr.currentRevision || partsMap[foundPartId]?.currentRev || 'Rev B.0');
      setProposedRev(ecr.proposedRevision || 'Rev B.1');
      setReasonForChange(ecr.reasonForChange || ecr.description || '');
      setChangeDescription(ecr.proposedSolution || '');
      setChangeType(ecr.changeType || 'Design Change');
      setAffectedComponents(ecr.affectedComponents || 'Housing, Bearing Races');
      setAttachments(ecr.attachments ? [...ecr.attachments] : [
        { id: `att-${Date.now()}-1`, name: `${ecr.id}_Technical_Justification.pdf`, size: '1.4 MB', type: 'PDF Document', uploadedAt: ecr.dateCreated || '2026-08-01' }
      ]);
      setErrors({});
      setTouched({});
      setShowAddAttachment(false);
      setNewAttName('');
    }
  }, [isOpen, ecr]);

  if (!isOpen || !ecr) return null;

  // Handle Product Selection Change
  const handleProductChange = (partId: string) => {
    setTargetPartId(partId);
    const selected = partsMap[partId];
    if (selected) {
      const curR = selected.currentRev ? (selected.currentRev.startsWith('Rev') ? selected.currentRev : `Rev ${selected.currentRev}`) : 'Rev B.0';
      setCurrentRev(curR);
    }
  };

  // Add mock attachment
  const handleAddAttachment = () => {
    if (!newAttName.trim()) return;
    const newAtt: EcrAttachment = {
      id: `att-${Date.now()}`,
      name: newAttName.trim().endsWith('.pdf') || newAttName.trim().endsWith('.step') || newAttName.trim().endsWith('.dwg') 
        ? newAttName.trim() 
        : `${newAttName.trim()}.${newAttType === 'CAD Drawing' ? 'dwg' : newAttType === '3D CAD Model' ? 'step' : 'pdf'}`,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      type: newAttType,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setAttachments((prev) => [...prev, newAtt]);
    setNewAttName('');
    setShowAddAttachment(false);
  };

  // Remove attachment
  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!ecrNumber.trim()) {
      newErrors.ecrNumber = 'ECR Number is required.';
    }
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }
    if (!targetPartId) {
      newErrors.targetPartId = 'Target product is required.';
    }
    if (!reasonForChange.trim()) {
      newErrors.reasonForChange = 'Reason for change is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Technical description is required.';
    }
    if (!proposedRev.trim()) {
      newErrors.proposedRev = 'Target proposed revision is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setTouched({
      ecrNumber: true,
      title: true,
      targetPartId: true,
      reasonForChange: true,
      description: true,
      proposedRev: true
    });

    if (!validateForm()) return;

    const selectedPart = partsMap[targetPartId];
    const severityMap: Record<string, EcrSeverity> = {
      Critical: 'Critical',
      High: 'Major',
      Medium: 'Major',
      Low: 'Minor'
    };

    const updatedEcr: ECR = {
      ...ecr,
      id: ecrNumber.trim(),
      title: title.trim(),
      description: description.trim(),
      proposedSolution: changeDescription.trim() || description.trim(),
      reasonForChange: reasonForChange.trim(),
      priority,
      severity: severityMap[priority] || 'Major',
      riskScore: isNaN(Number(riskScore)) ? riskScore : Number(riskScore),
      targetProductId: targetPartId,
      targetProductPartNumber: selectedPart ? `${selectedPart.partNumber} (${selectedPart.name})` : ecr.targetProductPartNumber,
      impactedPartIds: targetPartId ? [targetPartId] : ecr.impactedPartIds,
      currentRevision: currentRev.trim(),
      proposedRevision: proposedRev.trim(),
      changeType,
      affectedComponents: affectedComponents.trim(),
      attachments,
      updatedAt: new Date().toISOString()
    };

    onSaveEcr(updatedEcr);
    onClose();
  };

  return (
    <div className="plm-modal-backdrop">
      <div className="plm-modal-card max-w-4xl max-h-[92vh] overflow-y-auto space-y-5 text-xs p-6 md:p-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl text-cyan-500 border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="badge-status badge-review text-xs font-bold font-mono">
                  {ecr.id}
                </span>
                <span className={`text-[11px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Stage: <b className={isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}>{ecr.workflowStage || ecr.status}</b>
                </span>
              </div>
              <h3 className={`text-base font-bold mt-0.5 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Edit Engineering Change Request
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary cursor-pointer p-1.5 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          
          {/* Top Row: ECR Number & Target Product & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* ECR Number */}
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                ECR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={ecrNumber}
                onChange={(e) => setEcrNumber(e.target.value)}
                className={`plm-input w-full font-mono text-xs ${
                  errors.ecrNumber && touched.ecrNumber ? 'border-rose-500' : ''
                }`}
                placeholder="e.g. ECR-2026-106"
              />
              {errors.ecrNumber && touched.ecrNumber && (
                <span className="text-[10px] text-rose-500 mt-1 block">{errors.ecrNumber}</span>
              )}
            </div>

            {/* Target Product */}
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Target Product / Part <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetPartId}
                onChange={(e) => handleProductChange(e.target.value)}
                className={`plm-select w-full text-xs ${
                  errors.targetPartId && touched.targetPartId ? 'border-rose-500' : ''
                }`}
              >
                {partsList.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.partNumber} — {part.name} ({part.currentRev || 'Rev A.0'})
                  </option>
                ))}
              </select>
              {errors.targetPartId && touched.targetPartId && (
                <span className="text-[10px] text-rose-500 mt-1 block">{errors.targetPartId}</span>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Engineering Priority <span className="text-rose-500">*</span>
              </label>
              <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? p === 'Critical'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : p === 'High'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : p === 'Medium'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'bg-slate-600 text-white'
                          : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ECR Title */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              ECR Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`plm-input w-full text-xs font-semibold ${
                errors.title && touched.title ? 'border-rose-500' : ''
              }`}
              placeholder="e.g. Bearing Retention Ring Chamfer & Groove Tolerance Adjustment"
            />
            {errors.title && touched.title && (
              <span className="text-[10px] text-rose-500 mt-1 block">{errors.title}</span>
            )}
          </div>

          {/* Revision Parameters & Risk Score */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3.5 rounded-xl border ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            
            {/* Current Revision */}
            <div>
              <label className={`block text-[10px] uppercase font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Current Revision
              </label>
              <input
                type="text"
                value={currentRev}
                onChange={(e) => setCurrentRev(e.target.value)}
                className="plm-input w-full font-mono text-xs"
                placeholder="Rev B.0"
              />
            </div>

            {/* Proposed Target Revision */}
            <div>
              <label className={`block text-[10px] uppercase font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Target Revision <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={proposedRev}
                onChange={(e) => setProposedRev(e.target.value)}
                className={`plm-input w-full text-emerald-500 font-bold font-mono text-xs ${
                  errors.proposedRev && touched.proposedRev ? 'border-rose-500' : ''
                }`}
                placeholder="Rev B.1"
              />
              {errors.proposedRev && touched.proposedRev && (
                <span className="text-[10px] text-rose-500 mt-1 block">{errors.proposedRev}</span>
              )}
            </div>

            {/* Risk Score */}
            <div>
              <label className={`block text-[10px] uppercase font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <span>PLM Risk Score / 100</span>
                <span className="text-cyan-500 font-bold">{riskScore}</span>
              </label>
              <input
                type="text"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                className="plm-input w-full font-mono text-xs"
                placeholder="e.g. 35 or Low"
              />
            </div>

          </div>

          {/* Reason for Change */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Reason for Change <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reasonForChange}
              onChange={(e) => setReasonForChange(e.target.value)}
              className={`plm-input w-full text-xs ${
                errors.reasonForChange && touched.reasonForChange ? 'border-rose-500' : ''
              }`}
              placeholder="Explain why this engineering change is required..."
            />
            {errors.reasonForChange && touched.reasonForChange && (
              <span className="text-[10px] text-rose-500 mt-1 block">{errors.reasonForChange}</span>
            )}
          </div>

          {/* Change Description & Technical Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Technical Scope & Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`plm-input w-full text-xs ${
                  errors.description && touched.description ? 'border-rose-500' : ''
                }`}
                placeholder="Detailed description of engineering symptoms or findings..."
              />
              {errors.description && touched.description && (
                <span className="text-[10px] text-rose-500 mt-1 block">{errors.description}</span>
              )}
            </div>

            <div>
              <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Proposed Solution & Change Details
              </label>
              <textarea
                rows={3}
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                className="plm-input w-full text-xs"
                placeholder="Specific modifications: 2D drawing revisions, GD&T changes..."
              />
            </div>
          </div>

          {/* Affected Components */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Affected Components & Sub-assemblies
            </label>
            <input
              type="text"
              value={affectedComponents}
              onChange={(e) => setAffectedComponents(e.target.value)}
              className="plm-input w-full text-xs font-mono"
              placeholder="e.g. Housing Casing, Mounting Flange, Fasteners"
            />
          </div>

          {/* Attachments Section */}
          <div className="border-t pt-3.5 space-y-3 border-slate-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-cyan-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Attachments & Engineering Artefacts ({attachments.length})
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setShowAddAttachment(!showAddAttachment)}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Attachment</span>
              </button>
            </div>

            {/* Add Attachment Form */}
            {showAddAttachment && (
              <div className={`p-3 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
                isDark ? 'bg-[#0D1628] border-cyan-500/30' : 'bg-[#F8FAFC] border-cyan-300'
              }`}>
                <div className="text-[11px] text-cyan-500 font-bold flex items-center space-x-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Attach Engineering File or Specification</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="File name (e.g. FEA_Torque_Report.pdf)"
                    value={newAttName}
                    onChange={(e) => setNewAttName(e.target.value)}
                    className="md:col-span-7 plm-input text-xs"
                  />
                  <select
                    value={newAttType}
                    onChange={(e) => setNewAttType(e.target.value)}
                    className="md:col-span-3 plm-select text-xs"
                  >
                    <option value="PDF Report">PDF Report</option>
                    <option value="CAD Drawing">CAD 2D Drawing</option>
                    <option value="3D CAD Model">3D CAD Model (STEP)</option>
                    <option value="Material Spec">Material Spec</option>
                    <option value="Test Results">Test Results</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="md:col-span-2 btn-primary btn-sm"
                  >
                    Attach
                  </button>
                </div>
              </div>
            )}

            {/* List of Attachments */}
            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isDark ? 'bg-[#0D1628] border-[#243149] hover:border-slate-600' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      <div className={`p-1.5 rounded-lg text-cyan-500 shrink-0 ${
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
                        <div className={`font-semibold truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                          {att.name}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                          {att.type} • {att.size} • {att.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-secondary hover:text-rose-500 rounded-lg cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-3 border border-dashed rounded-xl ${
                isDark ? 'border-[#243149] text-[#64748B]' : 'border-[#E2E8F0] text-[#94A3B8]'
              }`}>
                No attachments uploaded. Click "+ Add Attachment" above to attach redlines or CAD drawings.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t pt-4 border-slate-700/30">
          <div className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
            Changes will update active notice cards, detail view & audit log immediately.
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary btn-sm flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
