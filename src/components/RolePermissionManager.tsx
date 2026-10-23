import React, { useState } from 'react';
import { ShieldCheck, Sliders, Save, CheckCircle2, Lock, Key, RefreshCw } from 'lucide-react';
import type { SystemRole, PermissionLevel, ModuleId, PermissionMatrix } from '../types/plm';
import { DEFAULT_PERMISSION_MATRIX } from '../utils/rbac';
import { useTheme } from '../context/ThemeContext';

interface RolePermissionManagerProps {
  permissionMatrix: PermissionMatrix;
  onUpdateMatrix: (newMatrix: PermissionMatrix) => void;
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  permissionMatrix,
  onUpdateMatrix
}) => {
  const { isDark } = useTheme();
  const [matrix, setMatrix] = useState<PermissionMatrix>(permissionMatrix);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const roles: { key: SystemRole; label: string; badge: string }[] = [
    { key: 'ADMIN', label: 'Admin Superuser', badge: 'badge-status badge-active' },
    { key: 'DESIGN_ENGINEER', label: 'Design Engineer', badge: 'badge-status badge-active' },
    { key: 'MANUFACTURING_ENGINEER', label: 'Mfg Engineer', badge: 'badge-status badge-review' },
    { key: 'QUALITY_ENGINEER', label: 'Quality Engineer', badge: 'badge-status badge-active' },
    { key: 'EMPLOYEE', label: 'Normal Employee', badge: 'badge-status badge-draft' }
  ];

  const modulesList: { id: ModuleId; label: string; category: string }[] = [
    { id: 'dashboard', label: 'Executive / Employee Dashboard', category: 'Core' },
    { id: 'products', label: 'Product Lifecycle Management', category: 'Core' },
    { id: 'cad', label: '3D CAD Vault & B-Rep Viewer', category: 'Design' },
    { id: 'bom', label: 'Multi-Level BOM Explorer', category: 'Design' },
    { id: 'capp', label: 'CAPP Process Planning & OP', category: 'Mfg' },
    { id: 'quality', label: 'Quality QMS, Inspection & CAPA', category: 'Quality' },
    { id: 'eco', label: 'Engineering Change ECR / ECO', category: 'Engineering' },
    { id: 'documents', label: 'Engineering Vault & Drawings', category: 'Documents' },
    { id: 'projects', label: 'Project Gantt Timeline', category: 'Management' },
    { id: 'reports', label: 'Reports & Analytics', category: 'Analytics' },
    { id: 'admin_users', label: 'User Account Management', category: 'Admin' },
    { id: 'admin_roles', label: 'Role & Permission Manager', category: 'Admin' },
    { id: 'admin_audit', label: 'System Audit Trail', category: 'Admin' },
    { id: 'settings', label: 'System Settings & Config', category: 'Admin' }
  ];

  const permissionOptions: PermissionLevel[] = ['NONE', 'VIEW', 'CREATE', 'EDIT', 'APPROVE', 'FULL'];

  const handleCellChange = (modId: ModuleId, role: SystemRole, level: PermissionLevel) => {
    const updated = {
      ...matrix,
      [modId]: {
        ...matrix[modId],
        [role]: level
      }
    };
    setMatrix(updated);
    onUpdateMatrix(updated);
    showToast(`Updated ${modId} permission for ${role} to ${level}`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleResetDefault = () => {
    setMatrix(DEFAULT_PERMISSION_MATRIX);
    onUpdateMatrix(DEFAULT_PERMISSION_MATRIX);
    showToast('Reset RBAC Permission Matrix to factory default security template.');
  };

  const getPermissionBadgeClass = (level: PermissionLevel) => {
    switch (level) {
      case 'FULL': return isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-purple-50 text-purple-600 border-purple-200';
      case 'APPROVE': return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'EDIT': return isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'CREATE': return isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-50 text-blue-600 border-blue-200';
      case 'VIEW': return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-600 border-amber-200';
      case 'NONE': return isDark ? 'bg-[#0D1628] text-[#64748B] border-[#243149]' : 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Notification Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-purple-500 border ${
            isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>RBAC Role & Permission Matrix Management</span>
              <span className="badge-status badge-active text-[10px]">
                ADMIN CONSOLE
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Define explicit permission levels (NONE, VIEW, CREATE, EDIT, APPROVE, FULL) for each enterprise role.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefault}
          className="btn-secondary btn-sm inline-flex items-center space-x-2 cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
          <span>Reset Default Template</span>
        </button>
      </div>

      {/* Matrix Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Module / Feature Area</th>
                {roles.map((r) => (
                  <th key={r.key} className="text-center">
                    <span className={r.badge}>
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modulesList.map((mod) => (
                <tr key={mod.id}>
                  <td>
                    <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{mod.label}</div>
                    <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{mod.category} Category &bull; id: <span className="font-mono text-cyan-500">{mod.id}</span></div>
                  </td>

                  {roles.map((r) => {
                    const currentLevel = matrix[mod.id]?.[r.key] || 'NONE';
                    const isAdmin = r.key === 'ADMIN';

                    return (
                      <td key={r.key} className="text-center">
                        {isAdmin ? (
                          <span className="badge-status badge-active text-[11px] inline-block font-mono">
                            FULL (Locked)
                          </span>
                        ) : (
                          <select
                            value={currentLevel}
                            onChange={(e) => handleCellChange(mod.id, r.key, e.target.value as PermissionLevel)}
                            className={`border font-bold text-[11px] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer ${getPermissionBadgeClass(currentLevel)}`}
                          >
                            {permissionOptions.map((opt) => (
                              <option key={opt} value={opt} className={isDark ? 'bg-[#111B2E] text-[#F1F5F9]' : 'bg-white text-[#172033]'}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

