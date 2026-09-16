import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Box, 
  Search, 
  Download, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Sliders,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import type { DfmeaRow, PartItem } from '../types/plm';
import { INITIAL_DFMEA } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface DfmeaManagerProps {
  dfmeaRows?: DfmeaRow[];
  partsMap?: Record<string, PartItem>;
  onSelectPart?: (partId: string) => void;
  onAddDfmea?: (row: DfmeaRow) => void;
}

export const DfmeaManagerInternal: React.FC<DfmeaManagerProps> = ({ 
  dfmeaRows: rawRows, 
  partsMap = {}, 
  onSelectPart = () => {}
}) => {
  const dfmeaRows = rawRows && rawRows.length > 0 ? rawRows : INITIAL_DFMEA;
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRows = dfmeaRows.filter((row) => {
    const matchesText = 
      row.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.potentialFailureMode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.system.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.responsibleEngineer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || row.status === filterStatus;
    return matchesText && matchesStatus;
  });

  const highRiskCount = dfmeaRows.filter((r) => r.rpn > 100).length;
  const avgRpn = Math.round(dfmeaRows.reduce((acc, r) => acc + r.rpn, 0) / (dfmeaRows.length || 1));

  const exportToCSV = () => {
    const rows = [
      ['DFMEA ID', 'System', 'Subsystem', 'Component', 'Function', 'Design Requirement', 'Potential Failure Mode', 'Potential Effect', 'Severity (S)', 'Potential Cause', 'Occurrence (O)', 'Design Controls', 'Detection (D)', 'RPN', 'Recommended Action', 'Responsible Engineer', 'Due Date', 'Status']
    ];

    dfmeaRows.forEach((r) => {
      rows.push([
        r.id,
        `"${r.system}"`,
        `"${r.subsystem}"`,
        `"${r.component}"`,
        `"${r.functionDesc}"`,
        `"${r.designRequirement}"`,
        `"${r.potentialFailureMode}"`,
        `"${r.potentialEffect}"`,
        r.severity.toString(),
        `"${r.potentialCause}"`,
        r.occurrence.toString(),
        `"${r.currentDesignControls}"`,
        r.detection.toString(),
        r.rpn.toString(),
        `"${r.recommendedDesignAction}"`,
        `"${r.responsibleEngineer}"`,
        r.dueDate,
        r.status
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'DFMEA_Design_Risk_Analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-cyan-500 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2.5 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>DFMEA Studio (Design Failure Mode & Effects Analysis)</span>
              <span className="badge-status badge-review text-[10px]">
                ASME / SAE J1739
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Identify product design risks, FEA stress failure modes, design requirements, and engineering mitigation controls before release.
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="btn-primary btn-sm flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export DFMEA CSV</span>
        </button>
      </div>

      {/* DFMEA KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Critical Design Risks (RPN &gt; 100)</span>
          <div className="text-2xl font-bold text-rose-500 font-mono">{highRiskCount} Component Risks</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Average Design RPN</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">{avgRpn} RPN</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Evaluated Components</span>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{dfmeaRows.length} Items</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Design Review Status</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">FEA Validated</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
          <input
            type="text"
            placeholder="Search Component, Failure Mode, System..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="In Review">In Review</option>
            <option value="Open">Open</option>
            <option value="Approved">Approved</option>
            <option value="Mitigated">Mitigated</option>
          </select>
        </div>
      </div>

      {/* DFMEA Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Component & System</th>
                <th>Design Requirement</th>
                <th>Potential Failure Mode</th>
                <th>Potential Effect</th>
                <th className="text-center">Sev (S)</th>
                <th className="text-center">Occ (O)</th>
                <th className="text-center">Det (D)</th>
                <th className="text-center">RPN (S×O×D)</th>
                <th>Recommended Design Action</th>
                <th>Responsible Engineer</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isHighRisk = row.rpn > 100;

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="font-bold text-cyan-500">{row.component}</div>
                      <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{row.system} &rsaquo; {row.subsystem}</div>
                    </td>
                    <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{row.designRequirement}</td>
                    <td className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{row.potentialFailureMode}</td>
                    <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{row.potentialEffect}</td>
                    <td className="text-center font-bold text-rose-500">{row.severity}</td>
                    <td className="text-center font-bold text-amber-500">{row.occurrence}</td>
                    <td className="text-center font-bold text-purple-500">{row.detection}</td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${
                        isHighRisk ? 'badge-status badge-archived' : 'badge-status badge-active'
                      }`}>
                        {row.rpn}
                      </span>
                    </td>
                    <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{row.recommendedDesignAction}</td>
                    <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{row.responsibleEngineer}</td>
                    <td className="text-center font-bold">
                      <span className={`badge-status ${
                        row.status === 'Approved' ? 'badge-active' : 'badge-review'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Error Boundary for DFMEA Manager
class DfmeaErrorBoundary extends React.Component<
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
    console.error('DFMEA Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">DFMEA Studio Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading DFMEA risk matrix.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload DFMEA Studio</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const DfmeaManager: React.FC<DfmeaManagerProps> = (props) => (
  <DfmeaErrorBoundary>
    <DfmeaManagerInternal {...props} />
  </DfmeaErrorBoundary>
);

export default DfmeaManager;

