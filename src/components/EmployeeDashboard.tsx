import React from 'react';
import { 
  Box, 
  CheckSquare, 
  Briefcase, 
  FileText, 
  Bell, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Wind, 
  Code, 
  Cpu, 
  Wrench, 
  ArrowRight,
  UserCheck,
  Gauge,
  Package,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import type { UserAccount } from '../data/mockUsers';
import type { PartItem, Project, EngineeringDocument, UserNotification, ECR, ECN } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface EmployeeDashboardProps {
  user: UserAccount;
  parts: PartItem[];
  projects: Project[];
  documents: EngineeringDocument[];
  notifications: UserNotification[];
  ecrs?: ECR[];
  ecns?: ECN[];
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  user,
  parts,
  projects,
  documents,
  notifications,
  ecrs = [],
  ecns = [],
  onNavigateTab
}) => {
  const { isDark } = useTheme();
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const pendingApprovalsCount = ecns.filter(e => e.pipelineStage !== 'Released').length + ecrs.filter(e => e.status === 'In Review' || e.status === 'Proposed').length;
  const actionItemsCount = unreadNotifs + pendingApprovalsCount + parts.filter(p => p.isCheckedOut).length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. ENGINEERING WORKSPACE HERO HEADER (Height: 125-140px, Padding: 24-28px) */}
      <div className={`rounded-[18px] p-6 border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors ${
        isDark 
          ? 'bg-[#111B2E] border-[#243149]' 
          : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-5 z-10">
          <div className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl shrink-0 shadow-sm ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
          }`}>
            {user.avatar || '👨‍💻'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                {user.systemRole.replace('_', ' ')}
              </span>
              <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {user.employeeId || 'EMP-10482'}
              </span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Welcome, {user.name}
            </h1>
            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              {user.role} &bull; {user.department || 'Product Design & CAD Engineering'}
            </p>
          </div>
        </div>

        {/* Workspace Quick Counts */}
        <div className="flex items-center space-x-3 text-xs z-10">
          <div className={`p-3 rounded-xl border text-center min-w-[100px] ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className={`text-[10px] uppercase font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Unread Alerts
            </div>
            <div className="text-xl font-bold text-amber-500">{unreadNotifs}</div>
          </div>

          <div className={`p-3 rounded-xl border text-center min-w-[100px] ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className={`text-[10px] uppercase font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Action Items
            </div>
            <div className="text-xl font-bold text-cyan-500">{actionItemsCount} Active</div>
          </div>
        </div>
      </div>

      {/* 2. RESPONSIVE KPI CARDS (Height: 105-115px, Padding: 16-18px, KPI Number: 26-30px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* My Projects */}
        <div 
          onClick={() => onNavigateTab('projects')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-cyan-500' 
              : 'bg-white border-[#E2E8F0] hover:border-cyan-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>My Projects</span>
            <Briefcase className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {projects.length}
          </div>
          <div className="text-[11px] text-cyan-500 font-medium">Assigned Workspaces</div>
        </div>

        {/* My Tasks */}
        <div 
          onClick={() => onNavigateTab('projects')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-purple-500' 
              : 'bg-white border-[#E2E8F0] hover:border-purple-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>My Tasks</span>
            <CheckSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)}
          </div>
          <div className="text-[11px] text-purple-500 font-medium">Assigned Milestones</div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => onNavigateTab('eco')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-amber-500' 
              : 'bg-white border-[#E2E8F0] hover:border-amber-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-amber-500 font-medium">ECN Stage Signoff</div>
        </div>

        {/* Recent Documents */}
        <div 
          onClick={() => onNavigateTab('documents')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-emerald-500' 
              : 'bg-white border-[#E2E8F0] hover:border-emerald-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Recent Documents</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {documents.length}
          </div>
          <div className="text-[11px] text-emerald-500 font-medium">Engineering Vault</div>
        </div>

        {/* Assigned Products */}
        <div 
          onClick={() => onNavigateTab('products')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-cyan-500' 
              : 'bg-white border-[#E2E8F0] hover:border-cyan-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Assigned Products</span>
            <Box className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {parts.length}
          </div>
          <div className="text-[11px] text-cyan-500 font-medium">Master Assemblies</div>
        </div>

        {/* Notifications */}
        <div 
          onClick={() => onNavigateTab('notifications')}
          className={`p-4 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between h-[110px] ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149] hover:border-rose-500' 
              : 'bg-white border-[#E2E8F0] hover:border-rose-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Notifications</span>
            <Bell className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-[28px] font-bold leading-none ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {unreadNotifs}
          </div>
          <div className="text-[11px] text-rose-500 font-medium">Unread Alerts</div>
        </div>
      </div>

      {/* 3. ENGINEERING SHORTCUTS (Equal height: 120-135px, Icon: 20-24px, Title: 14-16px, Description: 11-12px) */}
      <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
          <h3 className={`text-base font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            <Box className="w-4.5 h-4.5 text-cyan-500" />
            <span>Engineering & CAD Shortcuts</span>
          </h3>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
          }`}>
            QUICK ACCESS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigateTab('cad')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[125px] transition-all cursor-pointer group ${
              isDark 
                ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500 hover:bg-[#151F32]' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Box className="w-5 h-5 text-cyan-500 group-hover:scale-105 transition-transform" />
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                CAD Vault & 3D Viewer
              </div>
              <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Inspect 3D assemblies, check-out STEP/IGES, and manage revisions.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('bom')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[125px] transition-all cursor-pointer group ${
              isDark 
                ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500 hover:bg-[#151F32]' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-emerald-500 group-hover:scale-105 transition-transform" />
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                BOM Explorer
              </div>
              <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Hierarchical multi-level EBOM/MBOM, part costs, and weights.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('eco')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[125px] transition-all cursor-pointer group ${
              isDark 
                ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500 hover:bg-[#151F32]' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-amber-500 group-hover:scale-105 transition-transform" />
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Engineering Changes
              </div>
              <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Submit ECRs, review ECN workflows, and track drawing markups.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('cae')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[125px] transition-all cursor-pointer group ${
              isDark 
                ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500 hover:bg-[#151F32]' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <Flame className="w-5 h-5 text-rose-500 group-hover:scale-105 transition-transform" />
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                CAE Stress Solver
              </div>
              <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Run FEA von Mises stress & Factor of Safety simulation.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. ASSIGNED ACTION ITEMS & RECENT ENGINEERING DOCUMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Action Items */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <CheckSquare className="w-4 h-4 text-cyan-500" />
              <span>Assigned Action Items</span>
            </h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              ACTIVE TASKS
            </span>
          </div>

          {(() => {
            const dynamicActionItems: Array<{ id: string; title: string; subtitle: string; status: string; badgeClass: string }> = [];

            // 1. Pending ECRs
            ecrs.filter(e => e.status === 'In Review' || e.status === 'Proposed').forEach(ecr => {
              dynamicActionItems.push({
                id: `ecr-${ecr.id}`,
                title: `Engineering Review: ${ecr.id} - ${ecr.title}`,
                subtitle: `Target: ${ecr.targetProductId || 'Product'} • Severity: ${ecr.severity}`,
                status: ecr.status,
                badgeClass: 'badge-progress'
              });
            });

            // 2. Parts checked out
            parts.filter(p => p.isCheckedOut).forEach(part => {
              dynamicActionItems.push({
                id: `part-${part.id}`,
                title: `Checked Out CAD: ${part.partNumber} - ${part.name}`,
                subtitle: `Rev ${part.currentRev} • Vault Lock Active`,
                status: 'In Progress',
                badgeClass: 'badge-progress'
              });
            });

            // 3. Uncompleted project tasks
            projects.forEach(proj => {
              (proj.tasks || []).filter(t => t.status === 'In Progress').forEach(task => {
                dynamicActionItems.push({
                  id: `task-${task.id}`,
                  title: `${task.taskName} (${proj.code})`,
                  subtitle: `Project: ${proj.name} • Due: ${task.endDate}`,
                  status: task.status,
                  badgeClass: 'badge-progress'
                });
              });
            });

            if (dynamicActionItems.length === 0) {
              return (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl space-y-1">
                  <div className="font-semibold text-slate-300">No pending action items assigned</div>
                  <div>All engineering tasks, reviews, and signoffs are up to date.</div>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {dynamicActionItems.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className={`text-xs font-semibold truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        {item.title}
                      </div>
                      <div className={`text-[11px] truncate ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        {item.subtitle}
                      </div>
                    </div>
                    <span className={`badge-status ${item.badgeClass} shrink-0`}>{item.status}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Recent Engineering Documents */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-3.5 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Recent Engineering Documents</span>
            </h3>
            <button
              onClick={() => onNavigateTab('documents')}
              className="text-[11px] text-cyan-500 hover:underline cursor-pointer font-medium"
            >
              Open Document Vault
            </button>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No engineering documents uploaded yet.
              </div>
            ) : (
              documents.slice(0, 3).map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => onNavigateTab('documents')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isDark 
                      ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-600'
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className={`text-xs font-semibold truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                      {doc.title}
                    </div>
                    <div className={`text-[11px] truncate ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                      Doc: {doc.docNumber} &bull; Rev {doc.revision} &bull; {doc.type}
                    </div>
                  </div>
                  <span className="badge-status badge-approved shrink-0">
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

