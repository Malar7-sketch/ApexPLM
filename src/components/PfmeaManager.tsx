import React, { useState } from 'react';
import { 
  Wrench, 
  Cpu, 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Activity, 
  Gauge 
} from 'lucide-react';
import type { PfmeaRow } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface PfmeaManagerProps {
  pfmeaRows: PfmeaRow[];
  onAddPfmea?: (row: PfmeaRow) => void;
}

export const PfmeaManager: React.FC<PfmeaManagerProps> = ({ pfmeaRows }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  const filteredRows = pfmeaRows.filter((row) => {
    const matchesText = 
      row.processStep.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.potentialProcessFailure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.productionEngineer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMachine = filterMachine === 'all' || row.machine.includes(filterMachine);
    return matchesText && matchesMachine;
  });

  const highRiskCount = pfmeaRows.filter((r) => r.rpn > 80).length;
  const avgRpn = Math.round(pfmeaRows.reduce((acc, r) => acc + r.rpn, 0) / (pfmeaRows.length || 1));

  const exportToCSV = () => {
    const rows = [
      ['PFMEA ID', 'Op Number', 'Process Step', 'Machine', 'Tool', 'Fixture', 'Operator Role', 'Potential Process Failure', 'Effect', 'Severity (S)', 'Cause', 'Occurrence (O)', 'Process Controls', 'Detection (D)', 'RPN', 'Corrective Action', 'Production Engineer', 'Due Date', 'Status']
    ];

    pfmeaRows.forEach((r) => {
      rows.push([
        r.id,
        r.opNumber.toString(),
        `"${r.processStep}"`,
        `"${r.machine}"`,
        `"${r.tool}"`,
        `"${r.fixture}"`,
        `"${r.operatorRole}"`,
        `"${r.potentialProcessFailure}"`,
        `"${r.effect}"`,
        r.severity.toString(),
        `"${r.cause}"`,
        r.occurrence.toString(),
        `"${r.processControls}"`,
        r.detection.toString(),
        r.rpn.toString(),
        `"${r.correctiveAction}"`,
        `"${r.productionEngineer}"`,
        r.dueDate,
        r.status
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PFMEA_Manufacturing_Process_Risk_Analysis.csv');
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
          <div className={`p-3 rounded-2xl text-amber-500 border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}>
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2.5 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>PFMEA Studio (Process Failure Mode & Effects Analysis)</span>
              <span className="badge-status badge-active text-[10px]">
                AIAG-VDA Process Standard
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Identify manufacturing operation risks, machine tool wear, tooling fixtures, operator error, and process Cpk capability controls.
            </p>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="btn-primary btn-sm flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export PFMEA CSV</span>
        </button>
      </div>

      {/* PFMEA KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>High Risk Operations (RPN &gt; 80)</span>
          <div className="text-2xl font-bold text-amber-500 font-mono">{highRiskCount} Operations</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Average Process RPN</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">{avgRpn} RPN</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Process Capability (Cpk)</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">1.48 Cpk</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block font-semibold mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Open Process Corrective Actions</span>
          <div className="text-2xl font-bold text-purple-500 font-mono">{pfmeaRows.filter((r) => r.status === 'Action Pending').length} Actions</div>
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
            placeholder="Search Process Step, Machine, Failure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Filter Machine:</span>
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="all">All Shop Floor Machines</option>
            <option value="SIP">SIP Jig Borer</option>
            <option value="Mazak">Mazak 5-Axis CNC</option>
          </select>
        </div>
      </div>

      {/* PFMEA Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Op # & Process Step</th>
                <th>Machine & Fixture</th>
                <th>Cutting Tool</th>
                <th>Potential Process Failure</th>
                <th className="text-center">Sev (S)</th>
                <th className="text-center">Occ (O)</th>
                <th className="text-center">Det (D)</th>
                <th className="text-center">RPN (S×O×D)</th>
                <th>Corrective Action</th>
                <th>Production Engineer</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isHighRisk = row.rpn > 80;

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="font-mono font-bold text-amber-500">Op {row.opNumber}</div>
                      <div className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{row.processStep}</div>
                    </td>
                    <td>
                      <div className={`font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{row.machine}</div>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Fixture: {row.fixture}</div>
                    </td>
                    <td className="font-mono text-cyan-500 font-semibold">{row.tool}</td>
                    <td className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{row.potentialProcessFailure}</td>
                    <td className="text-center font-bold text-rose-500">{row.severity}</td>
                    <td className="text-center font-bold text-amber-500">{row.occurrence}</td>
                    <td className="text-center font-bold text-purple-500">{row.detection}</td>
                    <td className="text-center">
                      <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${
                        isHighRisk ? 'badge-status badge-review' : 'badge-status badge-active'
                      }`}>
                        {row.rpn}
                      </span>
                    </td>
                    <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{row.correctiveAction}</td>
                    <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{row.productionEngineer}</td>
                    <td className="text-center font-bold">
                      <span className={`badge-status ${
                        row.status === 'Mitigated' ? 'badge-active' : 'badge-review'
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

