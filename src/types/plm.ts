export type UserPersona = 'design' | 'mfg' | 'quality' | 'pm' | 'admin';

export type SystemRole = 
  | 'ADMIN' 
  | 'DESIGN_ENGINEER' 
  | 'MANUFACTURING_ENGINEER' 
  | 'QUALITY_ENGINEER' 
  | 'EMPLOYEE';

export type PermissionLevel = 'NONE' | 'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'FULL';

export type ModuleId = 
  | 'dashboard'
  | 'products'
  | 'cad'
  | 'bom'
  | 'capp'
  | 'quality'
  | 'eco'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_audit'
  | 'reports'
  | 'settings'
  | 'documents'
  | 'projects'
  | 'digital_thread'
  | 'inventory'
  | 'tools';

export type PermissionMatrix = Record<ModuleId, Record<SystemRole, PermissionLevel>>;

export type UserRole = 
  | 'admin' 
  | 'pm' 
  | 'design' 
  | 'mfg' 
  | 'quality' 
  | 'supplier' 
  | 'viewer';

export interface PersonaInfo {
  id: UserPersona;
  roleId: UserRole;
  name: string;
  role: string;
  department: string;
  avatar: string;
  badgeColor: string;
  permissions: string[];
}

export type LifecycleStage = 
  | 'concept' 
  | 'design' 
  | 'prototype' 
  | 'tooling' 
  | 'production' 
  | 'obsolete';

export type PartType = 'Assembly' | 'Sub-Assembly' | 'Component' | 'Raw Material' | 'Fastener' | 'Tooling';

export type PartCategory = 
  | 'CNC Machined' 
  | 'Sheet Metal' 
  | 'Injection Molded' 
  | 'Cast Metal' 
  | 'Electrical/Sensors' 
  | 'Fastener/Hardware' 
  | 'Composite/Carbon' 
  | 'Composite Assembly';

export interface StoredCadVaultFile {
  id: string;
  productId: string;        // Product ID / partNumber
  partNumber: string;       // Part Number
  projectId?: string;       // Linked Project ID
  projectName?: string;     // Linked Project Name
  fileName: string;
  fileType: string;         // 'STEP' | 'SLDPRT' | 'PDF' | 'DWG' | 'IGES' etc.
  category: 'cad' | 'step' | 'drawing' | 'document' | 'pmi';
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  dataUrl: string;
}

export interface CADMetadata {
  fileName: string;
  format: 'STEP' | 'IGES' | 'SLDASM' | 'SLDPRT' | 'CATPART' | 'NX' | 'DWG';
  fileSize: string;
  surfaceAreaCm2: number;
  volumeCm3: number;
  boundingDimensionsMm: [number, number, number];
  geometryType: 'planetary_gearbox' | 'ev_drivetrain' | 'drone_frame' | 'robotic_gripper' | 'structural_bracket';
  renderColor: string;
  supplierCode?: string;
  familyGroup?: string;
  diffModelUrl?: string;
  cadFile?: string;
  stepFile?: string;
  pdfFile?: string;
  attachedFiles?: StoredCadVaultFile[];
}

export interface RevisionTechnicalSpecs {
  material?: string;
  manufacturingProcess?: string;
  dimensions?: string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  diameter?: number | string;
  weightKg?: number | string;
  units?: string;
  cadFileFormat?: string;
  cadSoftware?: string;
  technicalSpecs?: string;
  designRequirements?: string;
  safetyRequirements?: string;
  qualityRequirements?: string;
  additionalParams?: Record<string, any>;
}

export interface Revision {
  revId: string;
  date: string;
  author: string;
  changeSummary: string;
  linkedEcnId?: string;
  status: 'Draft' | 'Released' | 'Superseded' | 'Under Review';
  cadFile?: string;
  stepFile?: string;
  pdfFile?: string;
  description?: string;
  changeReason?: string;
  lifecycleStage?: LifecycleStage;
  effectiveDate?: string;
  revisionNotes?: string;
  releasedBy?: string;
  releasedAt?: string;
  technicalSpecs?: RevisionTechnicalSpecs;
  attachedDocIds?: string[];
  attachedFiles?: StoredCadVaultFile[];
  bomSnapshot?: BOMNode[];
}

export interface PartItem {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  type: PartType;
  category: PartCategory;
  material: string;
  weightKg: number;
  estimatedCost: number;
  actualCost: number;
  currentRev: string;
  lifecycleStage: LifecycleStage;
  isCheckedOut: boolean;
  checkedOutBy?: string;
  checkedOutDate?: string;
  parentAssemblyId?: string;
  projectId?: string;
  projectName?: string;
  completionPercent?: number;
  productStatus?: 'NOT STARTED' | 'IN PROGRESS' | 'COMPLETED' | string;
  cadMetadata: CADMetadata;
  revisionHistory: Revision[];
  tags: string[];
  productFamily?: string;
  productGroup?: string;
  customerName?: string;
  department?: string;
  productOwner?: string;
  designEngineer?: string;
  manufacturingEngineer?: string;
  qualityEngineer?: string;
  productImage?: string;
  technicalSpecs?: RevisionTechnicalSpecs;
  initialRev?: string;
  activeRev?: string;
}

export interface BOMNode {
  id: string;
  partId: string;
  partNumber: string;
  name: string;
  revision: string;
  quantity: number;
  unit: string;
  refDes?: string;
  material: string;
  unitCost: number;
  weightKg: number;
  carbonKgCO2?: number;
  isMbomOnly?: boolean;
  mbomInstruction?: string;
  isSbomOnly?: boolean;
  sbomMaintenanceInterval?: string;
  stockStatus?: 'In Stock' | 'Low Stock' | 'Lead Time 6w';
  children?: BOMNode[];
}

export type EcrSeverity = 'Critical' | 'Major' | 'Minor';
export type EcrStatus = 'Draft' | 'Proposed' | 'In Review' | 'Approved' | 'Rejected' | 'Converted to ECN' | 'Open' | 'Cancelled' | 'Archived';
export type EcrRootCause = 'Design Optimization' | 'Cost Reduction' | 'Quality Non-Conformance' | 'DFM Friction' | 'Supply Chain Spec Change';

export interface EcrAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface ECR {
  id: string;
  title: string;
  requester: string;
  dateCreated: string;
  severity: EcrSeverity;
  rootCause: EcrRootCause;
  description: string;
  proposedSolution: string;
  impactedPartIds: string[];
  status: EcrStatus;
  estimatedSavingsOrCost: number;
  changeType?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  targetProductId?: string;
  targetProductPartNumber?: string;
  currentRevision?: string;
  proposedRevision?: string;
  reasonForChange?: string;
  affectedComponents?: string;
  changeCategory?: string;
  riskLevel?: 'High' | 'Medium' | 'Low';
  targetCompletionDate?: string;
  workflowStage?: EcnPipelineStage;
  riskScore?: number | string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  signoffs?: Record<UserPersona, SignoffStatus>;
  attachments?: EcrAttachment[];
}

export type EcnPipelineStage = 'Draft' | 'Design Review' | 'Mfg Review' | 'Quality Review' | 'Final Signoff' | 'Released';

export interface SignoffStatus {
  persona: UserPersona;
  approved: boolean;
  approverName: string;
  date?: string;
  comments?: string;
  digitalSignatureHash?: string;
}

export interface ECN {
  id: string;
  linkedEcrId?: string;
  title: string;
  leadEngineer: string;
  dateInitiated: string;
  targetReleaseDate: string;
  pipelineStage: EcnPipelineStage;
  targetPartId: string;
  fromRevision: string;
  toRevision: string;
  reasonForChange: string;
  riskScore: number;
  impactAnalysis: {
    bomCostDeltaPercent: number;
    massDeltaKg: number;
    toolingModRequired: boolean;
    assemblyTimeDeltaSec: number;
    scrapInventoryCost: number;
  };
  signoffs: Record<UserPersona, SignoffStatus>;
  effectiveDate?: string;
}

export interface GateChecklistItem {
  id: string;
  task: string;
  requiredRole: UserPersona;
  completed: boolean;
  completedBy?: string;
  completedDate?: string;
  documentRef?: string;
}

export interface StageGate {
  gateId: number;
  gateName: string;
  stage: LifecycleStage;
  description: string;
  status: 'Passed' | 'In Progress' | 'Blocked' | 'Upcoming';
  targetCompletionDate: string;
  actualCompletionDate?: string;
  completionPercent: number;
  responsibleEngineer: string;
  checklist: GateChecklistItem[];
}

export interface EngineeringDocument {
  id: string;
  title: string;
  docNumber: string;
  type: '2D Drawing PDF' | 'DFMEA' | 'PFMEA' | 'Inspection Plan' | 'RoHS/REACH Cert' | 'Test Report' | 'PPAP' | 'Control Plan' | '3D CAD Model' | 'Technical Specification' | 'Statement of Work' | string;
  linkedPartId: string;
  revision: string;
  author: string;
  uploadDate: string;
  fileSize: string;
  status: 'Approved' | 'Draft' | 'Obsolete';
  fileUrl?: string;
  fileName?: string;
  fileExtension?: string;
  category?: 'cad' | 'pdf' | 'doc' | 'sheet' | 'fmea' | 'inspection' | 'compliance' | 'other';
  description?: string;
  content?: string;
}

export type NcrSeverity = 'Critical' | 'Major' | 'Minor';
export type NcrStatus = 'Open' | 'Under Investigation' | 'Containment' | 'Corrective Action' | 'Verification' | 'Closed' | 'Archived';
export type NcrType = 
  | 'In-Process Machining'
  | 'Incoming Supplier Quality'
  | 'Final Assembly Inspection'
  | 'Customer Field Return'
  | 'Tooling Non-Conformance'
  | 'Material Defect'
  | 'Calibration & Gauge Error';

export interface NcrAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uploadedAt: string;
}

export interface QualityNCR {
  id: string;
  ncrNumber: string;
  title: string;
  ncrType?: string;
  severity: NcrSeverity;
  status: NcrStatus;
  linkedPartId: string;
  targetPartNumber?: string;
  productAssembly?: string;
  workOrder?: string;
  machineEquipment?: string;
  defectCategory?: string;
  ppmImpact?: number;
  reportedBy: string;
  detectedBy?: string;
  dateReported: string;
  dateDetected?: string;
  department?: string;
  description?: string;
  nonConformanceDescription?: string;
  specificationRequirement?: string;
  actualCondition?: string;
  expectedCondition?: string;
  quantityAffected?: number;
  defectLocation?: string;
  rootCauseCategory?: string;
  rootCause5Why?: string;
  rootCauseDescription?: string;
  containmentAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  inspectionMethod?: string;
  inspectionResult?: string;
  measurementValue?: string;
  specificationLimit?: string;
  inspector?: string;
  inspectionDate?: string;
  attachments?: NcrAttachment[];
  history?: Array<{
    action: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
}

export interface CAPA {
  id: string;
  capaNumber: string;
  linkedNcrId: string;
  title: string;
  owner: string;
  targetDate: string;
  status: 'Initiated' | 'In Progress' | 'Verified Effective';
}

export interface Supplier {
  id: string;
  vendorCode: string;
  name: string;
  category: string;
  ratingScore: number;
  deliveryScorePercent: number;
  qualityScorePpm: number;
  leadTimeWeeks: number;
  status: 'Approved' | 'Conditional' | 'Blacklisted';
  contactEmail: string;
  location: string;
}

export interface ProjectTask {
  id: string;
  taskNumber?: string;
  projectId?: string;
  taskName: string;
  assignedRole?: UserPersona;
  owner?: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  progressPercent: number;
  weight?: number;
  dependency?: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Under Review' | 'Completed';
  completedDate?: string;
  completedBy?: string;
}

export interface ProjectTeamMember {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  manager: string;
  designEngineer?: string;
  mfgEngineer?: string;
  qualityEngineer?: string;
  procurementLead?: string;
  customer?: string;
  program?: string;
  startDate?: string;
  endDate?: string;
  durationFormatted?: string;
  teamMembers?: ProjectTeamMember[];
  status: 'Not Started' | 'In Progress' | 'On Track' | 'At Risk' | 'Completed' | 'Closed';
  completionPercent: number;
  budgetTotal: number;
  budgetSpent: number;
  engHoursTotal: number;
  engHoursSpent: number;
  completedDate?: string;
  completedBy?: string;
  finalApproval?: string;
  releasedProduct?: string;
  linkedPartId?: string;
  finalRevision?: string;
  tasks: ProjectTask[];
}

export interface TelemetryPoint {
  timestamp: string;
  tempCelsius: number;
  stressMpa: number;
  rpm: number;
  vibrationG: number;
  powerKw: number;
  healthScorePercent: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  persona: UserPersona;
  action: string;
  category: 'CAD' | 'BOM' | 'ECR/ECN' | 'STAGE-GATE' | 'DOCUMENT' | 'QUALITY' | 'SUPPLIER' | 'PROJECT' | 'MANUFACTURING' | 'INVENTORY' | 'SYSTEM' | 'SECURITY';
  targetId: string;
  details: string;
}

export type DigitalThreadStageId = 
  | 'product' 
  | 'cad' 
  | 'drawing' 
  | 'ebom' 
  | 'mbom' 
  | 'capp' 
  | 'supplier' 
  | 'manufacturing' 
  | 'inspection' 
  | 'service';

export interface ProcessOperation {
  id: string;
  opNumber: number;
  name: string;
  machineId: string;
  machineName: string;
  setupTimeMin: number;
  cycleTimeSec: number;
  toolRequired: string;
  fixtureRequired: string;
  operatorRole: string;
  estimatedCost: number;
  inspectionPoints: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Raw Material' | 'Standard Hardware' | 'Component' | 'Sub-Assembly' | 'Finished Goods';
  warehouseLocation: string;
  binNumber: string;
  stockQty: number;
  minQty: number;
  maxQty: number;
  unitCost: number;
  qrCodeUrl: string;
}

/* =====================================================
   INDEPENDENT DFMEA & PFMEA DATA MODELS
===================================================== */

export interface DfmeaRow {
  id: string;
  system: string;
  subsystem: string;
  component: string;
  functionDesc: string;
  designRequirement: string;
  potentialFailureMode: string;
  potentialEffect: string;
  severity: number; // 1-10
  potentialCause: string;
  occurrence: number; // 1-10
  currentDesignControls: string;
  detection: number; // 1-10
  rpn: number; // S x O x D
  recommendedDesignAction: string;
  responsibleEngineer: string;
  dueDate: string;
  status: 'Open' | 'In Review' | 'Mitigated' | 'Approved';
  linkedCadId?: string;
}

export interface PfmeaRow {
  id: string;
  processStep: string;
  opNumber: number;
  machine: string;
  tool: string;
  fixture: string;
  operatorRole: string;
  potentialProcessFailure: string;
  effect: string;
  severity: number; // 1-10
  cause: string;
  occurrence: number; // 1-10
  processControls: string;
  detection: number; // 1-10
  rpn: number; // S x O x D
  correctiveAction: string;
  productionEngineer: string;
  dueDate: string;
  status: 'Open' | 'Action Pending' | 'Mitigated' | 'Closed';
  linkedPartId?: string;
}

export interface ToolItem {
  id: string;
  toolNumber: string;
  name: string;
  category: 'Cutting Insert' | 'CNC Collet' | 'Assembly Fixture' | 'Welding Jig' | 'CMM Gauge';
  toolLifePercent: number;
  calibrationDate: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Calibrating';
  location: string;
}

export interface CaeResult {
  stressMpa: number;
  strainMax: number;
  displacementMm: number;
  factorOfSafety: number;
  fatigueCycles: string;
  meshNodes: number;
}

export interface CfdSimulation {
  fluidType: string;
  velocityMs: number;
  pressureKpa: number;
  turbulenceModel: string;
  coolingEfficiencyPercent: number;
}

export interface CamToolpath {
  programNumber: string;
  toolName: string;
  feedRateMmMin: number;
  spindleRpm: number;
  cycleTimeMin: number;
  gCodeSnippet: string;
}

export interface RobotCell {
  id: string;
  robotName: string;
  type: 'Pick & Place' | 'Arc Welding' | 'Laser Inspection' | 'High-Speed Assembly';
  reachRadiusMm: number;
  payloadKg: number;
  collisionStatus: 'Clear' | 'Warning' | 'Collision Risk';
  cycleTimeSec: number;
}

export interface KnowledgeStandard {
  id: string;
  code: string;
  title: string;
  organization: 'ISO' | 'ASME' | 'DIN' | 'ASTM' | 'ANSI';
  category: string;
  status: 'Active' | 'Updated';
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  category: 'CAD Integration' | 'ERP Connector' | 'CAE Physics' | 'MES Telemetry';
  vendor: string;
  rating: number;
  downloads: number;
  installed: boolean;
}

export interface InspectionPlan {
  id: string;
  inspectionId: string;
  partNumber: string;
  characteristic: string;
  nominalValue: string;
  upperLimit: string;
  lowerLimit: string;
  measuringInstrument: string;
  result: string;
  status: 'Pass' | 'Fail';
}

export interface UserNotification {
  id: string;
  userId?: string;
  roleTarget?: SystemRole | 'ALL';
  title: string;
  message: string;
  category: 'Tasks' | 'Approvals' | 'Quality' | 'Engineering' | 'System';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
}
