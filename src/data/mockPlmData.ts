import type { 
  UserPersona, 
  PersonaInfo, 
  PartItem, 
  BOMNode, 
  ECR, 
  ECN, 
  StageGate, 
  EngineeringDocument, 
  QualityNCR,
  CAPA,
  Supplier,
  Project,
  TelemetryPoint,
  AuditLog,
  ProcessOperation,
  InventoryItem,
  DfmeaRow,
  PfmeaRow,
  ToolItem
} from '../types/plm';

export const USER_PERSONAS: Record<UserPersona, PersonaInfo> = {
  design: {
    id: 'design',
    roleId: 'design',
    name: 'Alex Rivera, PE',
    role: 'Lead Mechanical Design Engineer',
    department: 'R&D Product Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    permissions: ['CAD:Checkout', 'CAD:Edit', 'ECR:Create', 'BOM:EditEBOM', 'Gate:Signoff']
  },
  mfg: {
    id: 'mfg',
    roleId: 'mfg',
    name: 'Marcus Vance',
    role: 'Senior Manufacturing Engineer',
    department: 'Advanced Manufacturing & DFM',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    permissions: ['BOM:EditMBOM', 'ECN:SignoffMfg', 'Gate:Signoff', 'Tooling:Approve']
  },
  quality: {
    id: 'quality',
    roleId: 'quality',
    name: 'Dr. Elena Rostova',
    role: 'Head of Quality Assurance & Compliance',
    department: 'Quality Engineering & ISO 9001',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    permissions: ['NCR:Create', 'CAPA:Approve', 'ECN:SignoffQuality', 'Gate:Signoff', 'Audit:Export']
  },
  pm: {
    id: 'pm',
    roleId: 'pm',
    name: 'David Sterling',
    role: 'Product Program Director',
    department: 'Program Management Office',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    permissions: ['ECN:FinalApprove', 'Project:Manage', 'Gate:Release', 'Budget:Override']
  },
  admin: {
    id: 'admin',
    roleId: 'admin',
    name: 'Sarah Connor',
    role: 'PLM System Administrator',
    department: 'Engineering IT Operations',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    permissions: ['ALL:FULL_ACCESS', 'System:Backup', 'RBAC:Manage', 'Vault:Delete']
  }
};

// All mock data initialized to empty arrays/objects.
// Only user-created and user-uploaded data will be stored and displayed.
export const INITIAL_PARTS: PartItem[] = [];
export const INITIAL_BOM_TREES: Record<string, BOMNode> = {};
export const INITIAL_ECRS: ECR[] = [];
export const INITIAL_ECNS: ECN[] = [];
export const INITIAL_STAGE_GATES: StageGate[] = [];
export const INITIAL_DOCUMENTS: EngineeringDocument[] = [];
export const INITIAL_QUALITY_NCRS: QualityNCR[] = [];
export const INITIAL_CAPAS: CAPA[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_TELEMETRY: TelemetryPoint[] = [];
export const INITIAL_PROCESS_OPERATIONS: ProcessOperation[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_DFMEA: DfmeaRow[] = [];
export const INITIAL_PFMEA: PfmeaRow[] = [];
export const INITIAL_TOOLS: ToolItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
