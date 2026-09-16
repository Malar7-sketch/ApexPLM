import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Key, 
  Lock, 
  Unlock, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ShieldAlert,
  X,
  Eye,
  EyeOff,
  Building2,
  Mail,
  Shield,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { MOCK_USERS, type UserAccount } from '../data/mockUsers';
import type { SystemRole, UserRole, UserPersona } from '../types/plm';
import { useTheme } from '../context/ThemeContext';
import { usersApi } from '../services/api';


export interface AdminUserPanelProps {
  users?: UserAccount[];
  setUsers?: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser?: UserAccount | null;
  onUpdateCurrentUser?: (user: UserAccount) => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

// Role configurations and exact prefix mapping specified in requirements
export const ROLE_CONFIGS: {
  roleName: string;
  prefix: string;
  systemRole: SystemRole;
  department: string;
  roleId: UserRole;
  personaKey: UserPersona;
  badgeClass: string;
}[] = [
  {
    roleName: 'Lead Design Engineer',
    prefix: 'EMP-LDE',
    systemRole: 'DESIGN_ENGINEER',
    department: 'Drivetrain & Mechanical Engineering',
    roleId: 'design',
    personaKey: 'design',
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
  },
  {
    roleName: 'Mechanical Engineer',
    prefix: 'EMP-ME',
    systemRole: 'DESIGN_ENGINEER',
    department: 'Structural Analysis & FEA',
    roleId: 'design',
    personaKey: 'design',
    badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30'
  },
  {
    roleName: 'Manufacturing Engineer',
    prefix: 'EMP-MFG',
    systemRole: 'MANUFACTURING_ENGINEER',
    department: 'Tooling & CAPP Process Planning',
    roleId: 'mfg',
    personaKey: 'mfg',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  {
    roleName: 'Quality Engineer',
    prefix: 'EMP-QE',
    systemRole: 'QUALITY_ENGINEER',
    department: 'Quality Assurance & QMS Compliance',
    roleId: 'quality',
    personaKey: 'quality',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  {
    roleName: 'PLM Administrator',
    prefix: 'EMP-ADM',
    systemRole: 'ADMIN',
    department: 'Global IT & Enterprise Security',
    roleId: 'admin',
    personaKey: 'admin',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  },
  {
    roleName: 'Senior Project Manager',
    prefix: 'EMP-PM',
    systemRole: 'ADMIN',
    department: 'Program Management Office',
    roleId: 'pm',
    personaKey: 'pm',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
  },
  {
    roleName: 'CAD / System Engineer',
    prefix: 'EMP-CAD',
    systemRole: 'DESIGN_ENGINEER',
    department: 'CAD Vault & PLM Integrations',
    roleId: 'design',
    personaKey: 'design',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  },
  {
    roleName: 'Assembly Operations Specialist',
    prefix: 'EMP-OPS',
    systemRole: 'EMPLOYEE',
    department: 'Assembly Line & Workstation Operations',
    roleId: 'viewer',
    personaKey: 'pm',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  }
];

// Helper: Auto-generate unique Employee ID based on role prefix, never duplicating or reusing
export function generateNextEmployeeId(roleName: string, allCurrentUsers: UserAccount[]): string {
  const config = ROLE_CONFIGS.find(r => r.roleName === roleName) || { prefix: 'EMP-EMP' };
  const prefix = config.prefix;

  // Retrieve burned / historically used IDs from storage
  let burnedIds: string[] = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('apex_plm_used_employee_ids');
      if (raw) burnedIds = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read burned employee IDs:', e);
  }

  const existingIdSet = new Set<string>([
    ...allCurrentUsers.map(u => (u.employeeId || '').toUpperCase()),
    ...burnedIds.map(id => id.toUpperCase())
  ]);

  let counter = 1;
  let candidate = '';
  do {
    const numStr = String(counter).padStart(3, '0');
    candidate = `${prefix}-${numStr}`;
    counter++;
  } while (existingIdSet.has(candidate.toUpperCase()));

  return candidate;
}

export const AdminUserPanel: React.FC<AdminUserPanelProps> = ({
  users,
  setUsers,
  currentUser,
  onUpdateCurrentUser,
  logAction
}) => {
  const { isDark } = useTheme();

  // Internal user accounts state fallback
  const [internalUsers, setInternalUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('apex_plm_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return MOCK_USERS;
  });

  const activeUsersList = users || internalUsers;

  const updateUsers = (newUsers: UserAccount[]) => {
    if (setUsers) {
      setUsers(newUsers);
    } else {
      setInternalUsers(newUsers);
    }
    try {
      localStorage.setItem('apex_plm_users', JSON.stringify(newUsers));
    } catch (e) {
      console.error('Failed to persist users:', e);
    }
  };

  const isAdmin = currentUser ? currentUser.systemRole === 'ADMIN' : true;

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState<{ msg: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<UserAccount | null>(null);
  const [employeeToResetPass, setEmployeeToResetPass] = useState<UserAccount | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<UserAccount | null>(null);
  const [employeeToBlock, setEmployeeToBlock] = useState<UserAccount | null>(null);

  // Create Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState('Lead Design Engineer');
  const [newOfficeLocation, setNewOfficeLocation] = useState('Austin Gigafactory & R&D Hub');
  const [newGeneratedId, setNewGeneratedId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editOfficeLocation, setEditOfficeLocation] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Reset Password Form State
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetPassError, setResetPassError] = useState<string | null>(null);

  // Whenever selected role changes in Create modal, auto-generate next unique Employee ID
  useEffect(() => {
    if (isAddModalOpen) {
      const nextId = generateNextEmployeeId(newRole, activeUsersList);
      setNewGeneratedId(nextId);
    }
  }, [newRole, isAddModalOpen, activeUsersList]);

  const triggerNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. CREATE NEW EMPLOYEE
  const handleOpenCreateModal = () => {
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can create employee accounts.', 'error');
      return;
    }
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setShowNewPassword(false);
    setNewRole('Lead Design Engineer');
    setNewOfficeLocation('Austin Gigafactory & R&D Hub');
    setFormErrors({});
    const initialId = generateNextEmployeeId('Lead Design Engineer', activeUsersList);
    setNewGeneratedId(initialId);
    setIsAddModalOpen(true);
  };

  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can create employee accounts.', 'error');
      return;
    }

    const errors: Record<string, string> = {};
    if (!newFullName.trim()) errors.name = 'Full Name is required.';
    if (!newEmail.trim()) {
      errors.email = 'Corporate Email is required.';
    } else if (!newEmail.includes('@') || !newEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    } else if (activeUsersList.some(u => u.email.toLowerCase() === newEmail.toLowerCase().trim())) {
      errors.email = 'An employee with this email already exists.';
    }

    if (!newPassword) {
      errors.password = 'Password is required.';
    } else if (newPassword.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const roleConfig = ROLE_CONFIGS.find(r => r.roleName === newRole) || ROLE_CONFIGS[0];
    const finalId = newGeneratedId || generateNextEmployeeId(newRole, activeUsersList);

    const createdAccount: UserAccount = {
      id: `USR-${Date.now()}`,
      employeeId: finalId,
      name: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      role: roleConfig.roleName,
      systemRole: roleConfig.systemRole,
      roleId: roleConfig.roleId,
      personaKey: roleConfig.personaKey,
      department: roleConfig.department,
      avatar: roleConfig.systemRole === 'ADMIN' ? '🛡️' : roleConfig.systemRole === 'DESIGN_ENGINEER' ? '👨‍💻' : roleConfig.systemRole === 'MANUFACTURING_ENGINEER' ? '👷‍♂️' : roleConfig.systemRole === 'QUALITY_ENGINEER' ? '👩‍🔬' : '👤',
      badgeColor: roleConfig.badgeClass,
      manager: currentUser?.name ? `${currentUser.name} (Administrator)` : 'David Sterling',
      officeLocation: newOfficeLocation.trim() || 'Austin Gigafactory & R&D Hub',
      lastLogin: 'Never',
      status: 'Active',
      permissions: [
        'Login Authentication',
        'Profile Access',
        roleConfig.systemRole === 'ADMIN' ? 'Full Superuser System Administration' : `${roleConfig.department} Standard Operations`
      ],
      joiningDate: new Date().toISOString().substring(0, 10)
    };


    // Permanently record this ID so it is never reused or duplicated
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('apex_plm_used_employee_ids');
        const burned: string[] = raw ? JSON.parse(raw) : [];
        if (!burned.includes(finalId)) {
          burned.push(finalId);
          localStorage.setItem('apex_plm_used_employee_ids', JSON.stringify(burned));
        }
      }
    } catch (err) {
      console.error(err);
    }

    // Call MongoDB Atlas Backend API
    usersApi.create(createdAccount).catch((err) => {
      console.warn('Backend user creation error:', err.message);
    });

    const updated = [createdAccount, ...activeUsersList];
    updateUsers(updated);
    setIsAddModalOpen(false);

    // Audit Trail Log
    if (logAction) {
      logAction(
        'Employee Account Created',
        'SECURITY',
        finalId,
        `ADMIN (${currentUser?.name || 'Administrator'}) created new employee account for ${createdAccount.name} (${createdAccount.email}, Role: ${createdAccount.role}, ID: ${finalId}).`
      );
    }

    triggerNotification(`Created employee account for ${createdAccount.name} (${finalId})`);
  };

  // 2. EDIT EMPLOYEE
  const handleOpenEdit = (user: UserAccount) => {
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can edit employee accounts.', 'error');
      return;
    }
    setEmployeeToEdit(user);
    setEditFullName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditOfficeLocation(user.officeLocation);
    setEditErrors({});
  };

  const handleEditEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToEdit || !isAdmin) return;

    const errors: Record<string, string> = {};
    if (!editFullName.trim()) errors.name = 'Full Name is required.';
    if (!editEmail.trim()) {
      errors.email = 'Corporate Email is required.';
    } else if (!editEmail.includes('@') || !editEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    } else if (
      activeUsersList.some(
        u => u.id !== employeeToEdit.id && u.email.toLowerCase() === editEmail.toLowerCase().trim()
      )
    ) {
      errors.email = 'Another employee is already registered with this email.';
    }

    // Prevent ADMIN from removing their own active admin access
    const isSelf = currentUser?.id === employeeToEdit.id || currentUser?.email.toLowerCase() === employeeToEdit.email.toLowerCase();
    const roleConfig = ROLE_CONFIGS.find(r => r.roleName === editRole) || ROLE_CONFIGS[0];

    if (isSelf && roleConfig.systemRole !== 'ADMIN') {
      errors.role = 'Security Protection: You cannot remove the Administrator role from your own active account.';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    const updatedUser: UserAccount = {
      ...employeeToEdit,
      name: editFullName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: roleConfig.roleName,
      systemRole: isSelf ? 'ADMIN' : roleConfig.systemRole,
      roleId: isSelf ? 'admin' : roleConfig.roleId,
      personaKey: isSelf ? 'admin' : roleConfig.personaKey,
      department: roleConfig.department,
      badgeColor: roleConfig.badgeClass,
      officeLocation: editOfficeLocation.trim() || employeeToEdit.officeLocation
    };

    // Call MongoDB Atlas Backend API
    usersApi.update(employeeToEdit.id || employeeToEdit.employeeId, updatedUser).catch((err) => {
      console.warn('Backend user update error:', err.message);
    });

    const nextList = activeUsersList.map(u => u.id === employeeToEdit.id ? updatedUser : u);
    updateUsers(nextList);

    if (isSelf && onUpdateCurrentUser) {
      onUpdateCurrentUser(updatedUser);
    }

    if (logAction) {
      logAction(
        'Employee Account Updated',
        'SECURITY',
        employeeToEdit.employeeId,
        `ADMIN (${currentUser?.name || 'Administrator'}) updated profile for employee ${updatedUser.name} (${updatedUser.employeeId}, Role: ${updatedUser.role}).`
      );
    }

    setEmployeeToEdit(null);
    triggerNotification(`Updated profile for ${updatedUser.name}`);
  };

  // 3. BLOCK / UNBLOCK EMPLOYEE
  const handleToggleBlockClick = (user: UserAccount) => {
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can block or unblock employees.', 'error');
      return;
    }

    const isSelf = currentUser?.id === user.id || currentUser?.email.toLowerCase() === user.email.toLowerCase();
    if (isSelf) {
      triggerNotification('Action Prohibited: You cannot block your own active Administrator account.', 'error');
      return;
    }

    if (user.status === 'Blocked' || user.status === 'Locked') {
      // Direct unblock
      handleConfirmUnblock(user);
    } else {
      // Require confirmation to block
      setEmployeeToBlock(user);
    }
  };

  const handleConfirmBlock = () => {
    if (!employeeToBlock) return;
    const target = employeeToBlock;

    // Call MongoDB Atlas Backend API
    usersApi.block(target.id || target.employeeId).catch((err) => {
      console.warn('Backend user block error:', err.message);
    });

    const nextList = activeUsersList.map(u => {
      if (u.id === target.id) {
        return { ...u, status: 'Blocked' as const };
      }
      return u;
    });

    updateUsers(nextList);
    setEmployeeToBlock(null);

    if (logAction) {
      logAction(
        'Employee Account Blocked',
        'SECURITY',
        target.employeeId,
        `ADMIN (${currentUser?.name || 'Administrator'}) blocked employee ${target.name} (${target.email}, ID: ${target.employeeId}). Immediate login access revoked.`
      );
    }

    triggerNotification(`Account for ${target.name} has been BLOCKED. Login access revoked.`, 'info');
  };

  const handleConfirmUnblock = (target: UserAccount) => {
    // Call MongoDB Atlas Backend API
    usersApi.unblock(target.id || target.employeeId).catch((err) => {
      console.warn('Backend user unblock error:', err.message);
    });

    const nextList = activeUsersList.map(u => {
      if (u.id === target.id) {
        return { ...u, status: 'Active' as const };
      }
      return u;
    });

    updateUsers(nextList);

    if (logAction) {
      logAction(
        'Employee Account Unblocked',
        'SECURITY',
        target.employeeId,
        `ADMIN (${currentUser?.name || 'Administrator'}) unblocked employee ${target.name} (${target.email}, ID: ${target.employeeId}). Login access restored.`
      );
    }

    triggerNotification(`Account for ${target.name} has been UNBLOCKED. Login access restored.`, 'success');
  };

  // 4. RESET PASSWORD
  const handleOpenResetPassword = (user: UserAccount) => {
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can reset employee passwords.', 'error');
      return;
    }
    setEmployeeToResetPass(user);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPass(false);
    setResetPassError(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToResetPass || !isAdmin) return;

    if (!resetNewPassword) {
      setResetPassError('New password is required.');
      return;
    }
    if (resetNewPassword.length < 4) {
      setResetPassError('Password must be at least 4 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetPassError('Passwords do not match. Please confirm the new password.');
      return;
    }

    // Call MongoDB Atlas Backend API
    usersApi.resetPassword(employeeToResetPass.id || employeeToResetPass.employeeId, resetNewPassword).catch((err) => {
      console.warn('Backend password reset error:', err.message);
    });

    const updatedUser: UserAccount = {
      ...employeeToResetPass,
      password: resetNewPassword
    };

    const nextList = activeUsersList.map(u => u.id === employeeToResetPass.id ? updatedUser : u);
    updateUsers(nextList);

    const isSelf = currentUser?.id === employeeToResetPass.id || currentUser?.email.toLowerCase() === employeeToResetPass.email.toLowerCase();
    if (isSelf && onUpdateCurrentUser) {
      onUpdateCurrentUser(updatedUser);
    }

    if (logAction) {
      logAction(
        'Employee Password Reset',
        'SECURITY',
        employeeToResetPass.employeeId,
        `ADMIN (${currentUser?.name || 'Administrator'}) reset password for employee ${employeeToResetPass.name} (${employeeToResetPass.email}, ID: ${employeeToResetPass.employeeId}).`
      );
    }

    setEmployeeToResetPass(null);
    triggerNotification(`Password updated for ${employeeToResetPass.name}. Employee must use new password for login.`);
  };

  // 5. DELETE EMPLOYEE
  const handleOpenDelete = (user: UserAccount) => {
    if (!isAdmin) {
      triggerNotification('Access Denied: Only Administrators can delete employee accounts.', 'error');
      return;
    }

    const isSelf = currentUser?.id === user.id || currentUser?.email.toLowerCase() === user.email.toLowerCase();
    if (isSelf) {
      triggerNotification('Action Prohibited: You cannot delete your own active Administrator account.', 'error');
      return;
    }

    setEmployeeToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!employeeToDelete || !isAdmin) return;
    const target = employeeToDelete;

    // Permanently record this ID so it is never reused or duplicate-assigned
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('apex_plm_used_employee_ids');
        const burned: string[] = raw ? JSON.parse(raw) : [];
        if (!burned.includes(target.employeeId)) {
          burned.push(target.employeeId);
          localStorage.setItem('apex_plm_used_employee_ids', JSON.stringify(burned));
        }
      }
    } catch (err) {
      console.error(err);
    }

    // Call MongoDB Atlas Backend API
    usersApi.delete(target.id || target.employeeId).catch((err) => {
      console.warn('Backend user delete error:', err.message);
    });

    // Remove employee record from accounts
    const nextList = activeUsersList.filter(u => u.id !== target.id);
    updateUsers(nextList);

    // Audit Trail Log preserving historical records
    if (logAction) {
      logAction(
        'Employee Account Deleted',
        'SECURITY',
        target.employeeId,
        `ADMIN (${currentUser?.name || 'Administrator'}) permanently removed employee account ${target.name} (${target.email}, ID: ${target.employeeId}). Historical engineering projects, CAD, BOM, and Audit Trail logs created by this user remain preserved.`
      );
    }

    setEmployeeToDelete(null);
    triggerNotification(`Employee record for ${target.name} (${target.employeeId}) deleted permanently.`);
  };


  // Search & Filtered List
  const filteredUsers = useMemo(() => {
    return activeUsersList.filter((u) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.officeLocation && u.officeLocation.toLowerCase().includes(q));

      const matchesRole = filterRole === 'all' || u.role === filterRole || u.roleId === filterRole;

      const isBlocked = u.status === 'Blocked' || u.status === 'Locked';
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && !isBlocked) ||
        (filterStatus === 'blocked' && isBlocked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeUsersList, searchTerm, filterRole, filterStatus]);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center space-x-2 animate-bounce ${
          notification.type === 'error'
            ? 'bg-rose-600 text-white'
            : notification.type === 'info'
            ? 'bg-amber-600 text-white'
            : 'bg-emerald-600 text-white'
        }`}>
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-purple-500 border ${
            isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-xl font-bold tracking-tight ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                USERS & ROLES — EMPLOYEE MANAGEMENT
              </h2>
              <span className="badge-status badge-active text-[10px]">
                ADMIN CONSOLE
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Manage enterprise employees, auto-generated role IDs, corporate credentials, access blocking, and security policies.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer shadow-sm py-2 px-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>CREATE NEW EMPLOYEE</span>
          </button>
        )}
      </div>

      {/* Non-Admin Informational Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center space-x-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>Standard Employee View:</strong> Administrative actions (Create, Edit, Block/Unblock, Reset Password, Delete) are restricted to PLM Administrators only.
          </div>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className={`rounded-xl p-4 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
          <input
            type="text"
            placeholder="Search Name, Email, Employee ID, Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="plm-select py-1.5 text-xs"
            >
              <option value="all">All Roles ({activeUsersList.length})</option>
              {ROLE_CONFIGS.map(r => (
                <option key={r.roleName} value={r.roleName}>{r.roleName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="plm-select py-1.5 text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Management Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Employee / ID</th>
                <th>Corporate Email</th>
                <th>Role Assignment & Department</th>
                <th>Office Location</th>
                <th className="text-center">Account Status</th>
                <th className="text-center">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isBlocked = u.status === 'Blocked' || u.status === 'Locked';
                  const isSelf = currentUser?.id === u.id || currentUser?.email.toLowerCase() === u.email.toLowerCase();

                  return (
                    <tr key={u.id} className={isBlocked ? 'opacity-70 bg-rose-500/5' : ''}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xl p-2 rounded-lg border shrink-0 ${
                            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}>{u.avatar || '👤'}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-cyan-400 mt-0.5">
                              {u.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="font-mono text-[11px] text-cyan-500 flex items-center space-x-1">
                          <Mail className="w-3 h-3 shrink-0 opacity-70" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.badgeColor || 'bg-slate-500/10 text-slate-300'}`}>
                          {u.role}
                        </span>
                        <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                          {u.department}
                        </div>
                      </td>

                      <td>
                        <div className={`flex items-center space-x-1.5 ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                          <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                          <span>{u.officeLocation || 'Global Enterprise HQ'}</span>
                        </div>
                      </td>

                      <td className="text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          isBlocked
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        }`}>
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* 1. Edit */}
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleOpenEdit(u)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isAdmin
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer'
                                : 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                            }`}
                            title={isAdmin ? `Edit Employee ${u.name}` : 'Admin access required'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Block / Unblock */}
                          <button
                            type="button"
                            disabled={!isAdmin || isSelf}
                            onClick={() => handleToggleBlockClick(u)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              !isAdmin || isSelf
                                ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                                : isBlocked
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'Cannot block your own active Administrator account'
                                : !isAdmin
                                ? 'Admin access required'
                                : isBlocked
                                ? `Unblock ${u.name} (Restore login access)`
                                : `Block ${u.name} (Prevent login)`
                            }
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* 3. Reset Password */}
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => handleOpenResetPassword(u)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isAdmin
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 cursor-pointer'
                                : 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                            }`}
                            title={isAdmin ? `Reset Password for ${u.name}` : 'Admin access required'}
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete */}
                          <button
                            type="button"
                            disabled={!isAdmin || isSelf}
                            onClick={() => handleOpenDelete(u)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              !isAdmin || isSelf
                                ? 'opacity-40 cursor-not-allowed border-slate-700 text-slate-500'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'Cannot delete your own active Administrator account'
                                : !isAdmin
                                ? 'Admin access required'
                                : `Delete Employee ${u.name}`
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE NEW EMPLOYEE */}
      {isAddModalOpen && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-lg p-6 space-y-4 text-xs">
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Create New Employee Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-3.5">
              {/* Full Name * */}
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={newFullName}
                  onChange={(e) => {
                    setNewFullName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`plm-input w-full text-xs ${formErrors.name ? 'border-rose-500' : ''}`}
                />
                {formErrors.name && <p className="text-rose-400 text-[10px] mt-1">{formErrors.name}</p>}
              </div>

              {/* Corporate Email * */}
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rachel.adams@apexplm.io"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`plm-input w-full text-xs font-mono ${formErrors.email ? 'border-rose-500' : ''}`}
                />
                {formErrors.email && <p className="text-rose-400 text-[10px] mt-1">{formErrors.email}</p>}
              </div>

              {/* Password * */}
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter secure initial password..."
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`plm-input w-full text-xs pr-9 ${formErrors.password ? 'border-rose-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {formErrors.password ? (
                  <p className="text-rose-400 text-[10px] mt-1">{formErrors.password}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Employee will log in using Corporate Email + this Password. Passwords are saved securely and never exposed in the employee table.
                  </p>
                )}
              </div>

              {/* Role Assignment * & Auto-Generated Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                    Role Assignment *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="plm-select w-full text-xs font-semibold"
                  >
                    {ROLE_CONFIGS.map(r => (
                      <option key={r.roleName} value={r.roleName}>
                        {r.roleName} ({r.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                      Employee ID — AUTO GENERATED
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Never duplicates</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={newGeneratedId}
                      className="plm-input w-full text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border-cyan-500/40 cursor-not-allowed select-all"
                    />
                    <Lock className="w-3 h-3 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 opacity-70" />
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Office Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Austin Gigafactory & R&D Hub"
                  value={newOfficeLocation}
                  onChange={(e) => setNewOfficeLocation(e.target.value)}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm cursor-pointer px-4"
                >
                  Create Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE */}
      {employeeToEdit && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-lg p-6 space-y-4 text-xs">
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Edit Employee — {employeeToEdit.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmployeeToEdit(null)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditEmployeeSubmit} className="space-y-3.5">
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => {
                    setEditFullName(e.target.value);
                    if (editErrors.name) setEditErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`plm-input w-full text-xs ${editErrors.name ? 'border-rose-500' : ''}`}
                />
                {editErrors.name && <p className="text-rose-400 text-[10px] mt-1">{editErrors.name}</p>}
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => {
                    setEditEmail(e.target.value);
                    if (editErrors.email) setEditErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`plm-input w-full text-xs font-mono ${editErrors.email ? 'border-rose-500' : ''}`}
                />
                {editErrors.email && <p className="text-rose-400 text-[10px] mt-1">{editErrors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                    Role Assignment *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="plm-select w-full text-xs font-semibold"
                  >
                    {ROLE_CONFIGS.map(r => (
                      <option key={r.roleName} value={r.roleName}>
                        {r.roleName}
                      </option>
                    ))}
                  </select>
                  {editErrors.role && <p className="text-rose-400 text-[10px] mt-1">{editErrors.role}</p>}
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                    Employee ID (Permanent)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={employeeToEdit.employeeId}
                    className="plm-input w-full text-xs font-mono font-bold text-slate-400 bg-slate-800/40 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Office Location
                </label>
                <input
                  type="text"
                  value={editOfficeLocation}
                  onChange={(e) => setEditOfficeLocation(e.target.value)}
                  className="plm-input w-full text-xs"
                />
              </div>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <button
                  type="button"
                  onClick={() => setEmployeeToEdit(null)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm cursor-pointer px-4"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {employeeToResetPass && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Reset Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmployeeToResetPass(null)}
                className="text-secondary hover:text-primary cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3.5 rounded-xl border space-y-1 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-slate-200">{employeeToResetPass.name}</div>
              <div className="text-cyan-400 font-mono text-[11px]">{employeeToResetPass.email}</div>
              <div className="text-slate-400 font-mono text-[10px]">ID: {employeeToResetPass.employeeId} &bull; {employeeToResetPass.role}</div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    required
                    placeholder="Enter new password..."
                    value={resetNewPassword}
                    onChange={(e) => {
                      setResetNewPassword(e.target.value);
                      setResetPassError(null);
                    }}
                    className="plm-input w-full text-xs pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showResetPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                  Confirm New Password *
                </label>
                <input
                  type={showResetPass ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password..."
                  value={resetConfirmPassword}
                  onChange={(e) => {
                    setResetConfirmPassword(e.target.value);
                    setResetPassError(null);
                  }}
                  className="plm-input w-full text-xs font-mono"
                />
              </div>

              {resetPassError && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{resetPassError}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                The old password is never displayed. Once saved, the employee must use this new password for their next login.
              </p>

              <div className={`flex justify-end space-x-3 pt-4 border-t ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <button
                  type="button"
                  onClick={() => setEmployeeToResetPass(null)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm cursor-pointer px-4"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BLOCK CONFIRMATION */}
      {employeeToBlock && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Block Employee Account?
                </h3>
                <p className="text-[11px] text-slate-400">
                  Revoke system login and PLM access
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#0D1628] border-amber-500/30 text-slate-300' : 'bg-amber-50/50 border-amber-200 text-slate-700'
            }`}>
              <div>
                Target: <strong className="text-amber-400 font-bold">{employeeToBlock.name}</strong> ({employeeToBlock.employeeId})
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If blocked, this employee will be immediately prevented from logging in. Any login attempt will display <em>&ldquo;Account Blocked&rdquo;</em>, and all PLM access will be halted until an Administrator unblocks the account.
              </p>
            </div>

            <div className={`flex justify-end space-x-3 pt-3 border-t ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <button
                type="button"
                onClick={() => setEmployeeToBlock(null)}
                className="btn-secondary btn-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="btn-sm bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg px-4 cursor-pointer"
              >
                Confirm Block Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {employeeToDelete && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Delete Employee Permanently?
                </h3>
                <p className="text-[11px] text-slate-400">
                  Remove employee account and credentials
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#0D1628] border-rose-500/30 text-slate-300' : 'bg-rose-50/50 border-rose-200 text-slate-700'
            }`}>
              <div>
                Employee: <strong className="text-rose-400 font-bold">{employeeToDelete.name}</strong> ({employeeToDelete.employeeId})
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>Permanently removes login credentials and profile.</li>
                <li>Employee ID <strong className="text-slate-300 font-mono font-bold">{employeeToDelete.employeeId}</strong> will be retired and never reused.</li>
                <li><strong className="text-emerald-400">Preserved:</strong> Historical projects, CAD files, BOMs, documents, and Audit Trail logs created by this employee remain intact.</li>
              </ul>
            </div>

            <div className={`flex justify-end space-x-3 pt-3 border-t ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="btn-secondary btn-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-sm bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg px-4 cursor-pointer"
              >
                Yes, Delete Employee Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
