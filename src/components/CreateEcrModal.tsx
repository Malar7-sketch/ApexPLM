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
  Plus
} from 'lucide-react';
import type { ECR, PartItem, UserPersona, EcrSeverity, EcrRootCause } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';

interface CreateEcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  partsMap: Record<string, PartItem>;
  currentPersona: UserPersona;
  currentUser?: UserAccount | null;
  existingEcrs: ECR[];
  onSaveEcr: (ecr: ECR, isDraft: boolean) => void;
}

export function generateNextEcrNumber(existingEcrs: ECR[]): string {
  const year = new Date().getFullYear();
  let maxNum = 42; // Base offset ensuring sequence from 042 -> 043

  const regex = /ECR-\d{4}-(\d+)/i;
  existingEcrs.forEach((e) => {
    const match = regex.exec(e.id);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= maxNum && num < 900) {
        maxNum = num;
      }
    }
  });

  return `ECR-${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

export const CreateEcrModal: React.FC<CreateEcrModalProps> = ({
  isOpen,
  onClose,
  partsMap,
  currentPersona,
  currentUser,
  existingEcrs,
  onSaveEcr
}) => {
  const { isDark } = useTheme();
  const partsList = Object.values(partsMap);
  const defaultPart = partsList[0] || null;


  // Form State
  const [ecrNumber, setEcrNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [changeType, setChangeType] = useState<string>('Design Change');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [targetPartId, setTargetPartId] = useState<string>(defaultPart?.id || '');
  const [currentRev, setCurrentRev] = useState<string>(defaultPart?.currentRev || 'B.0');
  const [proposedRev, setProposedRev] = useState<string>('B.1');
  const [reasonForChange, setReasonForChange] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [proposedSolution, setProposedSolution] = useState<string>('');
  const [affectedComponents, setAffectedComponents] = useState<string>('Housing, Bearing Races, Seal Carrier');
  const [changeCategory, setChangeCategory] = useState<string>('Mechanical DFM & Tolerancing');
  const [riskLevel, setRiskLevel] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const nextNum = generateNextEcrNumber(existingEcrs);
      setEcrNumber(nextNum);
      setTitle('');
      setChangeType('Design Change');
      setPriority('High');
      const initialPart = partsList[0] || null;
      if (initialPart) {
        setTargetPartId(initialPart.id);
        const curR = initialPart.currentRev || 'B.0';
        setCurrentRev(curR);
        setProposedRev(suggestNextRev(curR));
      }
      setReasonForChange('');
      setDescription('');
      setProposedSolution('');
      setAffectedComponents('Housing, Bearing Races, Seal Carrier');
      setChangeCategory('Mechanical DFM & Tolerancing');
      setRiskLevel('Medium');
      setErrors({});
      setTouched({});
    }
  }, [isOpen, existingEcrs]);

  // Helper to suggest next revision string (e.g. "Rev B.0" -> "B.1", "A.4" -> "B.0")
  function suggestNextRev(revStr: string): string {
    const clean = revStr.replace(/Rev\s*/i, '').trim();
    const parts = clean.split('.');
    if (parts.length === 2) {
      const major = parts[0];
      const minor = parseInt(parts[1], 10);
      if (!isNaN(minor)) {
        return `${major}.${minor + 1}`;
      }
    }
    return `${clean}.1`;
  }

  // Handle Product Selection Change
  const handleProductChange = (partId: string) => {
    setTargetPartId(partId);
    const selected = partsMap[partId];
    if (selected) {
      const curR = selected.currentRev || 'B.0';
      setCurrentRev(curR);
      setProposedRev(suggestNextRev(curR));
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters.';
    }

    if (!targetPartId) {
      newErrors.targetPartId = 'Please select a target product.';
    }

    if (!changeType) {
      newErrors.changeType = 'Change Type is required.';
    }

    if (!priority) {
      newErrors.priority = 'Priority is required.';
    }

    if (!reasonForChange.trim()) {
      newErrors.reasonForChange = 'Reason for change is required.';
    }

    if (!description.trim()) {
      newErrors.description = 'Detailed change description is required.';
    }

    if (!proposedRev.trim()) {
      newErrors.proposedRev = 'Proposed revision is required.';
    } else if (proposedRev.trim() === currentRev.trim()) {
      newErrors.proposedRev = 'Proposed revision must be different from current revision.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (isDraft: boolean) => {
    // Mark all as touched
    setTouched({
      title: true,
      targetPartId: true,
      changeType: true,
      priority: true,
      reasonForChange: true,
      description: true,
      proposedRev: true
    });

    if (!validateForm()) {
      return;
    }

    const selectedPart = partsMap[targetPartId];
    const authorName = currentUser?.name || USER_PERSONAS[currentPersona].name;
    const dateStr = new Date().toISOString().split('T')[0];

    // Map priority to severity
    const severityMap: Record<string, EcrSeverity> = {
      Critical: 'Critical',
      High: 'Major',
      Medium: 'Major',
      Low: 'Minor'
    };

    // Map change type to root cause
    const rootCauseMap: Record<string, EcrRootCause> = {
      'Design Change': 'Design Optimization',
      'Cost Reduction': 'Cost Reduction',
      'Quality Non-Conformance': 'Quality Non-Conformance',
      'Process Change': 'DFM Friction',
      'Supplier Change': 'Supply Chain Spec Change'
    };

    const newEcr: ECR = {
      id: ecrNumber,
      title: title.trim(),
      requester: authorName,
      dateCreated: dateStr,
      severity: severityMap[priority] || 'Major',
      rootCause: rootCauseMap[changeType] || 'Design Optimization',
      description: description.trim(),
      proposedSolution: proposedSolution.trim() || reasonForChange.trim(),
      impactedPartIds: targetPartId ? [targetPartId] : [],
      status: isDraft ? 'Draft' : 'In Review',
      estimatedSavingsOrCost: 1500.0,
      changeType,
      priority,
      targetProductId: targetPartId,
      targetProductPartNumber: selectedPart?.partNumber || 'ASM-GBX-5000',
      currentRevision: currentRev,
      proposedRevision: proposedRev,
      affectedComponents,
      changeCategory,
      riskLevel,
      targetCompletionDate,
      workflowStage: 'Draft',
      riskScore: 'Not Yet Assessed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: authorName,
      signoffs: {
        design: { persona: 'design', approved: false, approverName: 'Alex Rivera, PE' },
        mfg: { persona: 'mfg', approved: false, approverName: 'Marcus Vance' },
        quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
        pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
        admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
      }
    };

    onSaveEcr(newEcr, isDraft);
    onClose();
  };

  if (!isOpen) return null;

  const selectedPart = partsMap[targetPartId] || partsList[0];

  return (
    <div className="plm-modal-backdrop">
      <div className="plm-modal-card max-w-4xl max-h-[92vh] overflow-y-auto space-y-6 text-xs p-6 md:p-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl text-cyan-500 border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Create Engineering Change Request (ECR)
                </h2>
                <span className="badge-status badge-review font-mono text-xs">
                  {ecrNumber}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                ISO 9001 traceable engineering proposal & workflow initialization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary cursor-pointer p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-5">
          
          {/* 1. Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            
            {/* ECR Number (Readonly) */}
            <div className="md:col-span-3 space-y-1">
              <label className={`font-semibold flex items-center space-x-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <span>ECR Number</span>
                <span className="text-[10px] text-cyan-500 font-normal">(Auto)</span>
              </label>
              <input
                type="text"
                readOnly
                value={ecrNumber}
                className="plm-input w-full font-mono font-bold opacity-80 cursor-not-allowed text-xs"
              />
            </div>

            {/* Title */}
            <div className="md:col-span-9 space-y-1">
              <label className={`font-semibold flex items-center justify-between ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <span>Title <span className="text-rose-500">*</span></span>
                {touched.title && errors.title && (
                  <span className="text-rose-500 text-[11px] font-normal flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 inline" />
                    <span>{errors.title}</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="e.g. Planetary Gearbox Housing Bearing Seat Tolerance Upgrade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, title: true }))}
                className={`plm-input w-full text-xs ${
                  touched.title && errors.title ? 'border-rose-500 focus:border-rose-500' : ''
                }`}
              />
            </div>

            {/* Change Type */}
            <div className="md:col-span-4 space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Change Type <span className="text-rose-500">*</span></label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
                className="plm-select w-full text-xs"
              >
                <option value="Design Change">Design Change</option>
                <option value="Process Change">Process Change / DFM</option>
                <option value="Material Substitution">Material Substitution</option>
                <option value="Cost Reduction">Cost Reduction</option>
                <option value="Quality Non-Conformance">Quality Non-Conformance</option>
                <option value="Supplier Change">Supplier Change</option>
              </select>
            </div>

            {/* Priority */}
            <div className="md:col-span-4 space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Priority <span className="text-rose-500">*</span></label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="plm-select w-full text-xs"
              >
                <option value="Critical">Critical (Immediate Line Stop)</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* Risk Level */}
            <div className="md:col-span-4 space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Initial Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as any)}
                className="plm-select w-full text-xs"
              >
                <option value="High">High Risk (DFMEA &gt; 100 RPN)</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

          </div>

          {/* 2. Target Product Selection Card */}
          <div className={`rounded-xl p-4 space-y-3.5 border ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/20">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Target Product & Assembly Metadata</span>
              </span>
              <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Select from Master PLM Registry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              
              {/* Product Dropdown */}
              <div className="md:col-span-6 space-y-1">
                <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Target Product / Assembly <span className="text-rose-500">*</span></label>
                <select
                  value={targetPartId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="plm-select w-full text-xs font-semibold"
                >
                  {partsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Revision Upgrade Inputs */}
              <div className="md:col-span-6 space-y-1">
                <label className={`font-semibold flex items-center justify-between ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  <span>Revision Upgrade (Current → Proposed) <span className="text-rose-500">*</span></span>
                  {touched.proposedRev && errors.proposedRev && (
                    <span className="text-rose-500 text-[10px]">{errors.proposedRev}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={currentRev}
                    className="plm-input w-1/2 text-center font-mono font-bold opacity-80 cursor-not-allowed text-xs"
                    title="Current Revision"
                  />
                  <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0" />
                  <input
                    type="text"
                    value={proposedRev}
                    onChange={(e) => setProposedRev(e.target.value)}
                    placeholder="Proposed (e.g. B.1)"
                    className="plm-input w-1/2 text-center font-mono font-bold text-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Product Info Display Banner */}
              {selectedPart && (
                <div className={`md:col-span-12 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PART NUMBER:</span>
                    <span className="font-mono font-bold text-cyan-500">{selectedPart.partNumber}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PRODUCT NAME:</span>
                    <span className={`font-semibold truncate block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{selectedPart.name}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PRODUCT OWNER:</span>
                    <span className={`font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>Alex Rivera, PE</span>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase block font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>DEPARTMENT:</span>
                    <span className={`font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>R&D Mechanical Design</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 3. Reason & Detailed Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
            
            <div className="space-y-1">
              <label className={`font-semibold flex items-center justify-between ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <span>Reason for Change <span className="text-rose-500">*</span></span>
                {touched.reasonForChange && errors.reasonForChange && (
                  <span className="text-rose-500 text-[11px] font-normal">{errors.reasonForChange}</span>
                )}
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Resolve thermal binding and friction buildup during continuous duty 10,000 RPM endurance run."
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, reasonForChange: true }))}
                className="plm-input w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className={`font-semibold flex items-center justify-between ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <span>Detailed Change Description <span className="text-rose-500">*</span></span>
                {touched.description && errors.description && (
                  <span className="text-rose-500 text-[11px] font-normal">{errors.description}</span>
                )}
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Modify housing bearing seat tolerance from ISO H7 to ISO JS6 and increase radial oil clearance."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, description: true }))}
                className="plm-input w-full text-xs"
              />
            </div>

          </div>

          {/* 4. Additional Engineering Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            
            <div className="space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Affected Components</label>
              <input
                type="text"
                placeholder="Housing, Bearing Race, Seal Carrier"
                value={affectedComponents}
                onChange={(e) => setAffectedComponents(e.target.value)}
                className="plm-input w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Change Category</label>
              <input
                type="text"
                placeholder="Mechanical DFM & Tolerancing"
                value={changeCategory}
                onChange={(e) => setChangeCategory(e.target.value)}
                className="plm-input w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Target Completion Date</label>
              <input
                type="date"
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="plm-input w-full text-xs"
              />
            </div>

          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between border-t pt-4 border-slate-700/30">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="btn-secondary btn-sm flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5 text-secondary" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="btn-primary btn-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create ECR</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

