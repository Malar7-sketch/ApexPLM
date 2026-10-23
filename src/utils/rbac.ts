import type { SystemRole, PermissionLevel, ModuleId, PermissionMatrix } from '../types/plm';

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  dashboard: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'FULL',
    MANUFACTURING_ENGINEER: 'FULL',
    QUALITY_ENGINEER: 'FULL',
    EMPLOYEE: 'VIEW'
  },
  products: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'FULL',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'VIEW'
  },
  cad: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'FULL',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'NONE'
  },
  bom: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'EDIT',
    MANUFACTURING_ENGINEER: 'EDIT',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'VIEW'
  },
  capp: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'FULL',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'NONE'
  },
  quality: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'FULL',
    EMPLOYEE: 'NONE'
  },
  eco: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'CREATE',
    MANUFACTURING_ENGINEER: 'EDIT',
    QUALITY_ENGINEER: 'APPROVE',
    EMPLOYEE: 'VIEW'
  },
  admin_users: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'NONE',
    MANUFACTURING_ENGINEER: 'NONE',
    QUALITY_ENGINEER: 'NONE',
    EMPLOYEE: 'NONE'
  },
  admin_roles: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'NONE',
    MANUFACTURING_ENGINEER: 'NONE',
    QUALITY_ENGINEER: 'NONE',
    EMPLOYEE: 'NONE'
  },
  admin_audit: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'NONE'
  },
  reports: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'NONE'
  },
  settings: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'NONE',
    MANUFACTURING_ENGINEER: 'NONE',
    QUALITY_ENGINEER: 'NONE',
    EMPLOYEE: 'NONE'
  },
  documents: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'EDIT',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'EDIT',
    EMPLOYEE: 'VIEW'
  },
  projects: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'EDIT',
    MANUFACTURING_ENGINEER: 'EDIT',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'VIEW'
  },
  digital_thread: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'VIEW',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'VIEW'
  },
  inventory: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'FULL',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'VIEW'
  },
  tools: {
    ADMIN: 'FULL',
    DESIGN_ENGINEER: 'VIEW',
    MANUFACTURING_ENGINEER: 'FULL',
    QUALITY_ENGINEER: 'VIEW',
    EMPLOYEE: 'NONE'
  }
};

const PERMISSION_RANK: Record<PermissionLevel, number> = {
  NONE: 0,
  VIEW: 1,
  CREATE: 2,
  EDIT: 3,
  APPROVE: 4,
  FULL: 5
};

export const hasPermission = (
  role: SystemRole,
  module: ModuleId | string,
  requiredLevel: PermissionLevel = 'VIEW',
  matrix: PermissionMatrix = DEFAULT_PERMISSION_MATRIX
): boolean => {
  if (role === 'ADMIN') return true;

  const modKey = module as ModuleId;
  const rolePermissions = matrix[modKey];
  if (!rolePermissions) return true;

  const userLevel = rolePermissions[role] || 'NONE';
  return PERMISSION_RANK[userLevel] >= PERMISSION_RANK[requiredLevel];
};

export const getRoleDashboardRoute = (role: SystemRole): string => {
  if (role === 'ADMIN') return 'admin_dashboard';
  return 'employee_dashboard';
};
