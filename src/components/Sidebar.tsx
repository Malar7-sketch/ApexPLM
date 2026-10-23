import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Box, 
  Briefcase, 
  GitCommit, 
  GitPullRequest, 
  FileText, 
  Cpu, 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  Users, 
  Sliders, 
  Award, 
  Activity, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Lock,
  Wrench,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import type { SystemRole, PermissionMatrix, ModuleId } from '../types/plm';
import { hasPermission } from '../utils/rbac';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: SystemRole;
  permissionMatrix: PermissionMatrix;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavGroup {
  name: string;
  items: {
    id: string;
    moduleId: ModuleId | string;
    label: string;
    icon: any;
    adminOnly?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  permissionMatrix,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse
}) => {
  const { isDark } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const navGroups: NavGroup[] = [
    {
      name: 'PROJECTS',
      items: [
        {
          id: userRole === 'ADMIN' ? 'admin_dashboard' : 'employee_dashboard',
          moduleId: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        },
        { id: 'projects', moduleId: 'projects', label: 'Projects', icon: Briefcase }
      ]
    },
    {
      name: 'ENGINEERING',
      items: [
        { id: 'products', moduleId: 'products', label: 'Product Master', icon: Box },
        { id: 'cad', moduleId: 'cad', label: 'CAD Vault', icon: Box },
        { id: 'bom', moduleId: 'bom', label: 'BOM Explorer', icon: GitCommit },
        { id: 'documents', moduleId: 'documents', label: 'Engineering Documents', icon: FileText },
        { id: 'eco', moduleId: 'eco', label: 'Engineering Change', icon: GitPullRequest },
        { id: 'dfmea', moduleId: 'cad', label: 'DFMEA', icon: ShieldAlert },
        { id: 'gates', moduleId: 'projects', label: 'Design Review', icon: Award }
      ]
    },
    {
      name: 'MANUFACTURING',
      items: [
        { id: 'capp', moduleId: 'capp', label: 'CAPP / Process Planning', icon: Cpu },
        { id: 'production', moduleId: 'capp', label: 'Manufacturing', icon: Gauge },
        { id: 'inventory', moduleId: 'inventory', label: 'Inventory & Warehouse', icon: Package }
      ]
    },
    {
      name: 'QUALITY',
      items: [
        { id: 'quality', moduleId: 'quality', label: 'Quality Management', icon: ShieldCheck },
        { id: 'pfmea', moduleId: 'capp', label: 'PFMEA', icon: Wrench },
        { id: 'inspection', moduleId: 'quality', label: 'Inspection', icon: ShieldCheck },
        { id: 'ncr_capa', moduleId: 'quality', label: 'NCR / CAPA', icon: AlertCircle },
        { id: 'final_approval', moduleId: 'quality', label: 'Final Approval', icon: Award }
      ]
    },
    {
      name: 'ANALYTICS',
      items: [
        { id: 'reports', moduleId: 'reports', label: 'Reports & Analytics', icon: FileSpreadsheet }
      ]
    },
    {
      name: 'ADMINISTRATION',
      items: [
        { id: 'gates_admin', moduleId: 'projects', label: 'Workflow Configuration', icon: Award },
        { id: 'admin_users', moduleId: 'admin_users', label: 'Users & Roles', icon: Users, adminOnly: true },
        { id: 'admin_audit', moduleId: 'admin_audit', label: 'Audit Trail', icon: Activity }
      ]
    }
  ];

  return (
    <aside className={`border-r flex flex-col justify-between shrink-0 font-sans transition-all duration-200 z-20 ${
      isCollapsed ? 'w-[72px]' : 'w-[240px]'
    } ${
      isDark 
        ? 'bg-[#0D1628] border-[#243149] text-[#CBD5E1]' 
        : 'bg-white border-[#E2E8F0] text-[#475569]'
    }`}>
      {/* Top Workspace Indicator / Collapse Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2 border-slate-700/30">
        {!isCollapsed && (
          <div className="truncate">
            <div className={`text-[10px] uppercase font-bold tracking-wider truncate ${
              isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'
            }`}>
              {userRole === 'ADMIN' ? 'Admin Console' : `${userRole.replace('_ENGINEER', '')} WORKSPACE`}
            </div>
            <div className={`text-[11px] font-semibold truncate ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              {userRole}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark 
              ? 'text-[#94A3B8] hover:text-white hover:bg-[#151F32]' 
              : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9]'
          } ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        <nav className="space-y-3">
          {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.name];

            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly && userRole !== 'ADMIN') return false;
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.name} className="space-y-0.5">
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.name)}
                    className={`w-full flex items-center justify-between text-[10px] uppercase font-bold tracking-wider px-2 py-1 transition-colors cursor-pointer ${
                      isDark ? 'text-[#64748B] hover:text-[#94A3B8]' : 'text-[#94A3B8] hover:text-[#475569]'
                    }`}
                  >
                    <span>{group.name}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    ) : (
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    )}
                  </button>
                )}

                {(!isGroupCollapsed || isCollapsed) && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id || 
                        (item.id === 'employee_dashboard' && activeTab === 'dashboard') ||
                        (item.id === 'admin_dashboard' && activeTab === 'dashboard') ||
                        (item.id === 'eco' && activeTab === 'ecn') ||
                        (item.id === 'documents' && activeTab === 'docs') ||
                        (item.id === 'gates' && (activeTab === 'gates_admin' || activeTab === 'final_approval'));
                      const canAccess = userRole === 'ADMIN' || hasPermission(userRole, item.moduleId, 'VIEW', permissionMatrix);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onTabChange(item.id)}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full h-10 flex items-center rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                            isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
                          } ${
                            isActive
                              ? isDark
                                ? 'bg-cyan-500/10 text-cyan-400 font-semibold border-l-2 border-cyan-400 shadow-sm'
                                : 'bg-cyan-50 text-cyan-700 font-semibold border-l-2 border-cyan-600 shadow-sm'
                              : canAccess
                              ? isDark
                                ? 'text-[#CBD5E1] hover:text-white hover:bg-[#151F32]'
                                : 'text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9]'
                              : isDark
                              ? 'text-[#475569] opacity-60 hover:bg-[#0B1220]'
                              : 'text-[#94A3B8] opacity-60 hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className={`flex items-center space-x-2.5 truncate ${isCollapsed ? 'justify-center' : ''}`}>
                            <Icon className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                              isActive 
                                ? isDark ? 'text-cyan-400' : 'text-cyan-600' 
                                : canAccess 
                                ? isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' 
                                : isDark ? 'text-[#475569]' : 'text-[#CBD5E1]'
                            }`} />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!isCollapsed && !canAccess && (
                            <span title="Restricted Access" className="shrink-0">
                              <Lock className="w-3 h-3 opacity-60 text-amber-500" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ISO 9001 Compliance Footer Badge */}
      {!isCollapsed ? (
        <div className={`p-3 m-2 rounded-xl border text-[11px] space-y-1 transition-colors ${
          isDark 
            ? 'bg-[#0B1220] border-[#243149] text-[#94A3B8]' 
            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
        }`}>
          <div className={`flex items-center justify-between font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            <span>ISO 9001 Certified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-[10px] opacity-75">Traceable Mechanical PLM</p>
        </div>
      ) : (
        <div className="p-3 text-center" title="ISO 9001 Certified Compliance">
          <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

