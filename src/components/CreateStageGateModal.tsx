import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  Calendar, 
  User, 
  Layers, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Briefcase,
  Box
} from 'lucide-react';
import type { StageGate, GateChecklistItem, LifecycleStage, UserPersona, Project, PartItem } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface CreateStageGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGates: StageGate[];
  projects?: Project[];
  parts?: PartItem[];
  currentUser?: any;
  onCreateGate: (gate: StageGate) => void;
}

const DEFAULT_PHASE_TASKS: Record<LifecycleStage, Array<{ task: string; requiredRole: UserPersona; documentRef?: string }>> = {
  concept: [
    { task: 'System Architecture & Requirements Specification Freeze', requiredRole: 'pm', documentRef: 'SPEC-ENG-001' },
    { task: '3D Space Envelope & Packaging Clearance Sign-off', requiredRole: 'design', documentRef: 'CAD-ENV-001' },
    { task: 'Preliminary Bill of Materials (EBOM) & Cost Target Model', requiredRole: 'design' },
    { task: 'Patent Landscape, Prior Art & Freedom-to-Operate Clearance', requiredRole: 'admin' }
  ],
  design: [
    { task: 'Complete 3D CAD Parametric Assembly Release & Interference Check', requiredRole: 'design', documentRef: 'CAD-ASM-001' },
    { task: 'Finite Element Analysis (FEA) Stress & Thermal Simulation Sign-off', requiredRole: 'design', documentRef: 'FEA-REP-001' },
    { task: 'Design Failure Mode and Effects Analysis (DFMEA) High-RPN Mitigation', requiredRole: 'design', documentRef: 'DFMEA-001' },
    { task: '2D Manufacturing Drawings with GD&T and Tolerance Stack-up', requiredRole: 'design', documentRef: 'DWG-2026-001' }
  ],
  prototype: [
    { task: 'Engineering Prototype Build & First Article Inspection (FAI)', requiredRole: 'mfg', documentRef: 'PROTO-FAI-001' },
    { task: 'Physical Reliability, Shock & Thermal Chamber Test Report', requiredRole: 'quality', documentRef: 'TEST-REP-001' },
    { task: 'CAPP Process Routing & Initial MBOM Sign-off', requiredRole: 'mfg', documentRef: 'CAPP-ROUT-001' },
    { task: 'Production Tooling & Fixture Capital Authorization Sign-off', requiredRole: 'pm' }
  ],
  tooling: [
    { task: 'Tooling & Mold Design Validation & Moldflow Analysis', requiredRole: 'mfg', documentRef: 'MOLD-001' },
    { task: 'CNC Fixture & Inspection Gauge Verification Sign-off', requiredRole: 'mfg' },
    { task: 'Tooling Fabrication Buy-off & CMM Sample Measurement', requiredRole: 'quality', documentRef: 'CMM-TOOL-001' }
  ],
  production: [
    { task: 'Process Failure Mode & Effects Analysis (PFMEA) Sign-off', requiredRole: 'quality', documentRef: 'PFMEA-001' },
    { task: 'Process Capability Study (Cpk ≥ 1.67) on Critical Dimensions', requiredRole: 'quality', documentRef: 'CPK-REP-001' },
    { task: 'Quality Control Plan & Gauge Repeatability / Reproducibility (GR&R)', requiredRole: 'quality', documentRef: 'GRR-001' },
    { task: 'Level 3 Production Part Approval Process (PPAP) Customer Sign-off', requiredRole: 'quality', documentRef: 'PPAP-PKG-001' }
  ],
  obsolete: [
    { task: 'Service Part Inventory & Aftermarket Spares Strategy Sign-off', requiredRole: 'mfg' },
    { task: 'End-of-Life (EOL) Environmental Disposal & RoHS Decommissioning', requiredRole: 'quality' },
    { task: 'Engineering Document Vault Archive & Drawing Status Mark Obsolete', requiredRole: 'admin', documentRef: 'ARCHIVE-001' }
  ]
};

export const CreateStageGateModal: React.FC<CreateStageGateModalProps> = ({
  isOpen,
  onClose,
  existingGates,
  projects = [],
  parts = [],
  currentUser,
  onCreateGate
}) => {
  const { isDark } = useTheme();

  // Next gate ID
  const nextGateId = existingGates.length > 0 
    ? Math.max(...existingGates.map(g => g.gateId)) + 1 
    : 1;

  const [gateNumber, setGateNumber] = useState<number>(nextGateId);
  const [gateName, setGateName] = useState<string>(`Gate 0${nextGateId}: Design Review & Freeze`);
  const [stage, setStage] = useState<LifecycleStage>('design');
  const [description, setDescription] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [responsibleEngineer, setResponsibleEngineer] = useState<string>(currentUser?.name || 'Alex Rivera, PE');
  const [status, setStatus] = useState<'Upcoming' | 'In Progress' | 'Passed' | 'Blocked'>('In Progress');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');

  // Checklist items
  const [checklist, setChecklist] = useState<GateChecklistItem[]>([
    {
      id: `G${nextGateId}-01`,
      task: 'System Design Freeze Document Sign-off',
      requiredRole: 'design',
      completed: false
    },
    {
      id: `G${nextGateId}-02`,
      task: 'Engineering Simulation & Verification Report',
      requiredRole: 'quality',
      completed: false
    }
  ]);

  // New task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskRole, setNewTaskRole] = useState<UserPersona>('design');
  const [newTaskDocRef, setNewTaskDocRef] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const calcNext = existingGates.length > 0 
        ? Math.max(...existingGates.map(g => g.gateId)) + 1 
        : 1;
      setGateNumber(calcNext);
      setGateName(`Gate 0${calcNext}: Detailed Design Review`);
      setStage('design');
      setDescription('Formal design review verifying engineering calculations, 3D CAD models, and risk mitigations.');
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setTargetDate(d.toISOString().split('T')[0]);
      setResponsibleEngineer(currentUser?.name || 'Alex Rivera, PE');
      setStatus('In Progress');
      setSelectedProjectId(projects[0]?.id || '');
      setSelectedPartId('');

      // Pre-fill with recommended tasks
      const defaultTasks = DEFAULT_PHASE_TASKS.design.map((t, idx) => ({
        id: `G${calcNext}-0${idx + 1}`,
        task: t.task,
        requiredRole: t.requiredRole,
        documentRef: t.documentRef,
        completed: false
      }));
      setChecklist(defaultTasks);
    }
  }, [isOpen, existingGates.length]);

  if (!isOpen) return null;

  const handleApplyPresetTasks = (selectedStage: LifecycleStage) => {
    const presets = DEFAULT_PHASE_TASKS[selectedStage] || DEFAULT_PHASE_TASKS.design;
    const mapped = presets.map((t, idx) => ({
      id: `G${gateNumber}-0${idx + 1}`,
      task: t.task,
      requiredRole: t.requiredRole,
      documentRef: t.documentRef,
      completed: false
    }));
    setChecklist(mapped);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newId = `G${gateNumber}-${String(checklist.length + 1).padStart(2, '0')}`;
    setChecklist(prev => [
      ...prev,
      {
        id: newId,
        task: newTaskTitle.trim(),
        requiredRole: newTaskRole,
        documentRef: newTaskDocRef.trim() || undefined,
        completed: false
      }
    ]);
    setNewTaskTitle('');
    setNewTaskDocRef('');
  };

  const handleRemoveTask = (taskId: string) => {
    setChecklist(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName.trim()) return;

    const prj = projects.find(p => p.id === selectedProjectId);
    const prt = parts.find(p => p.id === selectedPartId);

    const newGate: StageGate = {
      gateId: Number(gateNumber) || nextGateId,
      gateName: gateName.trim(),
      stage,
      description: description.trim() || 'Stage-Gate milestone governance review and sign-off.',
      status,
      targetCompletionDate: targetDate || new Date().toISOString().split('T')[0],
      completionPercent: 0,
      responsibleEngineer: responsibleEngineer.trim() || 'Lead Engineer',
      checklist: checklist.length > 0 ? checklist : [
        { id: `G${gateNumber}-01`, task: 'Stage Gate Deliverable Sign-off', requiredRole: 'admin', completed: false }
      ],
      projectId: prj?.id,
      projectName: prj?.name,
      partId: prt?.id,
      partNumber: prt?.partNumber
    };

    onCreateGate(newGate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          isDark ? 'bg-[#0D1628] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-[#243149] bg-[#111B2E]' : 'border-[#E2E8F0] bg-[#F8FAFC]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Create Stage-Gate Design Review</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Configure a formal engineering phase gate milestone and peer deliverable sign-offs.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-[#243149] hover:bg-[#1A263D] text-[#94A3B8]' : 'border-[#E2E8F0] hover:bg-slate-100 text-[#64748B]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs flex-1">
          {/* Row 1: Gate Number & Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="font-semibold block">Gate Number</label>
              <input
                type="number"
                min="1"
                max="99"
                value={gateNumber}
                onChange={(e) => setGateNumber(parseInt(e.target.value) || 1)}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                  isDark ? 'bg-[#111B2E] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#CBD5E1] text-cyan-600'
                }`}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <label className="font-semibold block">Gate Review Title</label>
              <input
                type="text"
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                placeholder="e.g. Gate 02: Detailed Engineering & FEA Freeze"
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 font-medium ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
                required
              />
            </div>
          </div>

          {/* Row 2: Phase, Status, Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold block flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Lifecycle Phase</span>
              </label>
              <select
                value={stage}
                onChange={(e) => {
                  const s = e.target.value as LifecycleStage;
                  setStage(s);
                  handleApplyPresetTasks(s);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
              >
                <option value="concept">Concept Architecture</option>
                <option value="design">Detailed Design</option>
                <option value="prototype">Prototype Validation</option>
                <option value="tooling">Tooling & Fixtures</option>
                <option value="production">Production & Launch</option>
                <option value="obsolete">End of Life / Obsolete</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block">Review Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
              >
                <option value="In Progress">In Progress (Active)</option>
                <option value="Upcoming">Upcoming (Scheduled)</option>
                <option value="Blocked">Blocked</option>
                <option value="Passed">Passed (Completed)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Target Completion</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 font-mono ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
                required
              />
            </div>
          </div>

          {/* Row 3: Responsible Engineer & Associations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold block flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-500" />
                <span>Responsible Lead</span>
              </label>
              <input
                type="text"
                value={responsibleEngineer}
                onChange={(e) => setResponsibleEngineer(e.target.value)}
                placeholder="e.g. Alex Rivera, PE"
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                <span>Project (Optional)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
              >
                <option value="">General Platform Milestone</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block flex items-center space-x-1.5">
                <Box className="w-3.5 h-3.5 text-purple-500" />
                <span>Assembly / Part (Optional)</span>
              </label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
              >
                <option value="">No specific part linked</option>
                {parts.map((prt) => (
                  <option key={prt.id} value={prt.id}>
                    {prt.partNumber} - {prt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold block">Description & Review Objectives</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Define criteria, design freeze milestones, and deliverables required to pass this stage gate..."
              className={`w-full p-3 rounded-xl border focus:outline-none focus:border-cyan-500 resize-none ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
              }`}
            />
          </div>

          {/* Deliverables Checklist Section */}
          <div className={`p-4 rounded-xl border space-y-3.5 ${
            isDark ? 'bg-[#111B2E]/60 border-[#243149]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-cyan-500 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Deliverables & Peer Sign-Off Checklist ({checklist.length})</span>
                </h3>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Mandatory peer reviews and artifacts required to exit this gate.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleApplyPresetTasks(stage)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center space-x-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-[#0D1628] border-[#243149] hover:bg-[#1A263D] text-cyan-400' : 'bg-white border-[#E2E8F0] hover:bg-slate-100 text-cyan-700'
                }`}
                title="Populate recommended tasks for selected stage"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Reset to {stage.toUpperCase()} Presets</span>
              </button>
            </div>

            {/* Existing Checklist Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {checklist.map((item, idx) => {
                const persona = USER_PERSONAS[item.requiredRole];
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-cyan-500 font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-medium truncate text-xs">{item.task}</span>
                      {item.documentRef && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 border ${
                          isDark ? 'bg-[#111B2E] border-[#243149] text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
                        }`}>
                          {item.documentRef}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="badge-status badge-active text-[10px]">
                        {persona?.name || item.requiredRole}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(item.id)}
                        className="text-rose-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Remove deliverable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Deliverable Row */}
            <div className={`p-3 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-white border-[#CBD5E1]'
            }`}>
              <span className="font-semibold text-[11px] block text-cyan-500">
                + Add Custom Deliverable
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Deliverable description (e.g. CMM Inspection Sign-off)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`sm:col-span-6 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                />

                <select
                  value={newTaskRole}
                  onChange={(e) => setNewTaskRole(e.target.value as UserPersona)}
                  className={`sm:col-span-3 px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                >
                  <option value="design">Design Eng (Alex)</option>
                  <option value="pm">Project Mgr (David)</option>
                  <option value="mfg">Mfg Eng (Marcus)</option>
                  <option value="quality">Quality Eng (Elena)</option>
                  <option value="admin">Admin / Exec</option>
                </select>

                <input
                  type="text"
                  placeholder="Doc Ref (e.g. DOC-101)"
                  value={newTaskDocRef}
                  onChange={(e) => setNewTaskDocRef(e.target.value)}
                  className={`sm:col-span-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                />

                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="sm:col-span-1 btn-primary btn-sm flex items-center justify-center p-1.5 disabled:opacity-50 cursor-pointer"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className={`pt-4 border-t flex items-center justify-end space-x-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'border-[#243149] hover:bg-[#1A263D] text-[#94A3B8]' : 'border-[#E2E8F0] hover:bg-slate-100 text-[#64748B]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2 text-xs py-2 px-5 cursor-pointer font-bold"
            >
              <Award className="w-4 h-4" />
              <span>Create Stage Gate Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
