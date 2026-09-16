import React, { useState } from 'react';
import { ShieldCheck, Search, Download, Filter, Clock, Activity, FileSpreadsheet, Lock } from 'lucide-react';
import type { AuditLog } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface AuditTrailPanelProps {
  auditLogs: AuditLog[];
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({ auditLogs }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'SECURITY', 'CAD', 'BOM', 'ECR/ECN', 'STAGE-GATE', 'DOCUMENT', 'QUALITY', 'SYSTEM', 'MANUFACTURING'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,User,Persona,Action,Category,TargetId,Details']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.timestamp}","${l.user}","${l.persona}","${l.action}","${l.category}","${l.targetId}","${l.details.replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ApexPLM_Audit_Log_${Date.now()}.csv`);
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
          <div className={`p-3 rounded-2xl text-purple-500 border ${
            isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>ISO 9001 Compliance Audit Trail & Event Stream</span>
              <span className="badge-status badge-active text-[10px]">
                READ-ONLY IMMUTABLE LOG
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Comprehensive security audit logging of CAD check-ins, BOM modifications, ECO signoffs, and user sessions.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className={`rounded-xl p-4 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
          <input
            type="text"
            placeholder="Search User, Action, Target ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="plm-select py-1.5 text-xs"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User & Persona</th>
                <th>Action Performed</th>
                <th>Category</th>
                <th>Target Object ID</th>
                <th>IP / Session</th>
                <th className="text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className={`font-mono text-[11px] whitespace-nowrap ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    {log.timestamp}
                  </td>
                  <td>
                    <div className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{log.user}</div>
                    <div className="text-[10px] text-cyan-500 font-mono uppercase">{log.persona}</div>
                  </td>
                  <td className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{log.action}</td>
                  <td>
                    <span className="badge-status badge-active text-[10px]">
                      {log.category}
                    </span>
                  </td>
                  <td className="text-cyan-500 font-bold font-mono">{log.targetId}</td>
                  <td className={`text-[11px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>192.168.1.104 (TLSv1.3)</td>
                  <td className="text-center">
                    <span className="badge-status badge-active text-[10px]">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

