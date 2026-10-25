import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  UserCheck, 
  Layers, 
  Award,
  Zap,
  Plus,
  Trash2,
  Calendar,
  User,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Filter,
  RotateCcw,
  Briefcase,
  Box,
  ChevronDown
} from 'lucide-react';
import type { StageGate, GateChecklistItem, LifecycleStage, UserPersona, Project, PartItem } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';
import { CreateStageGateModal } from './CreateStageGateModal';

export interface StageGateTrackerProps {
  gates?: StageGate[];
  setGates?: React.Dispatch<React.SetStateAction<StageGate[]>>;
  currentPersona?: UserPersona;
  currentUser?: any;
  projects?: Project[];
  parts?: PartItem[];
  onToggleChecklistItem?: (gateId: number, taskId: string) => void;
  onAddGate?: (gate: StageGate) => void;
  onDeleteGate?: (gateId: number) => void;
  onUpdateGateStatus?: (gateId: number, status: 'Passed' | 'In Progress' | 'Blocked' | 'Upcoming') => void;
  onAddDeliverable?: (gateId: number, task: string, requiredRole: UserPersona, docRef?: string) => void;
  onInitializeStandardPipeline?: (projectId?: string) => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

// Industry-standard Aerospace / Automotive 5-Phase Stage-Gate Pipeline generator
export const createDefaultStandardGates = (project?: Project, engineerName: string = 'Alex Rivera, PE'): StageGate[] => {
  const prjPrefix = project ? `[${project.name}] ` : '';
  const prjId = project ? project.id : undefined;
  const prjName = project ? project.name : undefined;

  const today = new Date();
  const formatOffsetDate = (days: number) => {
    const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      gateId: 1,
      gateName: `${prjPrefix}Gate 01: Concept & Product Architecture Freeze`,
      stage: 'concept',
      description: 'System-level specification review, envelope calculations, patent clearance, and preliminary EBOM freeze.',
      status: 'In Progress',
      targetCompletionDate: formatOffsetDate(30),
      completionPercent: 0,
      responsibleEngineer: engineerName,
      projectId: prjId,
      projectName: prjName,
      checklist: [
        { id: 'G1-01', task: 'System Architecture & Requirements Specification Freeze', requiredRole: 'pm', completed: false, documentRef: 'SPEC-ENG-001' },
        { id: 'G1-02', task: '3D Space Envelope & Packaging Clearance Sign-off', requiredRole: 'design', completed: false, documentRef: 'CAD-ENV-001' },
        { id: 'G1-03', task: 'Preliminary Bill of Materials (EBOM) & Cost Target Model', requiredRole: 'design', completed: false },
        { id: 'G1-04', task: 'Patent Landscape, Prior Art & Freedom-to-Operate Clearance', requiredRole: 'admin', completed: false }
      ]
    },
    {
      gateId: 2,
      gateName: `${prjPrefix}Gate 02: Detailed Engineering Review & FEA Freeze`,
      stage: 'design',
      description: 'Detailed 3D parametric CAD models, structural & thermal FEA, DFMEA review, and drawing release.',
      status: 'Upcoming',
      targetCompletionDate: formatOffsetDate(60),
      completionPercent: 0,
      responsibleEngineer: engineerName,
      projectId: prjId,
      projectName: prjName,
      checklist: [
        { id: 'G2-01', task: 'Complete 3D CAD Parametric Assembly Release & Interference Check', requiredRole: 'design', completed: false, documentRef: 'CAD-ASM-001' },
        { id: 'G2-02', task: 'Finite Element Analysis (FEA) Stress & Thermal Simulation Sign-off', requiredRole: 'design', completed: false, documentRef: 'FEA-REP-001' },
        { id: 'G2-03', task: 'Design Failure Mode and Effects Analysis (DFMEA) High-RPN Mitigation', requiredRole: 'design', completed: false, documentRef: 'DFMEA-001' },
        { id: 'G2-04', task: '2D Manufacturing Drawings with GD&T and Tolerance Stack-up', requiredRole: 'design', completed: false, documentRef: 'DWG-2026-001' }
      ]
    },
    {
      gateId: 3,
      gateName: `${prjPrefix}Gate 03: Prototype Validation & Tooling Release`,
      stage: 'prototype',
      description: 'Physical prototype fabrication, functional bench testing, tooling approval, and initial MBOM routing.',
      status: 'Upcoming',
      targetCompletionDate: formatOffsetDate(90),
      completionPercent: 0,
      responsibleEngineer: 'Marcus Vance',
      projectId: prjId,
      projectName: prjName,
      checklist: [
        { id: 'G3-01', task: 'Engineering Prototype Build & First Article Inspection (FAI)', requiredRole: 'mfg', completed: false, documentRef: 'PROTO-FAI-001' },
        { id: 'G3-02', task: 'Physical Reliability, Shock & Thermal Chamber Test Report', requiredRole: 'quality', completed: false, documentRef: 'TEST-REP-001' },
        { id: 'G3-03', task: 'CAPP Process Routing & Initial MBOM Sign-off', requiredRole: 'mfg', completed: false, documentRef: 'CAPP-ROUT-001' },
        { id: 'G3-04', task: 'Production Tooling & Fixture Capital Authorization Sign-off', requiredRole: 'pm', completed: false }
      ]
    },
    {
      gateId: 4,
      gateName: `${prjPrefix}Gate 04: Pre-Production & Quality Sign-Off (PPAP)`,
      stage: 'production',
      description: 'Pilot production run, statistical process capability (Cpk), PFMEA validation, and Level 3 PPAP approval.',
      status: 'Upcoming',
      targetCompletionDate: formatOffsetDate(120),
      completionPercent: 0,
      responsibleEngineer: 'Dr. Elena Rostova',
      projectId: prjId,
      projectName: prjName,
      checklist: [
        { id: 'G4-01', task: 'Process Failure Mode & Effects Analysis (PFMEA) Sign-off', requiredRole: 'quality', completed: false, documentRef: 'PFMEA-001' },
        { id: 'G4-02', task: 'Process Capability Study (Cpk ≥ 1.67) on Critical Dimensions', requiredRole: 'quality', completed: false, documentRef: 'CPK-REP-001' },
        { id: 'G4-03', task: 'Quality Control Plan & Gauge Repeatability / Reproducibility (GR&R)', requiredRole: 'quality', completed: false, documentRef: 'GRR-001' },
        { id: 'G4-04', task: 'Level 3 Production Part Approval Process (PPAP) Customer Sign-off', requiredRole: 'quality', completed: false, documentRef: 'PPAP-PKG-001' }
      ]
    },
    {
      gateId: 5,
      gateName: `${prjPrefix}Gate 05: Full Production Launch & SOP Freeze`,
      stage: 'production',
      description: 'Start of Production (SOP) clearance, supplier volume ramp readiness, and commercial product launch.',
      status: 'Upcoming',
      targetCompletionDate: formatOffsetDate(150),
      completionPercent: 0,
      responsibleEngineer: 'David Sterling',
      projectId: prjId,
      projectName: prjName,
      checklist: [
        { id: 'G5-01', task: 'Supplier Production Readiness & Raw Material Safety Stock Audit', requiredRole: 'quality', completed: false },
        { id: 'G5-02', task: 'Manufacturing Line Takt Time & Overall Equipment Effectiveness (OEE) Ramp', requiredRole: 'mfg', completed: false },
        { id: 'G5-03', task: 'RoHS, REACH & CE/UL Regulatory Compliance Declarations Filed', requiredRole: 'admin', completed: false, documentRef: 'CERT-ENV-001' },
        { id: 'G5-04', task: 'Executive Change Control Board Final Commercial Release Authorization', requiredRole: 'admin', completed: false }
      ]
    }
  ];
};

export const StageGateTrackerInternal: React.FC<StageGateTrackerProps> = ({
  gates = [],
  setGates,
  currentPersona = 'admin',
  currentUser,
  projects = [],
  parts = [],
  onToggleChecklistItem,
  onAddGate,
  onDeleteGate,
  onUpdateGateStatus,
  onAddDeliverable,
  onInitializeStandardPipeline,
  logAction
}) => {
  const { isDark } = useTheme();

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Project filter
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  // Inline add deliverable state
  const [addingTaskIdForGate, setAddingTaskIdForGate] = useState<number | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskRole, setInlineTaskRole] = useState<UserPersona>('design');
  const [inlineTaskDoc, setInlineTaskDoc] = useState('');

  // Selected project to initialize for
  const [initProjectId, setInitProjectId] = useState<string>('');

  const activeGate = gates.find(g => g.status === 'In Progress') || gates.find(g => g.status === 'Upcoming');
  const activePhaseText = gates.length === 0
    ? 'No Active Stage Gates'
    : activeGate
    ? `Active Phase: Gate 0${activeGate.gateId} ${activeGate.gateName}`
    : 'All Gates Completed';

  // Filtered gates
  const filteredGates = gates.filter(g => {
    if (filterProjectId === 'all') return true;
    return g.projectId === filterProjectId;
  });

  // Handle Checklist Click
  const handleChecklistClick = (gateId: number, taskId: string) => {
    if (onToggleChecklistItem) {
      onToggleChecklistItem(gateId, taskId);
    } else if (setGates) {
      setGates(prev => prev.map(gate => {
        if (gate.gateId === gateId) {
          const updatedChecklist = gate.checklist.map(item => {
            if (item.id === taskId) {
              const newCompleted = !item.completed;
              if (logAction) {
                logAction(
                  newCompleted ? 'Completed Stage Gate Task' : 'Reopened Gate Task',
                  'STAGE-GATE',
                  `Gate 0${gateId}`,
                  `Task: "${item.task}" marked by ${currentUser?.name || 'Engineer'}`
                );
              }
              return {
                ...item,
                completed: newCompleted,
                completedBy: newCompleted ? currentUser?.name || 'Engineer' : undefined,
                completedDate: newCompleted ? new Date().toISOString().split('T')[0] : undefined
              };
            }
            return item;
          });

          const completedCount = updatedChecklist.filter(c => c.completed).length;
          const totalCount = updatedChecklist.length;
          const newPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const allCompleted = totalCount > 0 && completedCount === totalCount;

          return {
            ...gate,
            checklist: updatedChecklist,
            completionPercent: newPercent,
            status: allCompleted ? 'Passed' : gate.status === 'Passed' ? 'In Progress' : gate.status,
            actualCompletionDate: allCompleted ? new Date().toISOString().split('T')[0] : gate.actualCompletionDate
          };
        }
        return gate;
      }));
    }
  };

  // Handle Initialize Standard 5 Gates
  const handleInitStandardGates = (projectId?: string) => {
    const selectedPrj = projects.find(p => p.id === (projectId || initProjectId));
    const standardGates = createDefaultStandardGates(selectedPrj, currentUser?.name || 'Alex Rivera, PE');

    if (onInitializeStandardPipeline) {
      onInitializeStandardPipeline(projectId || initProjectId);
    } else if (setGates) {
      setGates(standardGates);
    }

    if (logAction) {
      logAction(
        'Initialized 5-Phase Stage-Gate Pipeline',
        'STAGE-GATE',
        selectedPrj?.code || 'PLATFORM',
        `Standard 5-Gate Review Pipeline initialized by ${currentUser?.name || 'User'}`
      );
    }
  };

  // Handle Create Gate
  const handleCreateGate = (newGate: StageGate) => {
    if (onAddGate) {
      onAddGate(newGate);
    } else if (setGates) {
      setGates(prev => [...prev, newGate]);
    }

    if (logAction) {
      logAction(
        'Created Stage-Gate Review',
        'STAGE-GATE',
        `Gate 0${newGate.gateId}`,
        `Review "${newGate.gateName}" configured by ${currentUser?.name || 'User'}`
      );
    }
  };

  // Handle Delete Gate
  const handleDeleteGate = (gateId: number) => {
    if (!window.confirm(`Are you sure you want to delete Gate 0${gateId}?`)) return;

    if (onDeleteGate) {
      onDeleteGate(gateId);
    } else if (setGates) {
      setGates(prev => prev.filter(g => g.gateId !== gateId));
    }

    if (logAction) {
      logAction(
        'Deleted Stage-Gate Review',
        'STAGE-GATE',
        `Gate 0${gateId}`,
        `Gate 0${gateId} removed by ${currentUser?.name || 'User'}`
      );
    }
  };

  // Handle Update Gate Status
  const handleStatusChange = (gateId: number, newStatus: 'Passed' | 'In Progress' | 'Blocked' | 'Upcoming') => {
    if (onUpdateGateStatus) {
      onUpdateGateStatus(gateId, newStatus);
    } else if (setGates) {
      setGates(prev => prev.map(g => {
        if (g.gateId === gateId) {
          return {
            ...g,
            status: newStatus,
            actualCompletionDate: newStatus === 'Passed' ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return g;
      }));
    }

    if (logAction) {
      logAction(
        'Updated Gate Status',
        'STAGE-GATE',
        `Gate 0${gateId}`,
        `Status set to ${newStatus} by ${currentUser?.name || 'User'}`
      );
    }
  };

  // Handle Inline Add Deliverable
  const handleSaveInlineDeliverable = (gateId: number) => {
    if (!inlineTaskTitle.trim()) return;

    if (onAddDeliverable) {
      onAddDeliverable(gateId, inlineTaskTitle.trim(), inlineTaskRole, inlineTaskDoc.trim() || undefined);
    } else if (setGates) {
      setGates(prev => prev.map(gate => {
        if (gate.gateId === gateId) {
          const newId = `G${gateId}-${String(gate.checklist.length + 1).padStart(2, '0')}`;
          const updatedList = [
            ...gate.checklist,
            {
              id: newId,
              task: inlineTaskTitle.trim(),
              requiredRole: inlineTaskRole,
              documentRef: inlineTaskDoc.trim() || undefined,
              completed: false
            }
          ];
          const completedCount = updatedList.filter(c => c.completed).length;
          return {
            ...gate,
            checklist: updatedList,
            completionPercent: Math.round((completedCount / updatedList.length) * 100)
          };
        }
        return gate;
      }));
    }

    setInlineTaskTitle('');
    setInlineTaskDoc('');
    setAddingTaskIdForGate(null);
  };

  // Handle Reset / Clear All
  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to reset all Stage Gates? All progress will be cleared.')) return;
    if (setGates) {
      setGates([]);
    }
    if (logAction) {
      logAction(
        'Reset Stage-Gate Pipeline',
        'STAGE-GATE',
        'SYSTEM',
        `Stage-Gate review pipeline reset by ${currentUser?.name || 'User'}`
      );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Stage-Gate Main Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Stage-Gate Product Development Lifecycle Tracker
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                {gates.length} Gates Active
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              5-Phase Gate review pipeline enforcing quality standards, design freezes, and peer deliverable signoffs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Phase Badge */}
          <div className={`flex items-center space-x-2 text-xs px-3.5 py-2 rounded-xl border ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-cyan-600'
          }`}>
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-semibold text-[11px] truncate max-w-[200px]">{activePhaseText}</span>
          </div>

          {/* Quick Initialize Pipeline Button */}
          <button
            onClick={() => handleInitStandardGates()}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400' 
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
            }`}
            title="Initialize standard 5-gate aerospace/automotive review pipeline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{gates.length === 0 ? 'Initialize 5-Phase Pipeline' : 'Re-initialize Standard'}</span>
          </button>

          {/* Create Custom Gate Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>New Stage Gate</span>
          </button>

          {gates.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-[#243149] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' : 'border-[#E2E8F0] hover:bg-rose-50 text-slate-500 hover:text-rose-600'
              }`}
              title="Reset / Clear all gates"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project Filter Toolbar (if projects exist and multiple gates exist) */}
      {projects.length > 0 && gates.length > 0 && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2.5">
            <Filter className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-semibold">Filter by Project:</span>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
              }`}
            >
              <option value="all">All Projects & Platform Gates</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <span className={`text-[11px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Showing {filteredGates.length} of {gates.length} Stage Gates
          </span>
        </div>
      )}

      {/* ================= EMPTY STATE WITH INSTANT ACTION CALLS ================= */}
      {gates.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-2xl border border-dashed text-center space-y-6 transition-colors ${
          isDark ? 'bg-[#111B2E]/60 border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Stage-Gate Reviews Configured
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stage gates enforce mandatory engineering review pipelines, prevent premature production tooling releases, and record cross-functional peer sign-offs (Design, Manufacturing, Quality, and Executive).
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left pt-2">
            {/* 1. Quick Initialize Standard 5-Phase Pipeline */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              isDark ? 'bg-[#0D1628] border-emerald-500/30 hover:border-emerald-500/60' : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Instant Standard Setup</span>
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Initialize 5-Phase Pipeline
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Immediately populates industry-standard gates: Concept, Detailed Design, Prototype, PPAP Pre-Production, and Full Production Launch.
                </p>
              </div>

              {projects.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold block">Select Project (Optional):</label>
                  <select
                    value={initProjectId}
                    onChange={(e) => setInitProjectId(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#CBD5E1]'
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
              )}

              <button
                onClick={() => handleInitStandardGates(initProjectId)}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center space-x-2 cursor-pointer font-bold mt-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Initialize 5-Phase Pipeline</span>
              </button>
            </div>

            {/* 2. Custom Stage Gate Creation */}
            <div className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
              isDark ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500/50' : 'bg-slate-50 border-slate-200 hover:border-cyan-300'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-500 font-bold text-xs uppercase tracking-wide">
                  <Plus className="w-4 h-4" />
                  <span>Custom Configuration</span>
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Create Custom Review
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Configure a custom stage gate from scratch. Define unique milestone criteria, custom deliverables, assigned roles, and document requirements.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer mt-auto ${
                  isDark 
                    ? 'border-[#243149] bg-[#111B2E] hover:bg-[#1A263D] text-cyan-400' 
                    : 'border-[#CBD5E1] bg-white hover:bg-slate-100 text-cyan-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Stage Gate</span>
              </button>
            </div>
          </div>

          {/* Informational Guidance Box */}
          <div className={`p-4 rounded-xl border max-w-xl mx-auto text-left text-xs space-y-1.5 ${
            isDark ? 'bg-[#0D1628]/60 border-[#243149] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="font-semibold text-cyan-500 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Stage-Gate Governance Principles</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Each gate represents a mandatory formal review milestone. Gates contain peer deliverables with role-based sign-offs (Design, Manufacturing, Quality, and Program Management). A gate cannot advance to 'Passed' until its required checklist deliverables are marked complete.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 5-Gate Horizontal Pipeline Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {filteredGates.map((gate) => {
              const isPassed = gate.status === 'Passed';
              const isInProgress = gate.status === 'In Progress';
              const isBlocked = gate.status === 'Blocked';

              return (
                <div
                  key={gate.gateId}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isPassed
                      ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : isInProgress
                      ? isDark ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-sm' : 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                      : isBlocked
                      ? isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                      : isDark ? 'bg-[#111B2E] border-[#243149] text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold font-mono ${
                        isDark ? 'bg-[#0D1628]' : 'bg-[#F8FAFC]'
                      }`}>
                        Gate 0{gate.gateId}
                      </span>
                      {isPassed ? (
                        <span className="badge-status badge-active text-[10px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Passed</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="badge-status badge-review text-[10px] flex items-center space-x-1">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>In Progress</span>
                        </span>
                      ) : isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Upcoming</span>
                      )}
                    </div>

                    <h3 className={`text-xs font-bold line-clamp-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                      {gate.gateName}
                    </h3>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-inherit/20">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span>Progress</span>
                      <span className="font-bold">{gate.completionPercent}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#0D1628]' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isPassed ? 'bg-emerald-500' : isInProgress ? 'bg-cyan-500' : isBlocked ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${gate.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className={`text-[11px] font-mono flex items-center justify-between ${
                    isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    <span>Target:</span>
                    <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                      {gate.targetCompletionDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Deliverable Checklists Per Gate */}
          <div className="space-y-6">
            {filteredGates.map((gate) => {
              const completedCount = gate.checklist.filter((c) => c.completed).length;
              const totalCount = gate.checklist.length;
              const isPassed = gate.status === 'Passed';

              return (
                <div
                  key={gate.gateId}
                  className={`rounded-2xl p-6 border shadow-sm space-y-5 text-xs transition-all ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  {/* Gate Card Header */}
                  <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-4 ${
                    isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isDark ? 'bg-[#0D1628] text-cyan-400' : 'bg-slate-100 text-cyan-700'
                        }`}>
                          Gate 0{gate.gateId}
                        </span>
                        <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                          {gate.gateName}
                        </h3>
                        <span className={`badge-status text-[10px] ${
                          isPassed ? 'badge-active' : 'badge-review'
                        }`}>
                          {gate.stage} phase
                        </span>
                        {gate.projectName && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center space-x-1 border ${
                            isDark ? 'bg-[#0D1628] border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            <Briefcase className="w-3 h-3" />
                            <span>{gate.projectName}</span>
                          </span>
                        )}
                        {gate.partNumber && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center space-x-1 border ${
                            isDark ? 'bg-[#0D1628] border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'
                          }`}>
                            <Box className="w-3 h-3" />
                            <span>{gate.partNumber}</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        {gate.description}
                      </p>
                      <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-cyan-500" />
                          <span>Owner: {gate.responsibleEngineer}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-cyan-500" />
                          <span>Target: {gate.targetCompletionDate}</span>
                        </span>
                        {gate.actualCompletionDate && (
                          <span className="flex items-center space-x-1 text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Completed: {gate.actualCompletionDate}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Header Controls: Status selector + Progress + Delete */}
                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Status Selector */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">Status:</span>
                        <select
                          value={gate.status}
                          onChange={(e) => handleStatusChange(gate.gateId, e.target.value as any)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer ${
                            gate.status === 'Passed'
                              ? isDark ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : gate.status === 'In Progress'
                              ? isDark ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                              : gate.status === 'Blocked'
                              ? isDark ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-rose-50 border-rose-300 text-rose-700'
                              : isDark ? 'bg-[#0D1628] border-[#243149] text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-600'
                          }`}
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Passed">Passed</option>
                        </select>
                      </div>

                      {/* Progress Badge */}
                      <div className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] font-bold ${
                        isPassed 
                          ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : isDark ? 'bg-[#0D1628] border-[#243149] text-cyan-400' : 'bg-slate-50 border-slate-200 text-cyan-700'
                      }`}>
                        {completedCount} / {totalCount} Passed ({gate.completionPercent}%)
                      </div>

                      {/* Delete Gate */}
                      <button
                        onClick={() => handleDeleteGate(gate.gateId)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isDark ? 'border-[#243149] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' : 'border-[#E2E8F0] hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                        }`}
                        title="Delete Gate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-2">
                    {gate.checklist.map((item) => {
                      const requiredPersona = USER_PERSONAS[item.requiredRole] || {
                        name: item.requiredRole,
                        department: 'Engineering'
                      };

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                            item.completed
                              ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                              : isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleChecklistClick(gate.gateId, item.id)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                                item.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : isDark ? 'border-[#243149] hover:border-cyan-500 bg-[#111B2E]' : 'border-[#CBD5E1] hover:border-cyan-500 bg-white'
                              }`}
                              title={item.completed ? 'Click to reopen deliverable' : 'Click to sign-off and complete deliverable'}
                            >
                              {item.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                            </button>

                            <div className="min-w-0">
                              <span className={`text-xs font-semibold ${
                                item.completed 
                                  ? isDark ? 'line-through text-slate-500' : 'line-through text-slate-400' 
                                  : isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                              }`}>
                                {item.task}
                              </span>

                              {item.documentRef && (
                                <div className="text-[11px] font-mono text-cyan-500 flex items-center space-x-1 mt-0.5">
                                  <FileText className="w-3 h-3" />
                                  <span>Linked Doc: {item.documentRef}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="badge-status badge-active text-[10px]">
                              Signoff: {requiredPersona.name} ({requiredPersona.department})
                            </span>

                            {item.completed && (
                              <span className={`text-[11px] font-mono flex items-center space-x-1 ${
                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                <Check className="w-3 h-3" />
                                <span>Signed off {item.completedDate}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Deliverable Form / Button */}
                  {addingTaskIdForGate === gate.gateId ? (
                    <div className={`p-3.5 rounded-xl border space-y-3 ${
                      isDark ? 'bg-[#0D1628] border-cyan-500/30' : 'bg-slate-50 border-cyan-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-cyan-500">
                          Add Deliverable Task to Gate 0{gate.gateId}
                        </span>
                        <button
                          onClick={() => setAddingTaskIdForGate(null)}
                          className="text-slate-400 hover:text-slate-300 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="Task name (e.g. Tolerance Stackup & GD&T Sign-off)"
                          value={inlineTaskTitle}
                          onChange={(e) => setInlineTaskTitle(e.target.value)}
                          className={`sm:col-span-6 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 ${
                            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#CBD5E1]'
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveInlineDeliverable(gate.gateId);
                            }
                          }}
                        />

                        <select
                          value={inlineTaskRole}
                          onChange={(e) => setInlineTaskRole(e.target.value as UserPersona)}
                          className={`sm:col-span-3 px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#CBD5E1]'
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
                          placeholder="Doc Ref (e.g. DOC-ENG-001)"
                          value={inlineTaskDoc}
                          onChange={(e) => setInlineTaskDoc(e.target.value)}
                          className={`sm:col-span-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none focus:border-cyan-500 ${
                            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#CBD5E1]'
                          }`}
                        />

                        <button
                          onClick={() => handleSaveInlineDeliverable(gate.gateId)}
                          disabled={!inlineTaskTitle.trim()}
                          className="sm:col-span-1 btn-primary btn-sm flex items-center justify-center p-1.5 disabled:opacity-50 cursor-pointer font-bold"
                          title="Save Deliverable"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingTaskIdForGate(gate.gateId);
                        setInlineTaskTitle('');
                        setInlineTaskDoc('');
                      }}
                      className={`w-full py-2.5 rounded-xl border border-dashed flex items-center justify-center space-x-1.5 transition-colors cursor-pointer text-xs font-medium ${
                        isDark 
                          ? 'border-[#243149] hover:border-cyan-500/50 hover:bg-[#0D1628] text-slate-400 hover:text-cyan-400' 
                          : 'border-[#CBD5E1] hover:border-cyan-500/50 hover:bg-slate-50 text-slate-600 hover:text-cyan-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Deliverable to Gate 0{gate.gateId}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Stage Gate Modal */}
      <CreateStageGateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        existingGates={gates}
        projects={projects}
        parts={parts}
        currentUser={currentUser}
        onCreateGate={handleCreateGate}
      />
    </div>
  );
};

// Error Boundary for Stage Gate Tracker
class StageGateErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Stage Gate Tracker Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Design Review & Stage Gate Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading phase gate review pipeline.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload Design Review</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const StageGateTracker: React.FC<StageGateTrackerProps> = (props) => (
  <StageGateErrorBoundary>
    <StageGateTrackerInternal {...props} />
  </StageGateErrorBoundary>
);

export default StageGateTracker;
