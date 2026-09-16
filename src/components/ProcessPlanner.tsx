import React, { useState } from 'react';
import { 
  Cpu, 
  Wrench, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Plus, 
  Layers, 
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';
import type { ProcessOperation, PartItem } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface ProcessPlannerProps {
  part?: PartItem;
  operations?: ProcessOperation[];
  onAddOperation?: (op: ProcessOperation) => void;
}

export const ProcessPlannerInternal: React.FC<ProcessPlannerProps> = ({ part: rawPart, operations: initialOps = [] }) => {
  const part = rawPart || INITIAL_PARTS[0];
  const { isDark } = useTheme();
  const [opsList, setOpsList] = useState<ProcessOperation[]>(initialOps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<ProcessOperation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    opNumber: 40,
    name: '',
    machineName: 'Mazak INTEGREX e-420H 5-Axis CNC',
    setupTimeMin: 30,
    cycleTimeSec: 180,
    toolRequired: 'T02 10mm Carbide Endmill',
    fixtureRequired: 'FJ-CAR-903 Modular Vise Clamps',
    operatorRole: 'CNC Machinist Level 2',
    estimatedCost: 65.00,
    inspectionPoints: 'Verify dimensional limits with micrometer & bore gauge.'
  });

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getNextOpNumber = () => {
    if (opsList.length === 0) return 10;
    const maxOp = Math.max(...opsList.map((o) => o.opNumber));
    return maxOp + 10;
  };

  const openAddModal = () => {
    setEditingOp(null);
    setValidationError(null);
    setFormData({
      opNumber: getNextOpNumber(),
      name: '',
      machineName: 'Mazak INTEGREX e-420H 5-Axis CNC',
      setupTimeMin: 30,
      cycleTimeSec: 180,
      toolRequired: 'T02 10mm Carbide Endmill',
      fixtureRequired: 'FJ-CAR-903 Modular Vise Clamps',
      operatorRole: 'CNC Machinist Level 2',
      estimatedCost: 65.00,
      inspectionPoints: 'Verify dimensional limits with micrometer & bore gauge.'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (op: ProcessOperation) => {
    setEditingOp(op);
    setValidationError(null);
    setFormData({
      opNumber: op.opNumber,
      name: op.name,
      machineName: op.machineName,
      setupTimeMin: op.setupTimeMin,
      cycleTimeSec: op.cycleTimeSec,
      toolRequired: op.toolRequired,
      fixtureRequired: op.fixtureRequired,
      operatorRole: op.operatorRole,
      estimatedCost: op.estimatedCost,
      inspectionPoints: op.inspectionPoints
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setValidationError('Operation Name is required.');
      return false;
    }
    if (formData.opNumber <= 0) {
      setValidationError('Operation Number must be greater than 0.');
      return false;
    }
    return true;
  };

  const handleSave = (addNext: boolean = false) => {
    if (!validateForm()) return;

    if (editingOp) {
      // Update
      const updated = opsList.map((op) =>
        op.id === editingOp.id
          ? { ...op, ...formData }
          : op
      );
      setOpsList(updated);
      triggerNotification(`Updated Operation Op ${formData.opNumber}`);
      setIsModalOpen(false);
    } else {
      // Create new
      const newOp: ProcessOperation = {
        id: `op-${Date.now()}`,
        ...formData,
        machineId: `MCH-${Math.floor(100 + Math.random() * 900)}`
      };
      setOpsList([...opsList, newOp]);
      triggerNotification(`Created Operation Op ${formData.opNumber}`);

      if (addNext) {
        setFormData({
          opNumber: formData.opNumber + 10,
          name: '',
          machineName: formData.machineName,
          setupTimeMin: 15,
          cycleTimeSec: 120,
          toolRequired: '',
          fixtureRequired: formData.fixtureRequired,
          operatorRole: formData.operatorRole,
          estimatedCost: 45.00,
          inspectionPoints: 'Verify surface finish Ra 0.8µm.'
        });
      } else {
        setIsModalOpen(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    const target = opsList.find((o) => o.id === id);
    setOpsList(opsList.filter((o) => o.id !== id));
    setDeleteConfirmId(null);
    triggerNotification(`Deleted Operation Op ${target?.opNumber || ''}`);
  };

  const handleDuplicate = (op: ProcessOperation) => {
    const nextOpNum = getNextOpNumber();
    const duplicated: ProcessOperation = {
      ...op,
      id: `op-${Date.now()}`,
      opNumber: nextOpNum,
      name: `${op.name} (Copy)`
    };
    setOpsList([...opsList, duplicated]);
    triggerNotification(`Duplicated Operation to Op ${nextOpNum}`);
  };

  const moveOp = (index: number, direction: 'up' | 'down') => {
    const newOps = [...opsList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newOps.length) return;

    const temp = newOps[index];
    newOps[index] = newOps[targetIdx];
    newOps[targetIdx] = temp;

    setOpsList(newOps);
  };

  // Recalculate KPIs
  const totalCycleTimeSec = opsList.reduce((acc, op) => acc + op.cycleTimeSec, 0);
  const totalSetupTimeMin = opsList.reduce((acc, op) => acc + op.setupTimeMin, 0);
  const totalMfgCost = opsList.reduce((acc, op) => acc + op.estimatedCost, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce border ${
          isDark ? 'bg-[#111B2E] border-emerald-500/30 text-emerald-400' : 'bg-white border-emerald-300 text-emerald-700'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2.5 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Computer-Aided Process Planning (CAPP) & DFM Routing</span>
              <span className="badge-status badge-active text-xs font-mono">
                {part.partNumber}
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Manufacturing operation sequences, CNC machine assignments, tooling fixtures, setup times, and process DFM cost estimation.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary btn-sm flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routing Op</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Total Machining Cycle Time</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">
            {(totalCycleTimeSec / 60).toFixed(1)} mins <span className="text-xs font-normal text-secondary">({totalCycleTimeSec}s)</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Setup Time</span>
          <div className="text-2xl font-bold text-purple-500 font-mono">{totalSetupTimeMin} mins</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Manufacturing Cost / Part</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">${totalMfgCost.toFixed(2)}</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Routing Operations</span>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{opsList.length} Ops</div>
        </div>
      </div>

      {/* Operations Sequence Flow */}
      <div className="space-y-4">
        {opsList.map((op, idx) => (
          <div
            key={op.id}
            className={`rounded-xl p-5 border shadow-sm space-y-3 text-xs transition-all ${
              isDark ? 'bg-[#111B2E] border-[#243149] hover:border-slate-600' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="badge-status badge-review font-mono text-xs font-bold">
                  Op {op.opNumber}
                </span>
                <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{op.name}</h3>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-emerald-500 font-bold font-mono text-sm">${op.estimatedCost.toFixed(2)}</span>

                {/* Operations Controls */}
                <div className={`flex items-center space-x-1 p-1 rounded-lg border ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <button
                    onClick={() => moveOp(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveOp(idx, 'down')}
                    disabled={idx === opsList.length - 1}
                    className="p-1 text-secondary hover:text-primary disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(op)}
                    className="p-1 text-secondary hover:text-cyan-500 cursor-pointer"
                    title="Duplicate Operation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(op)}
                    className="p-1 text-secondary hover:text-amber-500 cursor-pointer"
                    title="Edit Operation"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(op.id)}
                    className="p-1 text-secondary hover:text-rose-500 cursor-pointer"
                    title="Delete Operation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Machine Assignment:</span>
                <span className={`font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>{op.machineName}</span>
              </div>

              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Cutting Tools & Fixture:</span>
                <span className="text-amber-500 font-semibold font-mono">{op.toolRequired}</span>
                <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Fixture: {op.fixtureRequired}</div>
              </div>

              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Cycle & Setup Time:</span>
                <span className="text-cyan-500 font-bold font-mono">{op.cycleTimeSec}s Cycle</span>
                <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{op.setupTimeMin}m Setup</div>
              </div>
            </div>

            <div className={`flex items-center justify-between text-[11px] pt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>In-Process Quality Check: {op.inspectionPoints}</span>
              </span>
              <span className="text-purple-500 font-semibold">Operator: {op.operatorRole}</span>
            </div>
          </div>
        ))}
      </div>

      {/* NEW / EDIT ROUTING OPERATION MODAL DIALOG */}
      {isModalOpen && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  {editingOp ? `Edit Routing Operation Op ${editingOp.opNumber}` : 'New Routing Operation'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary cursor-pointer p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Operation Number (e.g. 10, 20, 30)</label>
                <input
                  type="number"
                  value={formData.opNumber}
                  onChange={(e) => setFormData({ ...formData, opNumber: Number(e.target.value) })}
                  className="plm-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Operation Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 5-Axis High-Speed Pocket Milling"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Work Center / CNC Machine</label>
                <select
                  value={formData.machineName}
                  onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                  className="plm-select w-full text-xs"
                >
                  <option value="Mazak INTEGREX e-420H 5-Axis CNC">Mazak INTEGREX 5-Axis CNC</option>
                  <option value="Haas VF-4SS 5-Axis Vertical Mill">Haas VF-4SS Vertical Mill</option>
                  <option value="SIP Precision Jig Boring Machine">SIP Precision Jig Borer</option>
                  <option value="Trumpf TruLaser 5030 Fiber Cutter">Trumpf Laser Cutter</option>
                  <option value="DMG MORI CTX beta 1250 TC Lathe">DMG MORI Turning Center</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Operator Skill Level</label>
                <input
                  type="text"
                  value={formData.operatorRole}
                  onChange={(e) => setFormData({ ...formData, operatorRole: e.target.value })}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Setup Time (minutes)</label>
                <input
                  type="number"
                  value={formData.setupTimeMin}
                  onChange={(e) => setFormData({ ...formData, setupTimeMin: Number(e.target.value) })}
                  className="plm-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Machining Cycle Time (seconds)</label>
                <input
                  type="number"
                  value={formData.cycleTimeSec}
                  onChange={(e) => setFormData({ ...formData, cycleTimeSec: Number(e.target.value) })}
                  className="plm-input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Cutting Tool Required</label>
                <input
                  type="text"
                  value={formData.toolRequired}
                  onChange={(e) => setFormData({ ...formData, toolRequired: e.target.value })}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Fixture / Jig Required</label>
                <input
                  type="text"
                  value={formData.fixtureRequired}
                  onChange={(e) => setFormData({ ...formData, fixtureRequired: e.target.value })}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>In-Process Quality Inspection Point</label>
                <input
                  type="text"
                  value={formData.inspectionPoints}
                  onChange={(e) => setFormData({ ...formData, inspectionPoints: e.target.value })}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Estimated Cost / Part ($)</label>
                <input
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                  className="plm-input w-full text-xs font-mono font-bold text-emerald-500"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-700/30">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>

              {!editingOp && (
                <button
                  onClick={() => handleSave(true)}
                  className="btn-secondary btn-sm"
                >
                  Save & Add Next
                </button>
              )}

              <button
                onClick={() => handleSave(false)}
                className="btn-primary btn-sm"
              >
                Save Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL DIALOG */}
      {deleteConfirmId && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-sm p-6 text-center space-y-4 text-xs">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Delete Routing Operation?</h3>
            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Are you sure you want to remove this operation from the CAPP routing sequence? Cycle time and costs will be recalculated.
            </p>
            <div className="flex justify-center space-x-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="btn-destructive btn-sm"
              >
                Delete Operation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Error Boundary for Process Planner
class ProcessPlannerErrorBoundary extends React.Component<
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
    console.error('Process Planner Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">CAPP Process Planner Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading manufacturing routing.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload Process Planner</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ProcessPlanner: React.FC<ProcessPlannerProps> = (props) => (
  <ProcessPlannerErrorBoundary>
    <ProcessPlannerInternal {...props} />
  </ProcessPlannerErrorBoundary>
);

export default ProcessPlanner;


