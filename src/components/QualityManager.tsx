import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  FileText, 
  TrendingDown, 
  Activity,
  Layers,
  Wrench,
  MoreVertical,
  Edit3,
  Eye,
  Trash2,
  Archive,
  Filter,
  CheckCircle,
  Clock,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { QualityNCR, CAPA, PartItem, NcrStatus, NcrSeverity } from '../types/plm';
import { CreateNcrModal } from './CreateNcrModal';
import { NcrDetailModal } from './NcrDetailModal';
import { EditNcrModal } from './EditNcrModal';
import { ChangeNcrStatusModal } from './ChangeNcrStatusModal';
import { DeleteNcrModal } from './DeleteNcrModal';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface QualityManagerProps {
  ncrs: QualityNCR[];
  capas: CAPA[];
  partsMap: Record<string, PartItem>;
  currentUser?: { name: string; email?: string; role?: string } | null;
  onAddNcr: (ncr: QualityNCR) => void;
  onUpdateNcr?: (ncr: QualityNCR) => void;
  onDeleteNcr?: (ncrId: string) => void;
  onArchiveNcr?: (ncrId: string) => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const QualityManager: React.FC<QualityManagerProps> = ({
  ncrs,
  capas,
  partsMap,
  currentUser,
  onAddNcr,
  onUpdateNcr,
  onDeleteNcr,
  onArchiveNcr,
  logAction
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'ncr' | 'capa' | 'spc'>('ncr');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNcrForView, setSelectedNcrForView] = useState<QualityNCR | null>(null);
  const [selectedNcrForEdit, setSelectedNcrForEdit] = useState<QualityNCR | null>(null);
  const [selectedNcrForStatus, setSelectedNcrForStatus] = useState<QualityNCR | null>(null);
  const [selectedNcrForDelete, setSelectedNcrForDelete] = useState<QualityNCR | null>(null);

  // Active Menu Dropdown ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ title: string; sub?: string } | null>(null);

  const showToast = (title: string, sub?: string) => {
    setToastMessage({ title, sub });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handlers
  const handleCreateNcr = (newNcr: QualityNCR) => {
    onAddNcr(newNcr);
    showToast(`${newNcr.ncrNumber} created successfully.`, newNcr.title);
    if (logAction) {
      logAction('Created NCR', 'QUALITY', newNcr.ncrNumber, `Logged new NCR: ${newNcr.title}`);
    }
  };

  const handleUpdateNcr = (updatedNcr: QualityNCR) => {
    if (onUpdateNcr) {
      onUpdateNcr(updatedNcr);
    }
    // Also update current view if open
    if (selectedNcrForView?.id === updatedNcr.id) {
      setSelectedNcrForView(updatedNcr);
    }
    showToast(`${updatedNcr.ncrNumber} updated successfully.`, `Status: ${updatedNcr.status}`);
    if (logAction) {
      logAction('Updated NCR', 'QUALITY', updatedNcr.ncrNumber, `Saved changes for ${updatedNcr.title}`);
    }
  };

  const handleDeleteNcr = (ncrId: string) => {
    const target = ncrs.find(n => n.id === ncrId);
    if (onDeleteNcr) {
      onDeleteNcr(ncrId);
    }
    showToast(`${target?.ncrNumber || 'NCR'} deleted successfully.`);
    if (logAction && target) {
      logAction('Deleted NCR', 'QUALITY', target.ncrNumber, `Removed draft NCR record.`);
    }
  };

  const handleArchiveNcr = (ncrId: string) => {
    const target = ncrs.find(n => n.id === ncrId);
    if (onArchiveNcr) {
      onArchiveNcr(ncrId);
    } else if (onUpdateNcr && target) {
      onUpdateNcr({ ...target, status: 'Archived' as NcrStatus });
    }
    showToast(`${target?.ncrNumber || 'NCR'} moved to Quality Archive.`, 'Audit compliance record preserved.');
    if (logAction && target) {
      logAction('Archived NCR', 'QUALITY', target.ncrNumber, `Moved controlled NCR to archive.`);
    }
  };

  // Filtered NCR List
  const filteredNcrs = ncrs.filter((ncr) => {
    const matchesSearch = 
      ncr.ncrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.targetPartNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.linkedPartId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.reportedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.detectedBy?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ncr.status !== 'Closed' && ncr.status !== 'Archived') ||
      ncr.status === statusFilter;

    const matchesSeverity = 
      severityFilter === 'ALL' || ncr.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const activeNcrsCount = ncrs.filter((n) => n.status !== 'Closed' && n.status !== 'Archived').length;

  // SPC Control Chart Data (Light Theme Optimized)
  const spcChartData = {
    labels: ['Lot 1', 'Lot 2', 'Lot 3', 'Lot 4', 'Lot 5', 'Lot 6', 'Lot 7', 'Lot 8', 'Lot 9', 'Lot 10'],
    datasets: [
      {
        label: 'Sun Gear Bore Radius (mm)',
        data: [18.002, 18.004, 18.001, 18.009, 18.014, 18.003, 18.002, 18.005, 18.001, 18.003],
        borderColor: '#0284C7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        pointBackgroundColor: '#0284C7',
        tension: 0.3
      },
      {
        label: 'UCL (Upper Control Limit)',
        data: Array(10).fill(18.012),
        borderColor: '#EF4444',
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0
      },
      {
        label: 'LCL (Lower Control Limit)',
        data: Array(10).fill(17.992),
        borderColor: '#EF4444',
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: isDark ? '#CBD5E1' : '#475569', font: { family: 'sans-serif', size: 11, weight: 'bold' as const } } }
    },
    scales: {
      x: { ticks: { color: isDark ? '#94A3B8' : '#64748B' }, grid: { color: isDark ? '#263449' : '#E2E8F0' } },
      y: { ticks: { color: isDark ? '#94A3B8' : '#64748B' }, grid: { color: isDark ? '#263449' : '#E2E8F0' } }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl border text-xs shadow-2xl flex items-start space-x-3 animate-in slide-in-from-top-4 ${
          isDark ? 'bg-[#111B2E] border-amber-500/30 text-[#F1F5F9]' : 'bg-white border-amber-300 text-[#172033]'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">{toastMessage.title}</div>
            {toastMessage.sub && <div className={`text-xs font-normal mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{toastMessage.sub}</div>}
          </div>
        </div>
      )}

      {/* Header & Module Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-amber-500 border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2.5 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Quality Management System (QMS & NCR)</span>
              <span className="badge-status badge-active text-[10px]">
                ISO 9001 COMPLIANT
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Closed-loop non-conformance tracking, ISO 9001 compliance, CMM First Article Inspection, and Statistical Process Control (SPC).
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center p-1 rounded-xl border space-x-1 text-xs font-medium ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <button
            onClick={() => setActiveTab('ncr')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ncr' ? 'btn-primary btn-sm' : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <span>NCR Records ({ncrs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('capa')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'capa' ? 'btn-primary btn-sm' : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <span>CAPA Actions ({capas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('spc')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'spc' ? 'btn-primary btn-sm' : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <span>SPC Control Charts</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans text-xs">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Defect PPM Rate</div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>18.4 PPM</div>
          <div className="text-[11px] text-emerald-500 mt-1 flex items-center space-x-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-12.5% Month over Month</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>First Pass Yield (FPY)</div>
          <div className="text-2xl font-bold text-emerald-500 font-mono">98.4%</div>
          <div className={`text-[11px] mt-1 font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Target: &gt;97.5%</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Open Non-Conformances</div>
          <div className="text-2xl font-bold text-amber-500 font-mono">{activeNcrsCount} Active</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{ncrs.length} Total Registered NCRs</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>CAPA Resolution Time</div>
          <div className="text-2xl font-bold text-purple-500 font-mono">14.2 Days</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Verified Effective</div>
        </div>
      </div>

      {/* NCR LIST TAB */}
      {activeTab === 'ncr' && (
        <div className={`rounded-2xl p-5 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          
          {/* Top Control Bar */}
          <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <span>Non-Conformance Reports (NCR)</span>
                <span className="badge-status badge-review text-xs font-mono">
                  {filteredNcrs.length} Records
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Inspect, contain, and execute corrective action workflows on manufactured parts.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 text-xs w-full lg:w-auto justify-start lg:justify-end">
              
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-60">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'
                }`} />
                <input
                  type="text"
                  placeholder="Search NCR, Part, Inspector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="plm-select text-xs py-1.5"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active (Open / Inv)</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Containment">Containment</option>
                <option value="Corrective Action">Corrective Action</option>
                <option value="Verification">Verification</option>
                <option value="Closed">Closed</option>
                <option value="Archived">Archived</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="plm-select text-xs py-1.5"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>

              {/* + Report NCR Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary btn-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Report NCR</span>
              </button>

            </div>
          </div>

          {/* NCR CARDS GRID */}
          {filteredNcrs.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center space-y-3 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <ShieldCheck className="w-10 h-10 text-[#64748B] mx-auto" />
              <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>No Non-Conformance Reports Found</div>
              <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                No NCRs match your active filters. Click "+ Report NCR" above to log a new manufacturing non-conformance.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary btn-sm inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create New NCR</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNcrs.map((ncr) => {
                const part = partsMap[ncr.linkedPartId] || Object.values(partsMap).find(p => p.partNumber === ncr.targetPartNumber);
                const isMenuOpen = activeMenuId === ncr.id;

                return (
                  <div
                    key={ncr.id}
                    className={`rounded-xl p-4 space-y-3 text-xs shadow-sm transition-all relative flex flex-col justify-between border ${
                      isDark ? 'bg-[#0D1628] border-[#243149] hover:border-slate-600' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    
                    {/* Top Row: NCR Number + Severity + ⋮ Action Menu */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="font-bold text-amber-500 text-sm">{ncr.ncrNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          ncr.severity === 'Critical'
                            ? 'badge-status badge-archived'
                            : ncr.severity === 'Major'
                            ? 'badge-status badge-review'
                            : 'badge-status badge-active'
                        }`}>
                          {ncr.severity}
                        </span>
                        {ncr.ncrType && (
                          <span className={`text-[10px] hidden sm:inline-block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                            • {ncr.ncrType}
                          </span>
                        )}
                      </div>

                      {/* ⋮ Action Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : ncr.id);
                          }}
                          className="p-1 rounded-lg text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="NCR Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl py-1.5 w-44 text-xs space-y-0.5 border ${
                              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                            }`}>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedNcrForView(ncr);
                                }}
                                className={`w-full px-3.5 py-2 text-left flex items-center space-x-2 cursor-pointer transition-colors ${
                                  isDark ? 'text-[#CBD5E1] hover:bg-[#151F32]' : 'text-[#334155] hover:bg-[#F1F5F9]'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                                <span>View NCR</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedNcrForEdit(ncr);
                                }}
                                className={`w-full px-3.5 py-2 text-left flex items-center space-x-2 cursor-pointer transition-colors ${
                                  isDark ? 'text-[#CBD5E1] hover:bg-[#151F32]' : 'text-[#334155] hover:bg-[#F1F5F9]'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Edit NCR</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedNcrForStatus(ncr);
                                }}
                                className={`w-full px-3.5 py-2 text-left flex items-center space-x-2 cursor-pointer transition-colors ${
                                  isDark ? 'text-[#CBD5E1] hover:bg-[#151F32]' : 'text-[#334155] hover:bg-[#F1F5F9]'
                                }`}
                              >
                                <Activity className="w-3.5 h-3.5 text-purple-500" />
                                <span>Change Status</span>
                              </button>

                              <div className={`border-t my-1 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`} />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setSelectedNcrForDelete(ncr);
                                }}
                                className={`w-full px-3.5 py-2 text-left text-rose-500 flex items-center space-x-2 cursor-pointer transition-colors ${
                                  isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                                }`}
                              >
                                {ncr.status === 'Open' ? (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete NCR</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>Archive NCR</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Title & Target Part */}
                    <div className="space-y-1">
                      <h4
                        onClick={() => setSelectedNcrForView(ncr)}
                        className={`font-bold text-sm hover:text-amber-500 transition-colors cursor-pointer ${
                          isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                        }`}
                      >
                        {ncr.title}
                      </h4>
                      <div className={`font-mono text-xs flex items-center space-x-1.5 ${
                        isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                      }`}>
                        <span>Target Part:</span>
                        <span className="text-cyan-500 font-bold">{part?.partNumber || ncr.targetPartNumber || ncr.linkedPartId}</span>
                        {part?.name && <span className={`truncate ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>({part.name})</span>}
                      </div>
                    </div>

                    {/* Root Cause snippet */}
                    <div className={`p-2.5 rounded-lg border space-y-1 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}>
                      <div className="text-amber-500 font-bold font-mono text-[10px] uppercase">
                        Root Cause (5-Why Analysis):
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                        {ncr.rootCause5Why || ncr.rootCauseDescription || ncr.description}
                      </p>
                    </div>

                    {/* Bottom Metadata: Inspector + Status + Date */}
                    <div className={`flex items-center justify-between border-t pt-2.5 text-[10px] font-mono ${
                      isDark ? 'border-[#243149] text-[#94A3B8]' : 'border-[#E2E8F0] text-[#64748B]'
                    }`}>
                      <div className="flex items-center space-x-1.5 truncate max-w-[55%]">
                        <User className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="truncate">{ncr.detectedBy || ncr.reportedBy}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-secondary text-[10px]">{ncr.dateDetected || ncr.dateReported}</span>
                        <span className={`badge-status text-[10px] ${
                          ncr.status === 'Closed'
                            ? 'badge-active'
                            : ncr.status === 'Under Investigation'
                            ? 'badge-review'
                            : ncr.status === 'Archived'
                            ? 'badge-archived'
                            : 'badge-draft'
                        }`}>
                          {ncr.status}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* CAPA ACTIONS TAB */}
      {activeTab === 'capa' && (
        <div className={`rounded-2xl p-5 border shadow-sm space-y-4 text-xs ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Corrective & Preventive Actions (CAPA Log)</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Formal containment and 8D root-cause problem solving tasks.</p>
            </div>
            <span className="badge-status badge-review text-xs font-mono">{capas.length} Linked Actions</span>
          </div>

          <div className="space-y-3">
            {capas.map((capa) => (
              <div key={capa.id} className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-purple-500 font-mono">{capa.capaNumber}</span>
                    <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Linked: {capa.linkedNcrId}</span>
                  </div>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{capa.title}</h4>
                  <div className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Owner: {capa.owner} • Target: {capa.targetDate}</div>
                </div>

                <span className="badge-status badge-active text-xs">
                  {capa.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPC CONTROL CHART TAB */}
      {activeTab === 'spc' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>Statistical Process Control (SPC) - Sun Gear Bore Tolerance Run</span>
            </h3>
            <span className="badge-status badge-active text-xs font-mono">Process Capability (Cpk): 1.48 (Capable)</span>
          </div>

          <div className="h-[340px] w-full">
            <Line data={spcChartData} options={chartOptions} />
          </div>
        </div>
      )}


      {/* CREATE NEW NCR MODAL */}
      <CreateNcrModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        existingNcrs={ncrs}
        partsMap={partsMap}
        currentUser={currentUser}
        onSave={handleCreateNcr}
      />

      {/* VIEW NCR DETAIL MODAL */}
      <NcrDetailModal
        isOpen={Boolean(selectedNcrForView)}
        onClose={() => setSelectedNcrForView(null)}
        ncr={selectedNcrForView}
        partsMap={partsMap}
        onEdit={(ncr) => {
          setSelectedNcrForView(null);
          setSelectedNcrForEdit(ncr);
        }}
        onChangeStatus={(ncr) => {
          setSelectedNcrForStatus(ncr);
        }}
      />

      {/* EDIT NCR MODAL */}
      <EditNcrModal
        isOpen={Boolean(selectedNcrForEdit)}
        onClose={() => setSelectedNcrForEdit(null)}
        ncr={selectedNcrForEdit}
        partsMap={partsMap}
        currentUser={currentUser}
        onSave={handleUpdateNcr}
      />

      {/* CHANGE STATUS MODAL */}
      <ChangeNcrStatusModal
        isOpen={Boolean(selectedNcrForStatus)}
        onClose={() => setSelectedNcrForStatus(null)}
        ncr={selectedNcrForStatus}
        currentUser={currentUser}
        onSave={handleUpdateNcr}
      />

      {/* DELETE / ARCHIVE NCR MODAL */}
      <DeleteNcrModal
        isOpen={Boolean(selectedNcrForDelete)}
        onClose={() => setSelectedNcrForDelete(null)}
        ncr={selectedNcrForDelete}
        onConfirmDelete={handleDeleteNcr}
        onConfirmArchive={handleArchiveNcr}
      />

    </div>
  );
};
