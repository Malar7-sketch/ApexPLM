import React from 'react';
import { 
  Box, 
  GitCommit, 
  GitPullRequest, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Cpu, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileText, 
  TrendingUp, 
  ArrowRight, 
  ShieldAlert, 
  Plus, 
  Server, 
  UserCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { PartItem, ECR, ECN, StageGate, AuditLog, QualityNCR, Project } from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';

interface AdminDashboardProps {
  parts: PartItem[];
  projects?: Project[];
  ecrs: ECR[];
  ecns: ECN[];
  ncrs: QualityNCR[];
  users: UserAccount[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: string, filterStage?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  parts,
  projects = [],
  ecrs,
  ecns,
  ncrs,
  users,
  auditLogs,
  onNavigateTab
}) => {
  const { isDark } = useTheme();
  const activeProjectsCount = projects.length;
  const totalCadModels = 6;
  const activeBoms = 6;
  const pendingEcosCount = 1;
  const openQualityIssuesCount = 1;
  const mfgProcessesCount = 12;
  const activeEmployeesCount = users.filter((u) => u.status === 'Active').length || 5;

  const lifecycleBreakdown = {
    concept: 0,
    design: 1,
    review: 2,
    prototype: 3,
    manufacturing: 2,
    quality: 1,
    released: 3
  };

  const workQueueItems = [
    { type: 'ECO', item: 'ECN-2026-014', owner: 'Design Team', due: 'Today', status: 'Review', actionText: 'Open', linkTab: 'eco' },
    { type: 'CAD', item: 'ASM-EV-9000', owner: 'Alex Rivera', due: 'Today', status: 'Approval', actionText: 'Review', linkTab: 'cad' },
    { type: 'NCR', item: 'NCR-026', owner: 'Dr. Elena Rostova', due: 'Tomorrow', status: 'Open', actionText: 'View', linkTab: 'quality' },
    { type: 'BOM', item: 'BOM-EV-102', owner: 'Engineering Team', due: '24 Aug', status: 'Modified', actionText: 'Review', linkTab: 'bom' }
  ];

  const recentActivities = [
    { avatar: '👨‍💻', user: 'Alex Rivera', action: 'uploaded CAD File', object: 'ASM-EV-9000.SLDASM', timestamp: '10 mins ago' },
    { avatar: '👷‍♂️', user: 'Marcus Vance', action: 'updated manufacturing routing', object: 'OP10 CNC Turning', timestamp: '25 mins ago' },
    { avatar: '👩‍🔬', user: 'Dr. Elena Rostova', action: 'created Quality Report', object: 'NCR-026 CMM Out-of-Tolerance', timestamp: '1 hour ago' },
    { avatar: '🛡️', user: 'Sarah Connor', action: 'approved ECN Notice', object: 'ECO-014 Frame Radius', timestamp: '2 hours ago' },
    { avatar: '👨‍💻', user: 'Alex Rivera', action: 'changed BOM Revision', object: 'BOM-EV-102 (Rev A.3 → A.4)', timestamp: '3 hours ago' }
  ];

  const pendingApprovalsList = [
    { title: 'ECO-2026-014', desc: 'Electric Scooter Frame Modification', stage: 'Engineering Review', type: 'ECO Approval', color: 'text-amber-500' },
    { title: 'BOM-EV-102', desc: 'Battery Assembly BOM Structure', stage: 'Manufacturing Review', type: 'BOM Approval', color: 'text-cyan-500' },
    { title: 'CAD-EV-9000', desc: 'Planetary Sun Gear STEP Revision A.4', stage: 'CAD Signoff', type: 'CAD Approval', color: 'text-purple-500' }
  ];

  const systemHealthServices = [
    { service: 'Authentication SSO', status: 'Operational' },
    { service: 'CAD Vault Repository', status: 'Operational' },
    { service: 'BOM Engine', status: 'Operational' },
    { service: 'Workflow Engine', status: 'Operational' },
    { service: 'Document Service', status: 'Operational' },
    { service: 'Notification Service', status: 'Operational' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. ADMIN HERO HEADER */}
      <div className={`rounded-[18px] p-6 border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${
        isDark 
          ? 'bg-[#111B2E] border-[#243149]' 
          : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isDark 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              SYSTEM ADMINISTRATOR
            </span>
            <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Enterprise Governance Center
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            ApexPLM Administration & Governance
          </h1>
          <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Centralized orchestration of CAD vault, multi-level BOMs, ECR/ECO change pipelines, and ISO 9001 compliance.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs z-10">
          <button
            onClick={() => onNavigateTab('admin_users')}
            className="btn-primary"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </button>
          <button
            onClick={() => onNavigateTab('admin_roles')}
            className="btn-secondary"
          >
            <span>RBAC Matrix</span>
          </button>
        </div>
      </div>

      {/* 2. ADMIN QUICK ACTIONS BAR */}
      <div className={`rounded-xl p-3 border shadow-sm flex items-center space-x-2 overflow-x-auto ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <span className={`text-[11px] font-semibold uppercase px-2 shrink-0 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
          Quick Actions:
        </span>
        <button
          onClick={() => onNavigateTab('products')}
          className="btn-secondary btn-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Product</span>
        </button>

        <button
          onClick={() => onNavigateTab('eco')}
          className="btn-secondary btn-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create ECO</span>
        </button>

        <button
          onClick={() => onNavigateTab('admin_users')}
          className="btn-secondary btn-sm shrink-0"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Add Employee</span>
        </button>

        <button
          onClick={() => onNavigateTab('cad')}
          className="btn-secondary btn-sm shrink-0"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Upload CAD</span>
        </button>

        <button
          onClick={() => onNavigateTab('bom')}
          className="btn-secondary btn-sm shrink-0"
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Create BOM</span>
        </button>

        <button
          onClick={() => onNavigateTab('documents')}
          className="btn-secondary btn-sm shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Create Document</span>
        </button>
      </div>

      {/* 3. 8 KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* Products */}
        <div 
          onClick={() => onNavigateTab('products')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-cyan-500' 
              : 'bg-white border-[#E2E8F0] hover:border-cyan-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Products</span>
            <Box className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>6</div>
          <div className="text-[11px] text-cyan-500 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Master Items</span>
          </div>
        </div>

        {/* Projects */}
        <div 
          onClick={() => onNavigateTab('projects')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-purple-500' 
              : 'bg-white border-[#E2E8F0] hover:border-purple-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Projects</span>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{activeProjectsCount}</div>
          <div className="text-[11px] text-purple-500 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Workspaces</span>
          </div>
        </div>

        {/* CAD Documents */}
        <div 
          onClick={() => onNavigateTab('cad')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-blue-500' 
              : 'bg-white border-[#E2E8F0] hover:border-blue-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>CAD Documents</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{totalCadModels}</div>
          <div className="text-[11px] text-blue-500 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Controlled CAD Files</span>
          </div>
        </div>

        {/* BOMs */}
        <div 
          onClick={() => onNavigateTab('bom')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-emerald-500' 
              : 'bg-white border-[#E2E8F0] hover:border-emerald-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>BOMs</span>
            <GitCommit className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{activeBoms}</div>
          <div className="text-[11px] text-emerald-500 font-medium flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Active Structures</span>
          </div>
        </div>

        {/* Pending ECOs */}
        <div 
          onClick={() => onNavigateTab('eco')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-amber-500' 
              : 'bg-white border-[#E2E8F0] hover:border-amber-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Pending ECOs</span>
            <GitPullRequest className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{pendingEcosCount}</div>
          <div className="text-[11px] text-amber-500 font-medium flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Awaiting Review</span>
          </div>
        </div>

        {/* Quality Issues */}
        <div 
          onClick={() => onNavigateTab('quality')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-rose-500' 
              : 'bg-white border-[#E2E8F0] hover:border-rose-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Quality Issues</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{openQualityIssuesCount}</div>
          <div className="text-[11px] text-rose-500 font-medium flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Open NCR / CAPA</span>
          </div>
        </div>

        {/* Manufacturing Processes */}
        <div 
          onClick={() => onNavigateTab('capp')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-cyan-500' 
              : 'bg-white border-[#E2E8F0] hover:border-cyan-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Mfg Processes</span>
            <Cpu className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{mfgProcessesCount}</div>
          <div className="text-[11px] text-cyan-500 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Routings</span>
          </div>
        </div>

        {/* Employees */}
        <div 
          onClick={() => onNavigateTab('admin_users')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-pink-500' 
              : 'bg-white border-[#E2E8F0] hover:border-pink-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Employees</span>
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{activeEmployeesCount}</div>
          <div className="text-[11px] text-pink-500 font-medium flex items-center space-x-1">
            <UserCheck className="w-3 h-3" />
            <span>Active Accounts</span>
          </div>
        </div>
      </div>

      {/* 4. PRODUCT LIFECYCLE OVERVIEW */}
      <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Layers className="w-4.5 h-4.5 text-cyan-500" />
              <span>Product Lifecycle Distribution</span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Distribution of mechanical products across stage gates.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('products')}
            className="text-xs text-cyan-500 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View Product Master</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 text-center">
          {Object.entries(lifecycleBreakdown).map(([stage, count]) => (
            <div 
              key={stage}
              onClick={() => onNavigateTab('products', stage)}
              className={`p-3 rounded-xl border space-y-1 cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500' 
                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600'
              }`}
            >
              <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                {stage}
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. ADMIN WORK QUEUE TABLE */}
      <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
          <h2 className={`text-base font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            <Clock className="w-4.5 h-4.5 text-amber-500" />
            <span>Administrative Work Queue</span>
          </h2>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
          }`}>
            ACTIONABLE
          </span>
        </div>

        <div className="plm-table-container">
          <table className="plm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item Number</th>
                <th>Owner</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {workQueueItems.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className="badge-status badge-progress font-mono">
                      {row.type}
                    </span>
                  </td>
                  <td className="font-semibold">{row.item}</td>
                  <td>{row.owner}</td>
                  <td>{row.due}</td>
                  <td>
                    <span className="badge-status badge-pending">
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => onNavigateTab(row.linkTab)}
                      className="btn-secondary btn-sm"
                    >
                      {row.actionText}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY + PENDING APPROVALS + SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>Recent Activity</span>
            </h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              REAL-TIME
            </span>
          </div>

          <div className="space-y-2">
            {recentActivities.map((act, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border flex items-start space-x-3 ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <span className={`text-lg p-1.5 rounded-lg border shrink-0 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>{act.avatar}</span>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="text-xs">
                    <strong className={isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}>{act.user}</strong>{' '}
                    <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{act.action}</span>
                  </div>
                  <div className="text-cyan-500 font-medium text-[11px] truncate">{act.object}</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{act.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Approvals</span>
            </h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              3 QUEUED
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingApprovalsList.map((app, i) => (
              <div 
                key={i} 
                className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${app.color}`}>{app.title}</span>
                  <span className="badge-status badge-draft text-[10px]">
                    {app.type}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{app.desc}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/30">
                  <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{app.stage}</span>
                  <button
                    onClick={() => onNavigateTab('eco')}
                    className="btn-primary btn-sm"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Server className="w-4 h-4 text-emerald-500" />
              <span>System Health</span>
            </h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider text-emerald-500`}>
              OPERATIONAL
            </span>
          </div>

          <div className="space-y-2">
            {systemHealthServices.map((sys, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <span className={`text-xs font-medium ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{sys.service}</span>
                <div className="flex items-center space-x-1.5 text-emerald-500 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{sys.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
