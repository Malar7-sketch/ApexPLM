import type { UserPersona, UserRole, SystemRole } from '../types/plm';

export interface UserAccount {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  systemRole: SystemRole;
  roleId: UserRole;
  personaKey: UserPersona;
  department: string;
  avatar: string;
  badgeColor: string;
  manager: string;
  officeLocation: string;
  lastLogin: string;
  status: 'Active' | 'Locked' | 'Blocked' | 'Disabled';
  permissions: string[];
  joiningDate?: string;
  phone?: string;
  username?: string;
}

export const MOCK_USERS: UserAccount[] = [
  {
    id: 'USR-1001',
    employeeId: 'EMP-10482',
    name: 'Alex Rivera',
    email: 'alex.rivera@apexplm.io',
    password: 'alex123',
    role: 'Lead Mechanical Engineer',
    systemRole: 'DESIGN_ENGINEER',
    roleId: 'design',
    personaKey: 'design',
    department: 'Product Design & CAD Engineering',
    avatar: '👨‍💻',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    manager: 'Sarah Jenkins (VP Engineering)',
    officeLocation: 'Austin Gigafactory & R&D Hub',
    lastLogin: 'Today at 09:14 AM',
    joiningDate: '2022-03-15',
    phone: '+1 (512) 890-4412',
    status: 'Active',
    permissions: ['CAD Vault Checkout', 'EBOM Creation', 'ECN Submission', 'DFMEA Risk Analysis', '3D Model Release']
  },
  {
    id: 'USR-1002',
    employeeId: 'EMP-20911',
    name: 'Marcus Vance',
    email: 'marcus.vance@apexplm.io',
    password: 'marcus123',
    role: 'Manufacturing Engineer',
    systemRole: 'MANUFACTURING_ENGINEER',
    roleId: 'mfg',
    personaKey: 'mfg',
    department: 'Tooling & CAPP Process Planning',
    avatar: '👷‍♂️',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    manager: 'David Chen (Plant Director)',
    officeLocation: 'Stuttgart Tooling & Machining Plant',
    lastLogin: 'Today at 08:30 AM',
    joiningDate: '2021-09-01',
    phone: '+49 711 9021-33',
    status: 'Active',
    permissions: ['MBOM Assembly Rollup', 'CAPP Process Routing', 'PFMEA Analysis', 'CNC Toolpath CAM Release', 'Fixture Management']
  },
  {
    id: 'USR-1003',
    employeeId: 'EMP-30489',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@apexplm.io',
    password: 'elena123',
    role: 'Quality Lead Auditor',
    systemRole: 'QUALITY_ENGINEER',
    roleId: 'quality',
    personaKey: 'quality',
    department: 'Quality Assurance & QMS Compliance',
    avatar: '👩‍🔬',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    manager: 'Marcus Vance (Director Quality)',
    officeLocation: 'Munich Metrology & Inspection Lab',
    lastLogin: 'Today at 10:05 AM',
    joiningDate: '2020-01-10',
    phone: '+49 89 4410-88',
    status: 'Active',
    permissions: ['Quality Inspection Approval', 'CAPA Root Cause Investigation', 'NCR Submission', 'PPAP Signoff', 'ISO Audit']
  },
  {
    id: 'USR-1004',
    employeeId: 'EMP-90001',
    name: 'Sarah Connor',
    email: 'admin@apexplm.io',
    password: 'admin123',
    role: 'PLM Administrator',
    systemRole: 'ADMIN',
    roleId: 'admin',
    personaKey: 'admin',
    department: 'Global IT & Enterprise Security',
    avatar: '🛡️',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    manager: 'Chief Executive Board',
    officeLocation: 'Global Enterprise HQ',
    lastLogin: 'Today at 07:00 AM',
    joiningDate: '2019-05-20',
    phone: '+1 (800) 555-APEX',
    status: 'Active',
    permissions: ['Full System Superuser', 'RBAC User Management', 'Database Backup', 'System Settings', 'Audit Log Clearing', 'SSO Active Directory']
  },
  {
    id: 'USR-1005',
    employeeId: 'EMP-50112',
    name: 'John Miller',
    email: 'employee@apexplm.io',
    password: 'employee123',
    role: 'Assembly Operations Specialist',
    systemRole: 'EMPLOYEE',
    roleId: 'viewer',
    personaKey: 'pm',
    department: 'Assembly Line & Workstation Operations',
    avatar: '🔧',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    manager: 'Marcus Vance',
    officeLocation: 'Austin Plant Operations',
    lastLogin: 'Today at 11:20 AM',
    joiningDate: '2023-06-01',
    phone: '+1 (512) 555-0199',
    status: 'Active',
    permissions: ['View Personal Dashboard', 'View Assigned Work Orders', 'View Released Documents']
  },
  {
    id: 'USR-1006',
    employeeId: 'EMP-10042',
    name: 'David Sterling',
    email: 'david.sterling@apexplm.io',
    password: 'david123',
    role: 'Senior Project Manager',
    systemRole: 'ADMIN',
    roleId: 'pm',
    personaKey: 'pm',
    department: 'Program Management Office',
    avatar: '👔',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    manager: 'Sarah Jenkins (VP Engineering)',
    officeLocation: 'Global Enterprise HQ',
    lastLogin: 'Today at 08:00 AM',
    joiningDate: '2020-04-12',
    phone: '+1 (512) 555-0101',
    status: 'Active',
    permissions: ['Project Creation', 'Gantt Milestone Approval', 'Project Budget Tracking', 'Cross-functional Team Lead']
  },
  {
    id: 'USR-1007',
    employeeId: 'EMP-10088',
    name: 'Malarvannan M',
    email: 'malarvannan.m@apexplm.io',
    password: 'malar123',
    role: 'Lead Design Engineer',
    systemRole: 'DESIGN_ENGINEER',
    roleId: 'design',
    personaKey: 'design',
    department: 'Drivetrain & Mechanical Engineering',
    avatar: '⚡',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    manager: 'David Sterling',
    officeLocation: 'Austin Gigafactory & R&D Hub',
    lastLogin: 'Today at 09:30 AM',
    joiningDate: '2021-11-01',
    phone: '+1 (512) 890-7711',
    status: 'Active',
    permissions: ['3D CAD Modeling', 'EBOM Architecture', 'DFMEA Risk Management', 'GD&T Design Specs']
  },
  {
    id: 'USR-1008',
    employeeId: 'EMP-10089',
    name: 'Dharani Dharan',
    email: 'dharani.dharan@apexplm.io',
    password: 'dharani123',
    role: 'Mechanical Engineer',
    systemRole: 'DESIGN_ENGINEER',
    roleId: 'design',
    personaKey: 'design',
    department: 'Structural Analysis & FEA',
    avatar: '📐',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    manager: 'David Sterling',
    officeLocation: 'Austin Gigafactory & R&D Hub',
    lastLogin: 'Today at 09:00 AM',
    joiningDate: '2022-01-15',
    phone: '+1 (512) 890-7712',
    status: 'Active',
    permissions: ['CAD Analysis', '2D Technical Drawings', 'Stress Testing Simulation']
  },
  {
    id: 'USR-1009',
    employeeId: 'EMP-10090',
    name: 'Vaisaal S',
    email: 'vaisaal.s@apexplm.io',
    password: 'vaisaal123',
    role: 'CAD / System Engineer',
    systemRole: 'DESIGN_ENGINEER',
    roleId: 'design',
    personaKey: 'design',
    department: 'CAD Vault & PLM Integrations',
    avatar: '💻',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    manager: 'David Sterling',
    officeLocation: 'Austin Gigafactory & R&D Hub',
    lastLogin: 'Today at 08:45 AM',
    joiningDate: '2022-05-20',
    phone: '+1 (512) 890-7713',
    status: 'Active',
    permissions: ['CAD Vault Synchronization', 'STEP B-Rep Validation', '3D Model Release']
  }
];
