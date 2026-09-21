import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Layers, 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  Wrench, 
  Edit, 
  Copy, 
  Clock, 
  ShieldAlert, 
  Award, 
  Activity, 
  Settings, 
  Eye, 
  Check, 
  X, 
  FileSpreadsheet, 
  Paperclip,
  TrendingUp,
  Sliders,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Download,
  AlertCircle
} from 'lucide-react';
import type { 
  PartItem, 
  BOMNode, 
  LifecycleStage, 
  PartType, 
  PartCategory, 
  CADMetadata, 
  Revision,
  QualityNCR,
  DfmeaRow,
  PfmeaRow,
  EngineeringDocument,
  Project,
  ECR,
  StoredCadVaultFile
} from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';
import { 
  downloadCadVaultFile, 
  downloadActualStoredFile, 
  registerCadVaultFile, 
  registerCadVaultFiles, 
  getStoredCadVaultFiles, 
  getStoredFileForPart,
  purgeStoredCadVaultFiles,
  isProductIdDeleted,
  recordDeletedProductId,
  dataUrlToBlob 
} from '../utils/cadVaultStorage';
import { CadPreviewModal } from './CadPreviewModal';
import { partsApi, bomApi, documentsApi, projectsApi } from '../services/api';

interface ProductManagementProps {
  parts: PartItem[];
  setParts: React.Dispatch<React.SetStateAction<PartItem[]>>;
  bomTrees: Record<string, BOMNode>;
  setBomTrees: React.Dispatch<React.SetStateAction<Record<string, BOMNode>>>;
  currentUser: UserAccount;
  ncrs: QualityNCR[];
  setNcrs?: React.Dispatch<React.SetStateAction<QualityNCR[]>>;
  dfmeaRows: DfmeaRow[] | any[];
  setDfmeaRows: React.Dispatch<React.SetStateAction<DfmeaRow[]>>;
  pfmeaRows: PfmeaRow[] | any[];
  setPfmeaRows: React.Dispatch<React.SetStateAction<PfmeaRow[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  documents: EngineeringDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EngineeringDocument[]>>;
  ecrs?: ECR[];
  setEcrs?: React.Dispatch<React.SetStateAction<ECR[]>>;
  inventory?: any[];
  setInventory?: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, category: any, targetId: string, details: string) => void;
  initialFilterStage?: string;
  activeProjectId?: string;
  onSelectPart: (partId: string) => void;
  onNavigateTab: (tab: string) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  progress: number;
  status: 'Uploading' | 'Complete' | 'Failed';
  uploadedBy: string;
  uploadedDate: string;
  dataUrl?: string;
  productId?: string;
  projectId?: string;
  category?: 'cad' | 'step' | 'drawing' | 'document' | 'pmi';
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  parts,
  setParts,
  bomTrees,
  setBomTrees,
  currentUser,
  ncrs,
  setNcrs,
  dfmeaRows,
  setDfmeaRows,
  pfmeaRows,
  setPfmeaRows,
  projects,
  setProjects,
  documents,
  setDocuments,
  ecrs = [],
  setEcrs,
  inventory = [],
  setInventory,
  logAction,
  initialFilterStage,
  activeProjectId,
  onSelectPart,
  onNavigateTab
}) => {
  const { isDark } = useTheme();

  // Admin access validation
  const isAdmin = Boolean(currentUser && (
    currentUser.systemRole === 'ADMIN' || 
    currentUser.roleId === 'admin' || 
    currentUser.personaKey === 'admin' ||
    (currentUser.role && currentUser.role.toLowerCase().includes('admin'))
  ));

  // Admin deletion modal state
  const [productToDelete, setProductToDelete] = useState<PartItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Navigation & Sub-View State
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details' | 'edit'>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [cadPreviewPart, setCadPreviewPart] = useState<PartItem | null>(null);
  
  // List View Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>(initialFilterStage || 'all');
  
  // Details View Active Tab
  const [detailTab, setDetailTab] = useState<'overview' | 'engineering' | 'cad' | 'bom' | 'documents' | 'manufacturing' | 'quality' | 'dfmea' | 'pfmea' | 'changes' | 'projects' | 'history' | 'audit'>('overview');

  // Stepper State
  const [activeStep, setActiveStep] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isAutoId, setIsAutoId] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // 19 Step List definitions
  const stepsList = [
    { label: 'Basic Info', icon: Box },
    { label: 'Identification', icon: Sliders },
    { label: 'Revision & Version', icon: RefreshCw },
    { label: 'Engineering', icon: Cpu },
    { label: 'Materials', icon: Wrench },
    { label: 'Dimensions', icon: Layers },
    { label: 'CAD & Design', icon: Box },
    { label: 'BOM Structure', icon: FileSpreadsheet },
    { label: 'Manufacturing', icon: Settings },
    { label: 'Procurement', icon: FolderOpen },
    { label: 'Costs', icon: DollarSign },
    { label: 'Quality', icon: ShieldCheck },
    { label: 'DFMEA', icon: ShieldAlert },
    { label: 'PFMEA', icon: AlertTriangle },
    { label: 'Documents', icon: FileText },
    { label: 'Projects', icon: Calendar },
    { label: 'Ownership', icon: Award },
    { label: 'Lifecycle & Approval', icon: Activity },
    { label: 'Review & Submit', icon: CheckCircle2 }
  ];

  // Expanded Form State
  const [formFields, setFormFields] = useState({
    // 01 - Basic Info
    partNumber: '',
    name: '',
    type: 'Component' as PartType,
    category: 'CNC Machined' as PartCategory,
    description: 'Electric Scooter Drivetrain and Mechanical Platform master component specification.',
    productClass: 'Class A',
    productFamily: 'Electric Powertrain',
    productGroup: 'Gears & Drivetrain',
    productLine: 'Gen 2 EV Scooter',
    lifecycleStage: 'concept' as LifecycleStage,
    priority: 'Medium',
    productStatus: 'Draft',

    // 02 - Identification
    internalPartNum: '',
    customerPartNum: '',
    supplierPartNumIdent: '',
    drawingNum: '',
    modelNum: '',
    serialReq: 'Yes',
    barcode: '',
    qrCode: '',
    eanUpc: '',
    productIdentifier: '',

    // 03 - Revision Control (Expanded)
    revision: 'A',
    version: '1.0',
    revisionTitle: 'Initial Product Release',
    revisionDesc: 'Initial engineering development release.',
    revisionReason: 'New Product Introduction (NPI)',
    revisionType: 'Initial Release',
    revisionDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
    prevRevision: 'N/A',
    revisionOwner: currentUser.name,
    changeRequestNum: '',
    engChangeNum: '',
    supersedesRevision: 'None',
    changeSummary: 'First CAD validation cycle.',
    techChangeDesc: 'Case-carburized finish with polished splines.',
    designChangeDesc: 'Added fillet radii to high-stress concentration regions.',
    bomChangeDesc: 'Mapped core carrier and pinion sub-items.',
    materialChangeDesc: 'Selected Aerospace-grade Aluminum 7075-T6.',
    mfgChangeDesc: 'Optimized CNC 5-axis workholding paths.',
    qualityChangeDesc: 'Assigned CMM inspection gauges.',
    docChangeDesc: 'Uploaded primary engineering drawing.',

    // 03 - Change Information
    reasonForChange: 'New Product Introduction (NPI)',
    changeRequestEcr: '',
    ecoNumber: '',
    changeInitiatedBy: currentUser.name,
    changeInitiatedDate: new Date().toISOString().substring(0, 10),
    changePriority: 'Medium',
    changeCategory: 'Design',
    businessJustification: 'Market demand for lightweight drivetrain configurations.',
    technicalJustification: 'FEA models indicate safety factor compliance.',

    // 03 - Impact checkboxes / options
    cadImpact: 'No Impact',
    dwgImpact: 'No Impact',
    model3dImpact: 'No Impact',
    bomImpact: 'No Impact',
    materialImpact: 'No Impact',
    mfgProcessImpact: 'No Impact',
    routingImpact: 'No Impact',
    toolingImpact: 'No Impact',
    fixtureImpact: 'No Impact',
    qualityInspectionImpact: 'No Impact',
    dfmeaImpact: 'No Impact',
    pfmeaImpact: 'No Impact',
    documentImpact: 'No Impact',
    supplierImpact: 'No Impact',
    costImpact: 'No Impact',
    inventoryImpact: 'No Impact',
    customerImpact: 'No Impact',
    impactDescription: '',

    // 03 - Affected Items list
    affectedItems: [] as string[],

    // 03 - Revision Approval Options
    designReviewRequired: 'Yes',
    mfgReviewRequired: 'Yes',
    qualityReviewRequired: 'Yes',
    projectReviewRequired: 'Yes',
    customerApprovalRequired: 'No',
    managementApprovalRequired: 'Yes',

    // 04 - Engineering Info
    engOwner: currentUser.name,
    designEngineer: currentUser.name,
    leadEngineer: 'Alex Rivera, PE',
    engDepartment: 'R&D Mechanical Design',
    designStandard: 'ISO 13920 / ASME Y14.5',
    specification: 'SPEC-MECH-2026-09A',
    designIntent: 'High torsional load compliance with minimum rotating inertia.',
    application: 'Scooter Rear Wheel Hub Drive',
    functionalDesc: 'Provides gear reduction interface from drive shaft to rear wheel carrier assembly.',
    perfReq: 'Max torque: 85 Nm, Max RPM: 4500, Yield Strength > 450 MPa.',
    operatingConditions: 'Ambient temperature: -20°C to 65°C, IP67 enclosure.',
    engNotes: 'Ensure strict heat-treatment specifications to prevent shaft fatigue.',

    // 05 - Material & Physical
    material: 'Aluminum 7075-T6',
    materialGrade: 'Grade T651',
    materialStandard: 'ASTM B211',
    materialSpec: 'QQ-A-225/9',
    materialSupplier: 'Alcoa Aerospace Materials',
    density: '2.81 g/cm³',
    mass: '0.85 kg',
    weightKg: 0.85,
    volume: '302.5 cm³',
    surfaceFinish: 'Ra 1.6 µm anodized',
    heatTreatment: 'T6 Precipitation Hardening',
    hardness: '150 HBW',
    coating: 'Type II Clear Anodize',
    plating: 'N/A',
    corrosionProtection: 'Anodized Layer 15 microns',
    color: 'Metallic Silver',

    // 06 - Dimensions & Geometry
    length: '120.0',
    width: '120.0',
    height: '65.0',
    diameter: '120.0',
    thickness: '12.0',
    boundingBox: '120mm x 120mm x 65mm',
    toleranceClass: 'ISO 2768-m (Medium)',
    generalTolerance: '±0.1 mm',
    units: 'mm',
    dimNotes: 'Dimensions measured after surface coating. Critical bores check with go/no-go gauges.',

    // 07 - CAD Info
    cadSystem: 'SolidWorks 2025',
    cadFileName: '',
    cadFileType: 'STEP',
    cadVersion: 'SW-25.2',
    cadModelId: '',
    drawingFile: '',
    threeModel: '',
    twoDrawing: '',
    cadOwner: currentUser.name,
    cadStatus: 'In Work',

    // 08 - BOM Info
    bomType: 'EBOM',
    bomStructure: 'Multi-Level',
    bomRevision: 'Rev A',
    bomOwner: currentUser.name,
    bomStatus: 'In Review',

    // 09 - Manufacturing Data
    mfgEngineer: 'Marcus Vance',
    mfgDepartment: 'Advanced Process Planning',
    mfgMethod: 'Machining',
    processType: '5-Axis CNC Milling',
    productionType: 'Batch Production',
    workCenter: 'WC-MILL-05',
    machine: 'Haas UMC-750 5-Axis Milling Machine',
    routing: 'OP10 Rough Milling -> OP20 Heat Treatment -> OP30 Precision Finish grinding',
    operation: 'OP10 Turning & CNC Pocket Milling',
    tooling: 'Cutter End Mill 12mm Carbide',
    fixture: 'JIG-HEX-120A',
    mfgLocation: 'Floor A - Precision Machining Cell',
    leadTimeDays: '15',
    cycleTimeMin: '22',
    batchSize: '100',

    // 10 - Procurement & Supplier
    makeBuy: 'Make',
    preferredSupplier: 'VND-ALU-404 - Alpha Machining Group',
    supplierCode: 'VND-ALU-404',
    supplierPartNum: 'SUP-7075-SHAFT-1',
    supplierContact: 'sales@alphamachining.com',
    procureLeadTime: '4 weeks',
    moq: '50',
    purchaseUnit: 'pcs',
    standardCost: 45.0,
    targetCost: 55.0,
    currency: 'USD',

    // 11 - Cost & Commercial
    estimatedCost: 45.0,
    materialCost: 20.0,
    laborCost: 15.0,
    mfgCost: 8.0,
    toolingCost: 2.0,
    overheadCost: 3.0,
    sellingPrice: 120.0,

    // 12 - Quality Requirements
    qualityEngineer: 'Dr. Elena Rostova',
    qualityLevel: 'AQL 1.0 (Critical)',
    inspectionRequired: 'Yes',
    inspectionPlan: 'IP-HUB-2026-C',
    inspectionStandard: 'ISO 2859-1',
    criticalChar: 'Central Bore ID: 35.005mm +0.010/-0.000',
    specialChar: 'Flange Parallelism: 0.05 mm max deviation',
    acceptanceCriteria: 'No surface defects, zero micro-cracks under dye-penetrant test.',
    qualityStatus: 'Pending Inspection',

    // 13 - DFMEA
    dfmeaRequired: 'Yes',
    dfmeaOwner: 'Alex Rivera, PE',
    dfmeaStatus: 'In Progress',
    riskClass: 'High Speed Rotary Drive',
    dfmeaSeverity: 8,
    dfmeaOccurrence: 3,
    dfmeaDetection: 4,
    dfmeaRpn: 96,
    dfmeaAction: 'Implement dual lip rotary oil seal and regular bearing wear audits.',

    // 14 - PFMEA
    pfmeaRequired: 'Yes',
    pfmeaOwner: 'Marcus Vance',
    pfmeaStatus: 'Draft',
    pfmeaProcessRisk: 'OP10 Flange clamping distortion',
    pfmeaSeverity: 6,
    pfmeaOccurrence: 4,
    pfmeaDetection: 5,
    pfmeaRpn: 120,
    pfmeaAction: 'Introduce hydraulic torque limiters on milling fixtures.',

    // 15 - Documents Info
    docNumber: '',
    docType: 'CAD Drawing',
    docRevision: 'A.1',
    docOwner: currentUser.name,
    docStatus: 'Approved',

    // 16 - Project Program
    projectId: 'PRJ-01',
    program: 'EV Scooter Gen 2',
    customer: 'CityGlide Urban Mobility',
    projectManager: 'David Sterling',
    projectPhase: 'Prototype & DFM Review',
    milestone: 'MS-2 Stage Gate Approval',
    targetReleaseDate: '2026-11-15'
  });

  // Local BOM components state during product creation (empty by default)
  const [bomComponents, setBomComponents] = useState<{
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    material: string;
    unitCost: number;
  }[]>([]);

  // State for adding a new manual BOM component
  const [isAddingBomComponent, setIsAddingBomComponent] = useState(false);
  const [newBomComponent, setNewBomComponent] = useState({
    partId: '',
    partNumber: '',
    name: '',
    quantity: 1,
    material: 'Aluminum 6061-T6',
    unitCost: 45
  });

  // Uploaded Files Lists (Simulated Storage)
  const [uploaded3DFiles, setUploaded3DFiles] = useState<UploadedFile[]>([]);
  const [uploaded2DFiles, setUploaded2DFiles] = useState<UploadedFile[]>([]);
  const [uploaded3DDocs, setUploaded3DDocs] = useState<UploadedFile[]>([]);
  const [uploadedProjectDocs, setUploadedProjectDocs] = useState<UploadedFile[]>([]);

  // Drag and drop state indicators
  const [isDragOver3D, setIsDragOver3D] = useState(false);
  const [isDragOver2D, setIsDragOver2D] = useState(false);
  const [isDragOver3DDoc, setIsDragOver3DDoc] = useState(false);
  const [isDragOverProjDoc, setIsDragOverProjDoc] = useState(false);

  // Stepper completion checks array
  const [stepCompletion, setStepCompletion] = useState<boolean[]>(new Array(19).fill(false));

  // Auto-generation of Product Numbers (only for brand-new products, NEVER when editing)
  useEffect(() => {
    if (isAutoId && viewMode === 'create' && !editingProductId) {
      let candidateNum = parts.length > 0 
        ? Math.max(...parts.map(p => {
            const num = parseInt(p.id.replace('PN-', ''));
            return isNaN(num) ? 1000 : num;
          })) + 1
        : 1007;

      // Prevent recreating permanently deleted Product IDs
      while (isProductIdDeleted(`PN-${candidateNum}`)) {
        candidateNum++;
      }
      const nextId = `PN-${candidateNum}`;
      const activeProj = projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId) || projects[0];

      setFormFields(prev => ({
        ...prev,
        partNumber: nextId,
        name: prev.name || (activeProj?.releasedProduct || `${activeProj?.name || 'Electric Scooter'} Drivetrain & Frame Assembly`),
        internalPartNum: nextId,
        drawingNum: `DWG-${nextId}`,
        modelNum: `MOD-${nextId}`,
        cadFileName: `${nextId}-ASSEMBLY.STEP`,
        cadModelId: `CAD-${nextId}`,
        drawingFile: `DRW-${nextId}.pdf`,
        docNumber: `DOC-${nextId}`,
        description: prev.description || 'Electric Scooter Drivetrain and Mechanical Platform master component specification.'
      }));
    }
  }, [isAutoId, viewMode, parts, editingProductId, projects, formFields.projectId]);

  // Sync external filterStage requests
  useEffect(() => {
    if (initialFilterStage) {
      setFilterStage(initialFilterStage);
    }
  }, [initialFilterStage]);

  // Restore draft state from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('apex_plm_product_creation_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formFields) {
          if (!parsed.formFields.description) {
            parsed.formFields.description = 'Electric Scooter Drivetrain and Mechanical Platform master component specification.';
          }
          setFormFields(parsed.formFields);
        }
        if (parsed.bomComponents) setBomComponents(parsed.bomComponents);
        if (parsed.activeStep !== undefined) setActiveStep(parsed.activeStep);
        if (parsed.stepCompletion) setStepCompletion(parsed.stepCompletion);
        if (parsed.uploaded3DFiles) setUploaded3DFiles(parsed.uploaded3DFiles);
        if (parsed.uploaded2DFiles) setUploaded2DFiles(parsed.uploaded2DFiles);
        if (parsed.uploaded3DDocs) setUploaded3DDocs(parsed.uploaded3DDocs);
        if (parsed.uploadedProjectDocs) setUploadedProjectDocs(parsed.uploadedProjectDocs);
        if (parsed.lastSaved) setLastSaved(parsed.lastSaved);
      }
    } catch (e) {
      console.error('Failed to restore draft state:', e);
    }
  }, []);

  // Sync selected product ID with parent state
  useEffect(() => {
    if (selectedProductId) {
      onSelectPart(selectedProductId);
    }
  }, [selectedProductId, onSelectPart]);


  // Auto-connect with activeProjectId when passed from Project Workspace
  useEffect(() => {
    if (activeProjectId && projects.length > 0) {
      const targetPrj = projects.find(p => p.id === activeProjectId || p.code === activeProjectId);
      if (targetPrj) {
        const generatedPn = `PN-${targetPrj.code.replace('PRJ-', '')}`;
        const generatedName = targetPrj.releasedProduct || `${targetPrj.name} Master Assembly`;
        setFormFields(prev => ({
          ...prev,
          projectId: targetPrj.id,
          partNumber: generatedPn,
          name: generatedName,
          program: targetPrj.program || prev.program,
          customer: targetPrj.customer || prev.customer
        }));
        setViewMode('create');
        setActiveStep(0);
      }
    }
  }, [activeProjectId, projects]);

  // Save draft state function
  const saveDraftState = (stepToSave?: number, completionToSave?: boolean[]) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stripDataUrl = (files: UploadedFile[]) => files.map(f => ({ ...f, dataUrl: undefined }));
    const dataToSave = {
      formFields,
      bomComponents,
      activeStep: stepToSave !== undefined ? stepToSave : activeStep,
      stepCompletion: completionToSave || stepCompletion,
      uploaded3DFiles: stripDataUrl(uploaded3DFiles),
      uploaded2DFiles: stripDataUrl(uploaded2DFiles),
      uploaded3DDocs: stripDataUrl(uploaded3DDocs),
      uploadedProjectDocs: stripDataUrl(uploadedProjectDocs),
      lastSaved: timestamp
    };
    try {
      localStorage.setItem('apex_plm_product_creation_draft', JSON.stringify(dataToSave));
      setLastSaved(timestamp);
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  };

  // Dynamic Product Completion Calculation (100% AUTO-CALCULATED from completed Product Master steps)
  const calculateProductProgress = (stepCompletionArr: boolean[]): number => {
    const completedCount = stepCompletionArr.filter(Boolean).length;
    return Math.min(100, Math.round((completedCount / 19) * 100));
  };

  const getProductAutoStatus = (completedSteps: number): { label: string; stage: LifecycleStage } => {
    if (completedSteps >= 19) {
      return { label: 'COMPLETED / RELEASE-READY', stage: 'production' };
    }
    if (completedSteps > 0) {
      return { label: 'IN PROGRESS', stage: 'design' };
    }
    return { label: 'NOT STARTED', stage: 'concept' };
  };

  const completedStepsCount = stepCompletion.filter(Boolean).length;
  const currentProductProgress = calculateProductProgress(stepCompletion);
  const currentProductStatusObj = getProductAutoStatus(completedStepsCount);
  const currentProductStatus = currentProductStatusObj.label;

  // Helper for Product Master Dashboard filters
  const isPartMatchingFilter = (part: PartItem, filter: string): boolean => {
    if (filter === 'all' || !filter) return true;
    if (filter === 'draft') {
      return part.lifecycleStage === 'concept' || (part.productStatus || '').toLowerCase().includes('draft');
    }
    if (filter === 'under_review') {
      return part.lifecycleStage === 'design' || part.lifecycleStage === 'prototype' || (part.productStatus || '').toLowerCase().includes('review');
    }
    if (filter === 'released') {
      return part.lifecycleStage === 'production' || (part.completionPercent === 100) || (part.productStatus || '').toLowerCase().includes('released') || (part.productStatus || '').toLowerCase().includes('complete');
    }
    return true;
  };

  // Open existing Product Master for editing (preserves Product ID permanently, pre-fills all data)
  const handleOpenEditProduct = (part: PartItem) => {
    setEditingProductId(part.id);
    setSelectedProductId(part.id);
    if (onSelectPart) onSelectPart(part.id);

    // Extract revision info
    const revMatch = part.currentRev?.match(/Rev\s*([A-Z0-9]+)(?:\s*\((.*?)\))?/i);
    const revCode = revMatch ? revMatch[1] : (part.currentRev || 'A');
    const verCode = revMatch && revMatch[2] ? revMatch[2] : '1.0';

    // Parse dimensions if available
    const dims = part.cadMetadata?.boundingDimensionsMm || [100, 100, 50];

    // Pre-populate form fields from the existing product
    setFormFields({
      // 01 - Basic Info
      partNumber: part.partNumber,
      name: part.name,
      type: part.type || 'Component',
      category: part.category || 'CNC Machined',
      description: part.description || `${part.name} engineering product master record.`,
      productClass: (part as any).productClass || 'Class A',
      productFamily: part.cadMetadata?.familyGroup || 'Electric Powertrain',
      productGroup: 'Gears & Drivetrain',
      productLine: 'Gen 2 EV Scooter',
      lifecycleStage: part.lifecycleStage || 'concept',
      priority: 'Medium',
      productStatus: part.productStatus || 'Draft',

      // 02 - Identification
      internalPartNum: part.partNumber,
      customerPartNum: (part as any).customerPartNum || '',
      supplierPartNumIdent: part.cadMetadata?.supplierCode || '',
      drawingNum: `DWG-${part.partNumber}`,
      modelNum: `MOD-${part.partNumber}`,
      serialReq: 'Yes',
      barcode: `BC-${part.partNumber}`,
      qrCode: `QR-${part.partNumber}`,
      eanUpc: '',
      productIdentifier: part.id,

      // 03 - Revision Control
      revision: revCode,
      version: verCode,
      revisionTitle: part.revisionHistory?.[0]?.changeSummary || 'Product Revision',
      revisionDesc: part.description || 'Mechanical product master revision.',
      revisionReason: 'Engineering Optimization',
      revisionType: 'Standard Revision',
      revisionDate: part.revisionHistory?.[0]?.date || new Date().toISOString().substring(0, 10),
      effectiveDate: new Date().toISOString().substring(0, 10),
      prevRevision: part.revisionHistory?.[1]?.revId || 'N/A',
      revisionOwner: part.revisionHistory?.[0]?.author || currentUser.name,
      changeRequestNum: '',
      engChangeNum: '',
      supersedesRevision: 'None',
      changeSummary: part.revisionHistory?.[0]?.changeSummary || 'Updated CAD and BOM telemetry.',
      techChangeDesc: 'Production specification conformity.',
      designChangeDesc: 'Geometric tolerance validation.',
      bomChangeDesc: 'Verified component allocations.',
      materialChangeDesc: `Verified ${part.material}.`,
      mfgChangeDesc: 'Optimized CNC process routing.',
      qualityChangeDesc: 'AQL 1.0 inspection compliance.',
      docChangeDesc: 'Controlled CAD vault release.',

      // 03 - Change Information
      reasonForChange: 'Product Lifecycle Progression',
      changeRequestEcr: '',
      ecoNumber: '',
      changeInitiatedBy: currentUser.name,
      changeInitiatedDate: new Date().toISOString().substring(0, 10),
      changePriority: 'Medium',
      changeCategory: 'Design',
      businessJustification: 'Continuous PLM data synchronization.',
      technicalJustification: 'Engineering release readiness.',

      // 03 - Impact checkboxes / options
      cadImpact: 'No Impact',
      dwgImpact: 'No Impact',
      model3dImpact: 'No Impact',
      bomImpact: 'No Impact',
      materialImpact: 'No Impact',
      mfgProcessImpact: 'No Impact',
      routingImpact: 'No Impact',
      toolingImpact: 'No Impact',
      fixtureImpact: 'No Impact',
      qualityInspectionImpact: 'No Impact',
      dfmeaImpact: 'No Impact',
      pfmeaImpact: 'No Impact',
      documentImpact: 'No Impact',
      supplierImpact: 'No Impact',
      costImpact: 'No Impact',
      inventoryImpact: 'No Impact',
      customerImpact: 'No Impact',
      impactDescription: '',

      // 03 - Affected Items list
      affectedItems: [part.partNumber],

      // 03 - Revision Approval Options
      designReviewRequired: 'Yes',
      mfgReviewRequired: 'Yes',
      qualityReviewRequired: 'Yes',
      projectReviewRequired: 'Yes',
      customerApprovalRequired: 'No',
      managementApprovalRequired: 'Yes',

      // 04 - Engineering Info
      engOwner: currentUser.name,
      designEngineer: currentUser.name,
      leadEngineer: 'Alex Rivera, PE',
      engDepartment: 'R&D Mechanical Design',
      designStandard: 'ISO 13920 / ASME Y14.5',
      specification: `SPEC-${part.partNumber}`,
      designIntent: 'High torsional load compliance with minimum rotating inertia.',
      application: 'Mechanical Assembly Drive',
      functionalDesc: part.description || 'Structural and mechanical drive component.',
      perfReq: 'Operating load tolerance within design envelope.',
      operatingConditions: 'Ambient temperature: -20°C to 65°C, IP67 enclosure.',
      engNotes: 'Complies with PLM engineering standards.',

      // 05 - Material & Physical
      material: part.material || 'Aluminum 7075-T6',
      materialGrade: 'Grade T651',
      materialStandard: 'ASTM B211',
      materialSpec: 'QQ-A-225/9',
      materialSupplier: 'Alcoa Aerospace Materials',
      density: '2.81 g/cm³',
      mass: `${part.weightKg || 1} kg`,
      weightKg: part.weightKg || 1,
      volume: `${part.cadMetadata?.volumeCm3 || 250} cm³`,
      surfaceFinish: 'Ra 1.6 µm anodized',
      heatTreatment: 'T6 Precipitation Hardening',
      hardness: '150 HBW',
      coating: 'Type II Clear Anodize',
      plating: 'N/A',
      corrosionProtection: 'Anodized Layer 15 microns',
      color: 'Metallic Silver',

      // 06 - Dimensions & Geometry
      length: String(dims[0] || 100),
      width: String(dims[1] || 100),
      height: String(dims[2] || 50),
      diameter: String(dims[0] || 100),
      thickness: '12.0',
      boundingBox: `${dims[0]}mm x ${dims[1]}mm x ${dims[2]}mm`,
      toleranceClass: 'ISO 2768-m (Medium)',
      generalTolerance: '±0.1 mm',
      units: 'mm',
      dimNotes: 'Dimensions verified against 3D CAD master model.',

      // 07 - CAD Info
      cadSystem: 'SolidWorks 2025',
      cadFileName: part.cadMetadata?.fileName || `${part.partNumber}.STEP`,
      cadFileType: part.cadMetadata?.format || 'STEP',
      cadVersion: 'SW-25.2',
      cadModelId: `CAD-${part.partNumber}`,
      drawingFile: `DRW-${part.partNumber}.pdf`,
      threeModel: part.cadMetadata?.fileName || '',
      twoDrawing: '',
      cadOwner: currentUser.name,
      cadStatus: 'Approved',

      // 08 - BOM Info
      bomType: 'EBOM',
      bomStructure: 'Multi-Level',
      bomRevision: `Rev ${revCode}`,
      bomOwner: currentUser.name,
      bomStatus: 'Approved',

      // 09 - Manufacturing Data
      mfgEngineer: 'Marcus Vance',
      mfgDepartment: 'Advanced Process Planning',
      mfgMethod: 'Machining',
      processType: '5-Axis CNC Milling',
      productionType: 'Batch Production',
      workCenter: 'WC-MILL-05',
      machine: 'Haas UMC-750 5-Axis Milling Machine',
      routing: 'OP10 Rough Milling -> OP20 Heat Treatment -> OP30 Precision Finish grinding',
      operation: 'OP10 Turning & CNC Pocket Milling',
      tooling: 'Cutter End Mill 12mm Carbide',
      fixture: 'JIG-HEX-120A',
      mfgLocation: 'Floor A - Precision Machining Cell',
      leadTimeDays: '15',
      cycleTimeMin: '22',
      batchSize: '100',

      // 10 - Procurement & Supplier
      makeBuy: 'Make',
      preferredSupplier: part.cadMetadata?.supplierCode ? `Supplier (${part.cadMetadata.supplierCode})` : 'Alpha Machining Group',
      supplierCode: part.cadMetadata?.supplierCode || 'VND-ALU-404',
      supplierPartNum: `SUP-${part.partNumber}`,
      supplierContact: 'sales@alphamachining.com',
      procureLeadTime: '4 weeks',
      moq: '50',
      purchaseUnit: 'pcs',
      standardCost: part.actualCost || 45.0,
      targetCost: part.estimatedCost || 55.0,
      currency: 'USD',

      // 11 - Cost & Commercial
      estimatedCost: part.estimatedCost || 45.0,
      materialCost: (part.estimatedCost ? part.estimatedCost * 0.45 : 20.0),
      laborCost: (part.estimatedCost ? part.estimatedCost * 0.35 : 15.0),
      mfgCost: (part.estimatedCost ? part.estimatedCost * 0.20 : 8.0),
      toolingCost: 2.0,
      overheadCost: 3.0,
      sellingPrice: (part.estimatedCost ? part.estimatedCost * 1.5 : 120.0),

      // 12 - Quality Requirements
      qualityEngineer: 'Dr. Elena Rostova',
      qualityLevel: 'AQL 1.0 (Critical)',
      inspectionRequired: 'Yes',
      inspectionPlan: `IP-${part.partNumber}`,
      inspectionStandard: 'ISO 2859-1',
      criticalChar: 'Bore tolerance: ±0.010mm',
      specialChar: 'Parallelism: 0.05mm max deviation',
      acceptanceCriteria: 'Zero defects under penetrant and CMM verification.',
      qualityStatus: 'Approved',

      // 13 - DFMEA
      dfmeaRequired: 'Yes',
      dfmeaOwner: 'Alex Rivera, PE',
      dfmeaStatus: 'Approved',
      riskClass: 'Mechanical Drive Assembly',
      dfmeaSeverity: 7,
      dfmeaOccurrence: 2,
      dfmeaDetection: 3,
      dfmeaRpn: 42,
      dfmeaAction: 'Fillet radius optimization.',

      // 14 - PFMEA
      pfmeaRequired: 'Yes',
      pfmeaOwner: 'Marcus Vance',
      pfmeaStatus: 'Approved',
      pfmeaProcessRisk: 'Hydraulic clamping variation',
      pfmeaSeverity: 5,
      pfmeaOccurrence: 2,
      pfmeaDetection: 4,
      pfmeaRpn: 40,
      pfmeaAction: 'Pressure check interlocks.',

      // 15 - Documents Info
      docNumber: `DOC-${part.partNumber}`,
      docType: 'CAD Drawing',
      docRevision: `Rev ${revCode}`,
      docOwner: currentUser.name,
      docStatus: 'Approved',

      // 16 - Project Program
      projectId: part.projectId || projects[0]?.id || 'PRJ-01',
      program: part.projectName || 'EV Scooter Development',
      customer: 'Apex Automotive Systems',
      projectManager: 'David Sterling',
      projectPhase: 'Production Release',
      milestone: 'PLM Stage Gate Release',
      targetReleaseDate: '2026-12-31'
    });

    // Populate BOM components from bomTrees
    const existingBom = bomTrees[part.id] || bomTrees[part.partNumber];
    if (existingBom?.children && existingBom.children.length > 0) {
      setBomComponents(existingBom.children.map(c => ({
        partId: c.partId || c.id,
        partNumber: c.partNumber,
        name: c.name,
        quantity: c.quantity || 1,
        material: c.material || 'Aluminum 6061-T6',
        unitCost: c.unitCost || 0
      })));
    } else {
      setBomComponents([]);
    }

    // Populate attached files
    const allFiles = [
      ...getStoredCadVaultFiles(part.id),
      ...getStoredCadVaultFiles(part.partNumber),
      ...(part.cadMetadata?.attachedFiles || [])
    ].filter((f, idx, arr) => arr.findIndex(x => x.id === f.id || (x.fileName === f.fileName && x.dataUrl === f.dataUrl)) === idx);

    setUploaded3DFiles(allFiles.filter(f => f.category === 'cad' || f.fileType !== 'PDF').map(f => ({
      id: f.id,
      name: f.fileName,
      type: f.fileType,
      size: f.fileSize,
      progress: 100,
      status: 'Complete' as const,
      uploadedBy: f.uploadedBy,
      uploadedDate: f.uploadDate,
      dataUrl: f.dataUrl,
      productId: part.id,
      projectId: part.projectId,
      category: 'cad' as const
    })));

    setUploaded2DFiles(allFiles.filter(f => f.category === 'drawing' || f.fileType === 'PDF').map(f => ({
      id: f.id,
      name: f.fileName,
      type: f.fileType,
      size: f.fileSize,
      progress: 100,
      status: 'Complete' as const,
      uploadedBy: f.uploadedBy,
      uploadedDate: f.uploadDate,
      dataUrl: f.dataUrl,
      productId: part.id,
      projectId: part.projectId,
      category: 'drawing' as const
    })));

    // Calculate completed steps based on product status
    const initialCompletedSteps = part.completionPercent !== undefined
      ? Math.round((part.completionPercent / 100) * 19)
      : (part.lifecycleStage === 'production' ? 19 : part.lifecycleStage === 'prototype' ? 14 : 9);

    setStepCompletion(new Array(19).fill(false).map((_, i) => i < initialCompletedSteps));
    setActiveStep(0);
    setErrors({});
    setViewMode('edit');
  };

  // ADMIN-ONLY: Permanent system-wide Product Deletion across all modules
  const handleConfirmDeleteProduct = async (partToDelete: PartItem) => {
    if (!isAdmin) {
      alert('Access Denied: Only users with the ADMIN role are permitted to delete Product Master records.');
      return;
    }
    if (!partToDelete) return;

    setIsDeleting(true);
    const targetId = partToDelete.id;
    const targetPn = partToDelete.partNumber;
    const targetName = partToDelete.name;

    try {
      // 1. Permanently delete from MongoDB Atlas via backend API
      try {
        await partsApi.delete(targetId);
      } catch (err: any) {
        console.warn('Backend partsApi delete (ID) failed:', err.message);
      }

      if (targetPn && targetPn !== targetId) {
        try {
          await partsApi.delete(targetPn);
        } catch {
          // Ignore if already deleted by ID
        }
      }

      try {
        await bomApi.delete(targetId);
      } catch {
        // Ignore BOM delete error if not present
      }

      if (targetPn && targetPn !== targetId) {
        try {
          await bomApi.delete(targetPn);
        } catch {
          // Ignore
        }
      }

      // 3. Permanently delete from Product Master local state and storage
      setParts(prev => {
        const next = prev.filter(p => p.id !== targetId && p.partNumber !== targetPn);
        try {
          localStorage.setItem('apex_plm_parts', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // 4. Permanently purge CAD Files and associated Vault metadata
      purgeStoredCadVaultFiles(targetId);
      purgeStoredCadVaultFiles(targetPn);

      // 5. Permanently purge BOM / EBOM / MBOM trees and remove from child BOM references
      setBomTrees(prev => {
        const next = { ...prev };
        delete next[targetId];
        delete next[targetPn];
        Object.keys(next).forEach(treeKey => {
          if (next[treeKey]?.children) {
            next[treeKey] = {
              ...next[treeKey],
              children: next[treeKey].children.filter(
                c => c.partId !== targetId && c.partNumber !== targetPn && c.id !== targetId
              )
            };
          }
        });
        try {
          localStorage.setItem('apex_plm_bom_trees', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // 6. Permanently purge Engineering Documents & Drawings
      setDocuments(prev => {
        const next = prev.filter(
          d => d.linkedPartId !== targetId && 
               d.linkedPartId !== targetPn && 
               !d.docNumber.includes(targetPn) && 
               !d.docNumber.includes(targetId)
        );
        try {
          localStorage.setItem('apex_plm_documents', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // 7. Permanently purge DFMEA and PFMEA records
      setDfmeaRows(prev => {
        const next = prev.filter(
          r => r.linkedCadId !== targetId && 
               r.linkedCadId !== targetPn && 
               !r.component.includes(targetPn) && 
               !r.component.includes(targetId)
        );
        try {
          localStorage.setItem('apex_plm_dfmea', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      setPfmeaRows(prev => {
        const next = prev.filter(
          r => r.linkedPartId !== targetId && 
               r.linkedPartId !== targetPn && 
               !r.processStep.includes(targetPn) && 
               !r.processStep.includes(targetId)
        );
        try {
          localStorage.setItem('apex_plm_pfmea', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // 8. Permanently purge Engineering Changes (ECRs / ECOs)
      if (setEcrs) {
        setEcrs(prev => {
          const next = prev.filter(
            e => e.targetProductId !== targetId && 
                 e.targetProductId !== targetPn && 
                 !(e.impactedPartIds && (e.impactedPartIds.includes(targetId) || e.impactedPartIds.includes(targetPn)))
          );
          try {
            localStorage.setItem('apex_plm_ecrs', JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }

      // 9. Permanently purge Quality / NCR / CAPA records
      if (setNcrs) {
        setNcrs(prev => {
          const next = prev.filter(
            n => n.linkedPartId !== targetId && 
                 n.linkedPartId !== targetPn && 
                 n.targetPartNumber !== targetPn && 
                 n.targetPartNumber !== targetId &&
                 !(n.productAssembly && (n.productAssembly.includes(targetPn) || n.productAssembly.includes(targetId)))
          );
          try {
            localStorage.setItem('apex_plm_ncrs_v1', JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }

      // 10. Permanently purge inventory links
      if (setInventory) {
        setInventory(prev => {
          const next = prev.filter(
            inv => inv.id !== targetId && 
                   inv.sku !== targetPn && 
                   inv.sku !== targetId &&
                   !(inv.name && inv.name.includes(targetPn))
          );
          try {
            localStorage.setItem('apex_plm_inventory', JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }

      // 11. Clean project linkages without deleting unrelated projects
      setProjects(prev => {
        const next = prev.map(proj => {
          if (proj.linkedPartId === targetId || proj.linkedPartId === targetPn || proj.releasedProduct === targetName) {
            return {
              ...proj,
              linkedPartId: undefined,
              releasedProduct: undefined,
              finalApproval: undefined,
              finalRevision: undefined
            };
          }
          return proj;
        });
        try {
          localStorage.setItem('apex_plm_projects', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // 12. Purge localStorage drafts and caches
      try {
        localStorage.removeItem('apex_plm_product_creation_draft');
        localStorage.removeItem(`apex_product_${targetId}`);
        localStorage.removeItem(`apex_product_${targetPn}`);
        localStorage.removeItem(`apex_vault_meta_${targetId}`);
        localStorage.removeItem(`apex_vault_meta_${targetPn}`);
        localStorage.removeItem(`apex_vault_file_${targetId}_cad`);
        localStorage.removeItem(`apex_vault_file_${targetPn}_cad`);
        localStorage.removeItem(`apex_vault_file_${targetId}_pdf`);
        localStorage.removeItem(`apex_vault_file_${targetPn}_pdf`);
      } catch (e) {
        console.warn('Storage purge error:', e);
      }

      // 13. Record deletion in Audit Trail with ADMIN info, Product ID, timestamp, and details
      logAction(
        'Product Master Permanently Deleted',
        'SYSTEM',
        targetPn,
        `ADMIN (${currentUser.name} / ${currentUser.email} [${currentUser.systemRole || 'ADMIN'}]) permanently deleted Product Master "${targetName}" (${targetPn}, ID: ${targetId}) across the entire PLM system. Purged from MongoDB Atlas, CAD files, BOM trees, engineering documents, DFMEA/PFMEA, ECR/ECO records, NCR quality logs, and project associations.`
      );

      // Dispatch global sync events across all open browser sessions/tabs
      window.dispatchEvent(new CustomEvent('plm:part-sync'));
      window.dispatchEvent(new CustomEvent('plm:project-sync'));

      // 14. State cleanup and return to list view
      setProductToDelete(null);
      if (selectedProductId === targetId) {
        setSelectedProductId(null);
        setViewMode('list');
      }
      if (editingProductId === targetId) {
        setEditingProductId(null);
        setViewMode('list');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Sync Product creation progress directly with related project milestones
  const syncMilestonesWithProject = (
    targetProjectId: string, 
    currentStepIndex: number, 
    stepCompletionArray: boolean[], 
    isProductFinalized: boolean = false
  ) => {
    if (!targetProjectId) return;

    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        if (proj.id !== targetProjectId && proj.code !== targetProjectId) return proj;

        const updatedTasks = proj.tasks.map(t => {
          const taskNum = t.taskNumber || '';
          let taskProgress = t.progressPercent;
          let taskStatus = t.status;

          const isAll19Done = stepCompletionArray.filter(Boolean).length >= 19;
          if (isProductFinalized || isAll19Done) {
            taskProgress = 100;
            taskStatus = 'Completed';
          } else {
            // Map 19 product master steps to the 16 project milestone gates
            if (taskNum === '01') { // 01 Requirements Definition
              if (currentStepIndex >= 0 && stepCompletionArray[0]) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 0) {
                taskProgress = 50; taskStatus = 'In Progress';
              }
            } else if (taskNum === '02') { // 02 3D CAD Modeling
              if (currentStepIndex >= 6 || uploaded3DFiles.length > 0) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 4) {
                taskProgress = 60; taskStatus = 'In Progress';
              }
            } else if (taskNum === '03') { // 03 2D Drawing
              if (currentStepIndex >= 6 || uploaded2DFiles.length > 0) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 5) {
                taskProgress = 50; taskStatus = 'In Progress';
              }
            } else if (taskNum === '04') { // 04 Engineering Review
              if (currentStepIndex >= 3 && stepCompletionArray[2]) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 2) {
                taskProgress = 75; taskStatus = 'In Progress';
              }
            } else if (taskNum === '05') { // 05 EBOM Creation
              if (currentStepIndex >= 7 && (bomComponents.length > 0 || stepCompletionArray[7])) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 7) {
                taskProgress = 60; taskStatus = 'In Progress';
              }
            } else if (taskNum === '06') { // 06 DFMEA
              if (currentStepIndex >= 12) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 11) {
                taskProgress = 50; taskStatus = 'In Progress';
              }
            } else if (taskNum === '07') { // 07 Prototype Development
              if (currentStepIndex >= 15) {
                taskProgress = 100; taskStatus = 'Completed';
              } else if (currentStepIndex >= 10) {
                taskProgress = 50; taskStatus = 'In Progress';
              }
            } else if (taskNum === '08') { // 08 CAPP / Process Planning
              if (currentStepIndex >= 8) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '09') { // 09 MBOM Creation
              if (currentStepIndex >= 8) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '10') { // 10 PFMEA
              if (currentStepIndex >= 13) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '11') { // 11 Manufacturing Review
              if (currentStepIndex >= 14) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '12') { // 12 Quality Inspection
              if (currentStepIndex >= 11) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '13') { // 13 Final Engineering Approval
              if (currentStepIndex >= 17) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            } else if (taskNum === '14') { // 14 Product Release
              if (currentStepIndex >= 18) {
                taskProgress = 100; taskStatus = 'Completed';
              }
            }
          }

          return {
            ...t,
            progressPercent: taskProgress,
            status: taskStatus,
            completedDate: taskStatus === 'Completed' ? (t.completedDate || new Date().toISOString().substring(0, 10)) : undefined,
            completedBy: taskStatus === 'Completed' ? (t.completedBy || currentUser.name) : undefined
          };
        });

        // Calculate project total progress from milestone weights
        const totalCompletedWeight = updatedTasks.reduce((sum, t) => {
          if (t.status === 'Completed' || t.progressPercent === 100) {
            return sum + (t.weight || 0);
          }
          return sum + ((t.weight || 0) * (t.progressPercent || 0) / 100);
        }, 0);

        const isAll19Done = stepCompletionArray.filter(Boolean).length >= 19;
        const newProjProgress = (isProductFinalized || isAll19Done) ? 100 : Math.min(100, Math.round(totalCompletedWeight));
        const newProjStatus: Project['status'] = newProjProgress === 100 
          ? 'Completed' 
          : newProjProgress > 0 
          ? 'In Progress' 
          : 'Not Started';

        return {
          ...proj,
          tasks: updatedTasks,
          completionPercent: newProjProgress,
          status: newProjStatus,
          completedDate: newProjProgress === 100 ? (proj.completedDate || new Date().toISOString().substring(0, 10)) : undefined,
          completedBy: newProjProgress === 100 ? (proj.completedBy || currentUser.name) : undefined,
          releasedProduct: newProjProgress === 100 ? formFields.name : proj.releasedProduct,
          linkedPartId: formFields.partNumber || proj.linkedPartId,
          finalRevision: newProjProgress === 100 ? `Rev ${formFields.revision}.${formFields.version || '0'}` : proj.finalRevision
        };
      });
    });
  };

  // Trigger auto-save on field edits
  const handleFieldChange = (fields: Partial<typeof formFields>) => {
    setFormFields(prev => {
      const next = { ...prev, ...fields };
      // Save changes asynchronously
      setTimeout(() => {
        saveDraftState();
        if (next.projectId) {
          syncMilestonesWithProject(next.projectId, activeStep, stepCompletion, false);
        }
      }, 0);
      return next;
    });

    // Automatically clear errors for the fields being edited
    const updatedKeys = Object.keys(fields);
    setErrors(prev => {
      if (!updatedKeys.some(k => prev[k])) return prev;
      const next = { ...prev };
      updatedKeys.forEach(k => delete next[k]);
      if (Object.keys(next).length === 0) {
        setValidationAlert(null);
      }
      return next;
    });
  };

  // Clear draft storage
  const clearDraftState = () => {
    try {
      localStorage.removeItem('apex_plm_product_creation_draft');
      setLastSaved('');
      setBomComponents([]);
      setIsAddingBomComponent(false);
    } catch (e) {
      console.error('Failed to clear draft:', e);
    }
  };

  // Section Validation Engine
  const validateActiveStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) { // 01 Basic Info
      const activeProj = projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId) || projects[0];
      const targetPn = formFields.partNumber || `PN-${activeProj?.code.replace('PRJ-', '') || '3003'}`;
      const targetName = formFields.name || activeProj?.releasedProduct || `${activeProj?.name || 'Electric Scooter'} Drivetrain & Frame Assembly`;

      if (!formFields.partNumber || !formFields.name) {
        setFormFields(prev => ({
          ...prev,
          partNumber: prev.partNumber || targetPn,
          name: prev.name || targetName
        }));
      }

      if (!formFields.type) newErrors.type = 'Product Type is required.';
      if (!formFields.category) newErrors.category = 'Product Category is required.';
      if (!formFields.description || !formFields.description.trim()) {
        newErrors.description = 'Product Description is required.';
      }
      if (!editingProductId && isProductIdDeleted(targetPn)) {
        newErrors.partNumber = `Product ID / Part Number "${targetPn}" has been permanently purged by an Administrator and cannot be recreated.`;
      }
    }
    
    if (stepIndex === 2) { // 03 Revision Control
      if (!formFields.revision || !formFields.revision.trim()) newErrors.revision = 'Revision Number is required.';
      if (!formFields.version || !formFields.version.trim()) newErrors.version = 'Version Number is required.';
      if (!formFields.revisionTitle || !formFields.revisionTitle.trim()) newErrors.revisionTitle = 'Revision Title is required.';
      if (!formFields.revisionDesc || !formFields.revisionDesc.trim()) newErrors.revisionDesc = 'Revision Description is required.';
      if (!formFields.revisionReason || !formFields.revisionReason.trim()) newErrors.revisionReason = 'Revision Reason is required.';
      if (!formFields.revisionOwner || !formFields.revisionOwner.trim()) newErrors.revisionOwner = 'Revision Owner is required.';
      if (!formFields.reasonForChange || !formFields.reasonForChange.trim()) newErrors.reasonForChange = 'Reason for Change is required.';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      const missingList = Object.values(newErrors).join(', ');
      setValidationAlert(`Please fill in required fields in Section ${stepIndex + 1} (${stepsList[stepIndex]?.label || 'Current Section'}): ${missingList}`);
    } else {
      setValidationAlert(null);
    }

    // Update Step Completion indicator
    setStepCompletion(prev => {
      const next = [...prev];
      next[stepIndex] = isValid;
      return next;
    });

    return isValid;
  };

  // Navigation handlers
  const handleNextStep = () => {
    const isValid = validateActiveStep(activeStep);
    if (isValid) {
      setErrors({});
      setValidationAlert(null);
      const nextStep = Math.min(18, activeStep + 1);

      // Immediately record step completion so progress updates without async lag
      const updatedCompletion = [...stepCompletion];
      updatedCompletion[activeStep] = true;
      setStepCompletion(updatedCompletion);

      // Immediately navigate to the next section
      setActiveStep(nextStep);
      // Persist current data to draft
      saveDraftState(nextStep, updatedCompletion);
      // Synchronize project milestone progress
      syncMilestonesWithProject(formFields.projectId, nextStep, updatedCompletion, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Stay on current section and keep validation alert visible
      console.warn('Navigation blocked: Section validation failed for step', activeStep);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setErrors({});
      setValidationAlert(null);
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      saveDraftState(prevStep);
      syncMilestonesWithProject(formFields.projectId, prevStep, stepCompletion, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Real File Upload & FileReader Logic
  const simulateFileUpload = (
    filesList: FileList | null, 
    setFilesState: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
    allowedExtensions: string[],
    category: 'cad' | 'step' | 'drawing' | 'document' | 'pmi' = 'cad'
  ) => {
    if (!filesList) return;
    
    Array.from(filesList).forEach(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase();
      if (!allowedExtensions.includes(ext)) {
        alert(`Unsupported file format "${ext}". Allowed: ${allowedExtensions.join(', ')}`);
        return;
      }

      const fileId = `FILE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const reader = new FileReader();

      const newFileItem: UploadedFile = {
        id: fileId,
        name: file.name,
        type: ext,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        progress: 20,
        status: 'Uploading',
        uploadedBy: currentUser.name,
        uploadedDate: new Date().toISOString().substring(0, 10),
        productId: formFields.partNumber,
        projectId: formFields.projectId,
        category
      };

      setFilesState(prev => [...prev, newFileItem]);

      reader.onload = () => {
        const fileDataUrl = reader.result as string;

        // Register immediately into central CAD Vault storage
        registerCadVaultFile({
          id: fileId,
          productId: formFields.partNumber,
          partNumber: formFields.partNumber,
          projectId: formFields.projectId,
          projectName: projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId)?.name,
          fileName: file.name,
          fileType: ext,
          category,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadDate: new Date().toISOString().substring(0, 10),
          uploadedBy: currentUser.name,
          dataUrl: fileDataUrl
        });

        // Automatically link relevant fields in Product Master form
        if (category === 'cad' || ext === 'STEP' || ext === 'STP' || ext === 'SLDPRT' || ext === 'SLDASM' || ext === 'IGES') {
          setFormFields(prev => ({
            ...prev,
            cadFileName: file.name,
            cadFileType: ext === 'STEP' || ext === 'STP' ? 'STEP' : ext
          }));
        } else if (category === 'drawing' || ext === 'PDF') {
          setFormFields(prev => ({
            ...prev,
            drawingFile: file.name
          }));
        }

        try {
          localStorage.setItem(`apex_vault_file_${fileId}`, fileDataUrl);
          localStorage.setItem(`apex_vault_name_${fileId}`, file.name);
        } catch (e) {
          console.warn('Storage limit reached for large file', e);
        }

        setFilesState(prev => prev.map(f => f.id === fileId ? { 
          ...f, 
          progress: 100, 
          status: 'Complete', 
          dataUrl: fileDataUrl,
          productId: formFields.partNumber,
          projectId: formFields.projectId
        } : f));
        setTimeout(() => saveDraftState(), 100);
      };

      reader.onerror = () => {
        setFilesState(prev => prev.map(f => f.id === fileId ? { ...f, status: 'Failed' } : f));
      };

      reader.readAsDataURL(file);
    });
  };

  const deleteUploadedFile = (id: string, setFilesState: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    setFilesState(prev => prev.filter(f => f.id !== id));
    setTimeout(() => saveDraftState(), 100);
  };

  // Total calculated cost
  const calculatedTotalCost = formFields.materialCost + formFields.laborCost + formFields.mfgCost + formFields.toolingCost + formFields.overheadCost;

  // Final Product Creation
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent recreating a permanently deleted / blacklisted product ID
    if (!editingProductId && isProductIdDeleted(formFields.partNumber)) {
      alert(`Cannot create product: Product ID / Part Number "${formFields.partNumber}" has been permanently purged by an Administrator and cannot be recreated.`);
      setActiveStep(0);
      return;
    }

    // Validate Step 1 and Step 3 before finalizing
    const step1Valid = validateActiveStep(0);
    const step3Valid = validateActiveStep(2);
    
    if (!step1Valid || !step3Valid) {
      alert('Cannot create product master. Required information is missing in Basic Info or Revision sections.');
      if (!step1Valid) setActiveStep(0);
      else setActiveStep(2);
      return;
    }

    const newPartId = formFields.partNumber || (isAutoId ? formFields.partNumber : `PN-${Math.floor(1000 + Math.random() * 9000)}`);
    const linkedProject = projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId);

    // Build comprehensive attached files list from all upload categories
    const allUploadedRaw: UploadedFile[] = [
      ...uploaded3DFiles.map(f => ({ ...f, category: (f.category || 'cad') as UploadedFile['category'] })),
      ...uploaded2DFiles.map(f => ({ ...f, category: (f.category || 'drawing') as UploadedFile['category'] })),
      ...uploaded3DDocs.map(f => ({ ...f, category: (f.category || 'pmi') as UploadedFile['category'] })),
      ...uploadedProjectDocs.map(f => ({ ...f, category: (f.category || 'document') as UploadedFile['category'] }))
    ];

    const attachedVaultFiles: StoredCadVaultFile[] = allUploadedRaw.map(f => ({
      id: f.id,
      productId: newPartId,
      partNumber: formFields.partNumber,
      projectId: formFields.projectId,
      projectName: linkedProject?.name || formFields.program || 'Electric Scooter Development',
      fileName: f.name,
      fileType: f.type,
      category: (f.category || (f.type === 'PDF' ? 'drawing' : 'cad')) as any,
      fileSize: f.size,
      uploadDate: f.uploadedDate,
      uploadedBy: f.uploadedBy,
      dataUrl: f.dataUrl || ''
    }));

    // Identify primary files
    const primary3D = uploaded3DFiles[0] || allUploadedRaw.find(f => ['STEP', 'STP', 'SLDPRT', 'SLDASM', 'IGES'].includes(f.type.toUpperCase()));
    const primaryStep = uploaded3DFiles.find(f => f.type.toUpperCase() === 'STEP' || f.type.toUpperCase() === 'STP' || f.name.toLowerCase().endsWith('.step') || f.name.toLowerCase().endsWith('.stp')) || primary3D;
    const primaryPdf = uploaded2DFiles.find(f => f.type.toUpperCase() === 'PDF' || f.name.toLowerCase().endsWith('.pdf')) || uploaded3DDocs.find(f => f.type.toUpperCase() === 'PDF');

    const newPart: PartItem = {
      id: newPartId,
      partNumber: formFields.partNumber,
      name: formFields.name,
      description: formFields.description,
      type: formFields.type,
      category: formFields.category,
      material: formFields.material,
      weightKg: formFields.weightKg,
      estimatedCost: calculatedTotalCost,
      actualCost: calculatedTotalCost * 0.95,
      currentRev: formFields.revision + ' (' + formFields.version + ')',
      lifecycleStage: (activeStep === 18 || stepCompletion.filter(Boolean).length >= 18) ? 'production' : getProductAutoStatus(stepCompletion.filter(Boolean).length).stage,
      projectId: formFields.projectId,
      projectName: linkedProject?.name || formFields.program || 'Electric Scooter Development',
      completionPercent: (activeStep === 18 || stepCompletion.filter(Boolean).length >= 18) ? 100 : calculateProductProgress(stepCompletion),
      productStatus: (activeStep === 18 || stepCompletion.filter(Boolean).length >= 18) ? 'COMPLETED / RELEASE-READY' : getProductAutoStatus(stepCompletion.filter(Boolean).length).label,
      isCheckedOut: false,
      cadMetadata: {
        fileName: primary3D?.name || formFields.cadFileName || `${formFields.partNumber}.STEP`,
        format: (primary3D?.type as any) || (formFields.cadFileType as any) || 'STEP',
        fileSize: primary3D?.size || '15.4 MB',
        surfaceAreaCm2: 450.0,
        volumeCm3: 310.0,
        boundingDimensionsMm: [
          parseFloat(formFields.length) || 100, 
          parseFloat(formFields.width) || 100, 
          parseFloat(formFields.height) || 50
        ],
        geometryType: formFields.type === 'Assembly' || formFields.type === 'Sub-Assembly' ? 'ev_drivetrain' : 'structural_bracket',
        renderColor: '#0ea5e9',
        supplierCode: formFields.supplierCode,
        familyGroup: formFields.productFamily,
        cadFile: primary3D?.dataUrl,
        stepFile: primaryStep?.dataUrl || primary3D?.dataUrl,
        pdfFile: primaryPdf?.dataUrl,
        attachedFiles: attachedVaultFiles
      },
      revisionHistory: [
        {
          revId: formFields.revision,
          date: formFields.revisionDate,
          author: formFields.engOwner,
          changeSummary: formFields.revisionDesc,
          status: 'Released'
        }
      ],
      tags: [
        formFields.productFamily, 
        formFields.productLine, 
        formFields.type,
        formFields.projectId || '',
        linkedProject?.code || '',
        linkedProject?.name || ''
      ].filter(Boolean)
    };

    // If in Edit Mode: Update ONLY this product, keep ID permanent, and return to list
    if (editingProductId) {
      const existingPart = parts.find(p => p.id === editingProductId) || selectedProduct;

      // 1. Calculate auto progress and status
      const totalCompletedSteps = stepCompletion.filter(Boolean).length;
      const isAllCompleted = activeStep === 18 || totalCompletedSteps >= 18;
      const autoProg = isAllCompleted ? 100 : calculateProductProgress(stepCompletion);
      const autoStatus = isAllCompleted 
        ? { label: 'COMPLETED / RELEASE-READY', stage: 'production' as LifecycleStage }
        : getProductAutoStatus(totalCompletedSteps);

      // 2. Build updated product without modifying other products
      const updatedPart: PartItem = {
        ...existingPart,
        ...newPart,
        id: editingProductId, // KEEP PRODUCT ID PERMANENTLY!
        partNumber: formFields.partNumber || existingPart.partNumber,
        name: formFields.name || existingPart.name,
        completionPercent: autoProg,
        lifecycleStage: autoStatus.stage,
        productStatus: autoStatus.label,
        revisionHistory: [
          {
            revId: formFields.revision || existingPart.currentRev || 'A',
            date: formFields.revisionDate || new Date().toISOString().substring(0, 10),
            author: formFields.engOwner || currentUser.name,
            changeSummary: formFields.revisionDesc || 'Updated product master specifications',
            status: 'Released'
          },
          ...(existingPart.revisionHistory || [])
        ]
      };

      // 3. Update ONLY this product in parts list, keeping all other products completely unmodified
      setParts(prev => prev.map(p => p.id === editingProductId ? updatedPart : p));

      // Persist to MongoDB Atlas via backend API
      partsApi.update(editingProductId, updatedPart).catch(err => console.warn('Backend partsApi update failed:', err.message));

      // 4. Update BOM
      const newBOMRoot: BOMNode = {
        id: `BOM-${editingProductId}`,
        partId: editingProductId,
        partNumber: formFields.partNumber,
        name: formFields.name,
        revision: formFields.revision,
        quantity: 1,
        unit: 'pcs',
        material: formFields.material,
        unitCost: calculatedTotalCost,
        weightKg: formFields.weightKg,
        children: bomComponents.map((comp, idx) => ({
          id: `BOM-${editingProductId}-C${idx + 1}`,
          partId: comp.partId,
          partNumber: comp.partNumber,
          name: comp.name,
          revision: 'Rev A.0',
          quantity: comp.quantity,
          unit: 'pcs',
          material: comp.material,
          unitCost: comp.unitCost,
          weightKg: 0
        }))
      };
      setBomTrees(prev => ({
        ...prev,
        [editingProductId]: newBOMRoot
      }));

      // Persist BOM to MongoDB Atlas
      bomApi.save(editingProductId, newBOMRoot, formFields.projectId).catch(err => console.warn('Backend bomApi save failed:', err.message));

      // 5. Register CAD Vault files
      registerCadVaultFiles(attachedVaultFiles);

      // 6. Sync milestones with linked project if any
      if (formFields.projectId) {
        syncMilestonesWithProject(formFields.projectId, activeStep, stepCompletion, isAllCompleted);
      }

      // 7. Audit log
      logAction(
        'Product Master Updated',
        'SYSTEM',
        updatedPart.partNumber,
        `Updated Product Master "${updatedPart.name}" (${updatedPart.partNumber}). Product ID ${editingProductId} preserved permanently.`
      );

      // Multi-user synchronization event
      window.dispatchEvent(new CustomEvent('plm:part-sync'));
      window.dispatchEvent(new CustomEvent('plm:project-sync'));

      clearDraftState();
      setEditingProductId(null);
      // Return to the filtered product list!
      setViewMode('list');
      return;
    }

    // Register all attached files in the central CAD Vault for both newPartId and partNumber
    registerCadVaultFiles(attachedVaultFiles);

    const newBOMRoot: BOMNode = {
      id: `BOM-${newPartId}`,
      partId: newPartId,
      partNumber: formFields.partNumber,
      name: formFields.name,
      revision: formFields.revision,
      quantity: 1,
      unit: 'pcs',
      material: formFields.material,
      unitCost: calculatedTotalCost,
      weightKg: formFields.weightKg,
      children: bomComponents.map((comp, idx) => ({
        id: `BOM-${newPartId}-C${idx + 1}`,
        partId: comp.partId,
        partNumber: comp.partNumber,
        name: comp.name,
        revision: 'Rev A.0',
        quantity: comp.quantity,
        unit: 'pcs',
        material: comp.material,
        unitCost: comp.unitCost,
        weightKg: 0
      }))
    };

    // Save master list state without duplicate records
    setParts(prev => [newPart, ...prev.filter(p => p.id !== newPartId && p.partNumber !== formFields.partNumber)]);
    setBomTrees(prev => ({
      ...prev,
      [newPartId]: newBOMRoot
    }));

    // Persist to MongoDB Atlas via backend API
    partsApi.create(newPart).catch(err => console.warn('Backend partsApi create failed:', err.message));
    bomApi.save(newPartId, newBOMRoot, formFields.projectId).catch(err => console.warn('Backend bomApi save failed:', err.message));

    // Sync uploaded documents with the global vault
    const newDocs: EngineeringDocument[] = [];
    uploaded3DFiles.forEach(f => {
      newDocs.push({
        id: f.id,
        title: `${f.name} - 3D CAD Model`,
        docNumber: `CAD-${newPartId}-${f.id.substring(5, 9)}`,
        type: `${f.type} Model` as any,
        linkedPartId: newPartId,
        revision: `Rev ${formFields.revision}`,
        author: f.uploadedBy,
        uploadDate: f.uploadedDate,
        fileSize: f.size,
        status: 'Approved',
        fileUrl: f.dataUrl
      });
    });
    uploaded2DFiles.forEach(f => {
      newDocs.push({
        id: f.id,
        title: `${f.name} - 2D Drawing`,
        docNumber: `DWG-${newPartId}-${f.id.substring(5, 9)}`,
        type: `2D Drawing PDF` as any,
        linkedPartId: newPartId,
        revision: `Rev ${formFields.revision}`,
        author: f.uploadedBy,
        uploadDate: f.uploadedDate,
        fileSize: f.size,
        status: 'Approved',
        fileUrl: f.dataUrl
      });
    });
    uploaded3DDocs.forEach(f => {
      newDocs.push({
        id: f.id,
        title: `${f.name} - PMI Document`,
        docNumber: `PMI-${newPartId}-${f.id.substring(5, 9)}`,
        type: `2D Drawing PDF` as any,
        linkedPartId: newPartId,
        revision: `Rev ${formFields.revision}`,
        author: f.uploadedBy,
        uploadDate: f.uploadedDate,
        fileSize: f.size,
        status: 'Approved',
        fileUrl: f.dataUrl
      });
    });
    uploadedProjectDocs.forEach(f => {
      newDocs.push({
        id: f.id,
        title: `${f.name} - Specification`,
        docNumber: `SPEC-${newPartId}-${f.id.substring(5, 9)}`,
        type: `Inspection Plan` as any,
        linkedPartId: newPartId,
        revision: `Rev ${formFields.revision}`,
        author: f.uploadedBy,
        uploadDate: f.uploadedDate,
        fileSize: f.size,
        status: 'Approved',
        fileUrl: f.dataUrl
      });
    });

    if (newDocs.length > 0) {
      setDocuments(prev => [...newDocs, ...prev]);
      newDocs.forEach(d => {
        documentsApi.create(d).catch(err => console.warn('Backend documentsApi create failed:', err.message));
      });
    }

    // Create new DFMEA row if required
    if (formFields.dfmeaRequired === 'Yes') {
      const newDfmea: DfmeaRow = {
        id: `DFM-${newPartId.replace('PN-', '')}`,
        system: formFields.productFamily || 'General System',
        subsystem: formFields.productGroup || 'Subsystem',
        component: `${formFields.name} (${newPartId})`,
        functionDesc: formFields.functionalDesc || 'Functional description',
        designRequirement: formFields.perfReq || 'Performance requirement',
        potentialFailureMode: (formFields as any).potentialFailureMode || 'Design fatigue mode under stress',
        potentialEffect: (formFields as any).potentialEffect || 'Loss of structural integrity',
        severity: Number(formFields.dfmeaSeverity) || 8,
        potentialCause: (formFields as any).potentialCause || 'Overstress notch effect',
        occurrence: Number(formFields.dfmeaOccurrence) || 3,
        currentDesignControls: (formFields as any).currentDesignControls || 'Finite Element Analysis (FEA)',
        detection: Number(formFields.dfmeaDetection) || 4,
        rpn: (Number(formFields.dfmeaSeverity) || 8) * (Number(formFields.dfmeaOccurrence) || 3) * (Number(formFields.dfmeaDetection) || 4),
        recommendedDesignAction: formFields.dfmeaAction || 'Optimize geometric dimensions and fillet radii.',
        responsibleEngineer: formFields.dfmeaOwner || currentUser.name,
        dueDate: new Date().toISOString().substring(0, 10),
        status: 'Open',
        linkedCadId: newPartId
      };
      setDfmeaRows(prev => [newDfmea, ...prev]);
    }

    // Create new PFMEA row if required
    if (formFields.pfmeaRequired === 'Yes') {
      const newPfmea: PfmeaRow = {
        id: `PFM-${newPartId.replace('PN-', '')}`,
        processStep: `Op 10: Manufacturing for ${formFields.name} (${newPartId})`,
        opNumber: 10,
        machine: formFields.machine || 'CNC Haas 5-Axis Milling Machine',
        tool: formFields.tooling || 'Carbide End Mill 12mm',
        fixture: formFields.fixture || 'Universal Indexing Fixture',
        operatorRole: 'CNC Specialist Level II',
        potentialProcessFailure: formFields.pfmeaProcessRisk || 'Workpiece vibration or fixture displacement',
        effect: 'Out of tolerance surface finish roughness',
        severity: Number(formFields.pfmeaSeverity) || 6,
        cause: 'Incorrect hydraulic clamping pressure limit setting',
        occurrence: Number(formFields.pfmeaOccurrence) || 4,
        processControls: 'Renishaw measurement laser probe',
        detection: Number(formFields.pfmeaDetection) || 5,
        rpn: (Number(formFields.pfmeaSeverity) || 6) * (Number(formFields.pfmeaOccurrence) || 4) * (Number(formFields.pfmeaDetection) || 5),
        correctiveAction: formFields.pfmeaAction || 'Implement automated pressure check interlocks.',
        productionEngineer: formFields.pfmeaOwner || currentUser.name,
        dueDate: new Date().toISOString().substring(0, 10),
        status: 'Open',
        linkedPartId: newPartId
      };
      setPfmeaRows(prev => [newPfmea, ...prev]);
    }

    // Automatically complete and sync all project milestones to 100%
    if (formFields.projectId) {
      syncMilestonesWithProject(formFields.projectId, 18, new Array(19).fill(true), true);
    }

    // Log to Audit Trail
    logAction(
      'Product Master Created',
      'SYSTEM',
      newPart.partNumber,
      `Step-by-step product master record "${newPart.name}" created with CAD linkages, revision logs and project allocations.`
    );

    // Multi-user synchronization event
    window.dispatchEvent(new CustomEvent('plm:part-sync'));
    window.dispatchEvent(new CustomEvent('plm:project-sync'));

    // Clean local storage draft
    clearDraftState();

    // Redirect to details and select globally
    setSelectedProductId(newPartId);
    if (onSelectPart) {
      onSelectPart(newPartId);
    }
    setViewMode('details');
    setDetailTab('overview');
  };

  const handleCreateNewRevision = (part: PartItem) => {
    const currentRevStr = part.currentRev || 'Rev A.0';
    let nextRev = 'Rev B.0';
    if (currentRevStr.includes('A')) nextRev = 'Rev B.0';
    else if (currentRevStr.includes('B')) nextRev = 'Rev C.0';
    else if (currentRevStr.includes('C')) nextRev = 'Rev D.0';
    else nextRev = `Rev ${String.fromCharCode(currentRevStr.charCodeAt(0) + 1)}.0`;

    const newRevLog = {
      revId: nextRev,
      date: new Date().toISOString().substring(0, 10),
      author: currentUser.name || 'Alex Rivera, PE',
      changeSummary: `Created engineering revision ${nextRev} via Product Workspace`,
      status: 'Draft' as const
    };

    const updatedPart: PartItem = {
      ...part,
      currentRev: nextRev,
      lifecycleStage: 'design',
      revisionHistory: [newRevLog, ...part.revisionHistory]
    };

    setParts(prev => prev.map(p => p.id === part.id ? updatedPart : p));

    logAction(
      'New Revision Created',
      'CAD',
      part.partNumber,
      `Created revision ${nextRev} for Product ${part.partNumber}.`
    );

    alert(`Successfully generated ${nextRev} for ${part.partNumber}!`);
  };

  const handleDirectCadUpload = (e: React.ChangeEvent<HTMLInputElement>, part: PartItem) => {
    const file = e.target.files?.[0];
    if (!file || !part) return;

    const ext = file.name.split('.').pop()?.toUpperCase() || 'STEP';
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const fileId = `FILE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const reader = new FileReader();
    reader.onload = () => {
      const fileDataUrl = reader.result as string;

      const storedFileItem: StoredCadVaultFile = {
        id: fileId,
        productId: part.id,
        partNumber: part.partNumber,
        projectId: part.projectId,
        projectName: part.projectName,
        fileName: file.name,
        fileType: ext,
        category: ext === 'PDF' ? 'drawing' : 'cad',
        fileSize: fileSizeMb,
        uploadDate: new Date().toISOString().substring(0, 10),
        uploadedBy: currentUser.name,
        dataUrl: fileDataUrl
      };

      // Register in central CAD Vault
      registerCadVaultFile(storedFileItem);

      const existingAttached = part.cadMetadata?.attachedFiles || [];
      const updatedAttached = [storedFileItem, ...existingAttached.filter(f => f.fileName !== file.name)];

      const updatedPart: PartItem = {
        ...part,
        cadMetadata: {
          ...part.cadMetadata,
          fileName: file.name,
          format: (['STEP', 'IGES', 'SLDASM', 'SLDPRT', 'CATPART', 'NX', 'DWG'].includes(ext) ? ext : 'STEP') as any,
          fileSize: fileSizeMb,
          cadFile: fileDataUrl,
          stepFile: (ext === 'STEP' || ext === 'STP') ? fileDataUrl : part.cadMetadata.stepFile || fileDataUrl,
          pdfFile: ext === 'PDF' ? fileDataUrl : part.cadMetadata.pdfFile,
          attachedFiles: updatedAttached
        },
        revisionHistory: [
          {
            revId: part.currentRev,
            date: new Date().toISOString().substring(0, 10),
            author: currentUser.name,
            changeSummary: `Uploaded CAD model file: ${file.name}`,
            status: 'Draft'
          },
          ...part.revisionHistory
        ]
      };

      setParts(prev => prev.map(p => p.id === part.id ? updatedPart : p));

      // Register in Documents Vault
      const newDoc: EngineeringDocument = {
        id: `DOC-CAD-${Date.now()}`,
        title: `${file.name} - 3D CAD Master`,
        docNumber: `CAD-${part.partNumber}-${Date.now().toString().slice(-4)}`,
        type: ext === 'PDF' ? '2D Drawing PDF' : '3D CAD Model' as any,
        linkedPartId: part.id,
        revision: `Rev ${part.currentRev}`,
        author: currentUser.name,
        uploadDate: new Date().toISOString().substring(0, 10),
        fileSize: fileSizeMb,
        status: 'Approved',
        fileUrl: fileDataUrl
      };
      setDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);

      logAction(
        'CAD Uploaded',
        'CAD',
        part.partNumber,
        `Uploaded CAD file ${file.name} to Product Master ${part.partNumber}.`
      );

      alert(`CAD file "${file.name}" uploaded successfully! Linked to Product ${part.partNumber}, CAD Vault, and Documents.`);
    };

    reader.readAsDataURL(file);
  };

  const handleDuplicate = (part: PartItem) => {
    const nextIdNum = Math.max(...parts.map(p => {
      const num = parseInt(p.id.replace('PN-', ''));
      return isNaN(num) ? 1000 : num;
    })) + 1;
    const dupId = `PN-${nextIdNum}`;
    const dupPartNumber = `${part.partNumber}-DUP`;
    
    const duplicatedPart: PartItem = {
      ...part,
      id: dupId,
      partNumber: dupPartNumber,
      name: `${part.name} (Copy)`,
      lifecycleStage: 'concept',
      isCheckedOut: false,
      revisionHistory: [
        { revId: 'A', date: new Date().toISOString().substring(0, 10), author: currentUser.name, changeSummary: 'Duplicated from ' + part.partNumber, status: 'Released' }
      ]
    };

    setParts(prev => [duplicatedPart, ...prev]);
    if (bomTrees[part.id]) {
      const dupBOM = {
        ...bomTrees[part.id],
        id: `BOM-${dupId}`,
        partId: dupId,
        partNumber: dupPartNumber,
        name: `${part.name} (Copy)`
      };
      setBomTrees(prev => ({
        ...prev,
        [dupId]: dupBOM
      }));
      bomApi.save(dupId, dupBOM, duplicatedPart.projectId).catch(err => console.warn('Backend bomApi duplicate save failed:', err.message));
    }

    partsApi.create(duplicatedPart).catch(err => console.warn('Backend partsApi duplicate create failed:', err.message));

    logAction(
      'Duplicated Product Master',
      'SYSTEM',
      duplicatedPart.partNumber,
      `Cloned product master from ${part.partNumber}`
    );

    window.dispatchEvent(new CustomEvent('plm:part-sync'));
  };

  const selectedProduct = parts.find(p => p.id === selectedProductId) || parts[0];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. MAIN PRODUCTS DIRECTORY LIST */}
      {viewMode === 'list' && (
        <div className="space-y-6 max-w-4xl mx-auto py-8">
          {/* Main Landing Card */}
          <div className={`rounded-[24px] p-8 border shadow-lg text-center space-y-6 transition-colors ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-3xl text-cyan-500 border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
              }`}>
                <Box className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  PRODUCT MASTER
                </h1>
                <p className={`text-xs max-w-lg mx-auto ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Manage and create mechanical product master records. Link 3D CAD models, specifications, multi-level BOMs, quality checks, and change histories.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setViewMode('create');
                  setActiveStep(0);
                  setErrors({});
                  setValidationAlert(null);
                  setFormFields(prev => ({
                    ...prev,
                    description: prev.description || 'Electric Scooter Drivetrain and Mechanical Platform master component specification.'
                  }));
                }}
                className="btn-primary px-6 py-2.5 text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>CREATE NEW PRODUCT</span>
              </button>
            </div>
          </div>

          {/* Summary Metric Cards with 100% Automatic Filter Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'all', label: 'TOTAL PRODUCTS', value: parts.length, color: 'text-cyan-400', activeRing: 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/50 shadow-cyan-500/10' },
              { id: 'draft', label: 'DRAFT', value: parts.filter(p => isPartMatchingFilter(p, 'draft')).length, color: 'text-amber-400', activeRing: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50 shadow-amber-500/10' },
              { id: 'under_review', label: 'UNDER REVIEW', value: parts.filter(p => isPartMatchingFilter(p, 'under_review')).length, color: 'text-purple-400', activeRing: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/50 shadow-purple-500/10' },
              { id: 'released', label: 'RELEASED', value: parts.filter(p => isPartMatchingFilter(p, 'released')).length, color: 'text-emerald-400', activeRing: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-emerald-500/10' }
            ].map((stat) => (
              <button
                key={stat.id}
                type="button"
                onClick={() => setFilterStage(stat.id)}
                className={`rounded-2xl p-4 border text-center space-y-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
                  filterStage === stat.id
                    ? `${stat.activeRing} shadow-lg font-bold`
                    : isDark ? 'bg-[#111B2E] border-[#243149] hover:border-slate-600' : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  {stat.label}
                </span>
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {filterStage === stat.id ? (
                    <span className="text-cyan-400 font-bold">● ACTIVE FILTER</span>
                  ) : (
                    <span>Click to show {stat.label.toLowerCase()}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Filtered Product Master Directory */}
          {(() => {
            const filteredParts = parts.filter(p => {
              const matchesFilter = isPartMatchingFilter(p, filterStage);
              if (!matchesFilter) return false;
              if (!searchTerm.trim()) return true;
              const q = searchTerm.toLowerCase();
              return (
                p.partNumber.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q) ||
                (p.material && p.material.toLowerCase().includes(q)) ||
                (p.type && p.type.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
              );
            });

            return (
              <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-700/30">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5 flex-wrap">
                      <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        Product Master Directory
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        filterStage === 'draft'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : filterStage === 'under_review'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                          : filterStage === 'released'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      }`}>
                        {filterStage === 'all' ? 'Showing All Products' : `Filter: ${filterStage.replace('_', ' ').toUpperCase()}`} ({filteredParts.length})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Click any product row or card to open and edit its existing Product Master. Product ID remains permanent.
                    </p>
                  </div>

                  {/* Search Filter Bar */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Part Number, Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                        isDark ? 'bg-[#0D1628] border-slate-700/50 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Products List Table / Cards */}
                {filteredParts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredParts.map((part) => {
                      const autoProg = part.completionPercent !== undefined
                        ? part.completionPercent
                        : (part.lifecycleStage === 'production' ? 100 : part.lifecycleStage === 'prototype' ? 70 : 45);
                      const isDone = autoProg === 100 || part.lifecycleStage === 'production';
                      const isReview = part.lifecycleStage === 'design' || part.lifecycleStage === 'prototype';

                      return (
                        <div
                          key={part.id}
                          onClick={() => handleOpenEditProduct(part)}
                          className={`p-4 rounded-xl border flex flex-col gap-3 transition-all cursor-pointer group ${
                            isDark 
                              ? 'bg-[#0D1628]/70 border-slate-700/40 hover:bg-[#15233c] hover:border-cyan-500/50' 
                              : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-cyan-500 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                              <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                                isDone 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : isReview 
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              }`}>
                                <Box className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <span className="font-mono font-bold text-cyan-400 text-xs">
                                    {part.partNumber}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-700/30 px-1.5 py-0.5 rounded">
                                    ID: {part.id}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                    Rev {part.currentRev}
                                  </span>
                                </div>
                                <h3 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-800 group-hover:text-cyan-700'} transition-colors`}>
                                  {part.name}
                                </h3>
                                <p className="text-[11px] text-slate-400 line-clamp-1">
                                  {part.description || `${part.type} &bull; ${part.category} &bull; ${part.material || 'Engineering Alloy'}`}
                                </p>
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                                isDone
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  : isReview
                                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              }`}>
                                {isDone ? 'RELEASED' : isReview ? 'UNDER REVIEW' : 'DRAFT'}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditProduct(part);
                                }}
                                className="btn-primary btn-sm text-[11px] flex items-center space-x-1 cursor-pointer py-1 px-3 shadow-sm shadow-cyan-500/20"
                                title="Edit this product in Product Master"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit Product</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductId(part.id);
                                  setViewMode('details');
                                  setDetailTab('overview');
                                }}
                                className="p-1.5 rounded-lg border text-slate-400 hover:text-white hover:bg-slate-700/50 border-slate-700/40 cursor-pointer transition-colors"
                                title="View Full Product Specifications"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProductToDelete(part);
                                  }}
                                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 cursor-pointer transition-all"
                                  title="Permanently delete this product across entire PLM system (Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar (Auto-calculated) */}
                          <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between text-[10px] font-mono text-slate-400 gap-3">
                            <div className="flex items-center space-x-2 shrink-0">
                              <span>Product Master Progress:</span>
                              <strong className={isDone ? 'text-emerald-400' : 'text-cyan-400'}>
                                {autoProg}%
                              </strong>
                              <span className="text-[9px] text-slate-500 bg-slate-700/30 px-1 py-0.2 rounded">AUTO</span>
                            </div>
                            <div className="w-full max-w-[200px] h-1.5 rounded-full bg-slate-700/30 overflow-hidden shrink-0">
                              <div
                                className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                                style={{ width: `${autoProg}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed rounded-xl space-y-3">
                    <Box className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400">
                      No products found under status <strong className="text-cyan-400 uppercase font-mono">{filterStage.replace('_', ' ')}</strong>.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStage('all');
                          setSearchTerm('');
                        }}
                        className="btn-secondary btn-sm text-xs cursor-pointer inline-flex items-center space-x-1"
                      >
                        <span>Show All Products ({parts.length})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. CREATE / EDIT PRODUCT STEP-BY-STEP WORKFLOW */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-6">
          {/* Sticky Wrapper for Header & Stepper */}
          <div className={`sticky top-0 z-30 space-y-3 pb-4 pt-2 -mx-2 px-2 transition-colors ${
            isDark ? 'bg-[#0D1628]' : 'bg-[#F5F7FA]'
          }`}>
            {/* Header Title Bar */}
            <div className={`rounded-[18px] p-5 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                    {editingProductId ? `EDIT PRODUCT MASTER — ${formFields.partNumber}` : 'CREATE NEW PRODUCT MASTER'}
                  </h1>
                  {editingProductId && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      ID: {editingProductId} (PERMANENT)
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  {editingProductId
                    ? `Updating existing product record for ${formFields.name || formFields.partNumber}. Product ID is locked permanently.`
                    : 'Create and configure a complete mechanical product master record.'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setViewMode('list');
                  }}
                  className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Return to Product Directory</span>
                </button>
                {lastSaved && (
                  <span className={`text-[10px] uppercase font-mono mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Draft saved: {lastSaved}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => saveDraftState()}
                  className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
                  title="Force Save Draft"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Cancel product creation? Any unsaved draft changes will remain stored.')) {
                      setViewMode('list');
                    }
                  }}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </div>

            {/* Horizontal Top Stepper */}
            <div className={`rounded-xl border p-2 overflow-x-auto flex items-center space-x-2 whitespace-nowrap shadow-sm ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`} style={{ height: '52px' }}>
              {stepsList.map((step, idx) => {
                const isActive = activeStep === idx;
                const isCompleted = stepCompletion[idx];
                const isFutureLocked = idx > activeStep && !stepCompletion[idx - 1] && idx !== 0;

                return (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      disabled={isFutureLocked}
                      onClick={() => {
                        if (idx < activeStep || stepCompletion[idx - 1] || idx === 0) {
                          setErrors({});
                          setValidationAlert(null);
                          setActiveStep(idx);
                          saveDraftState(idx);
                        } else {
                          if (validateActiveStep(activeStep)) {
                            setErrors({});
                            setValidationAlert(null);
                            setActiveStep(idx);
                            saveDraftState(idx);
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center space-x-1.5 transition-colors shrink-0 ${
                        isActive
                          ? isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500' : 'bg-cyan-50 text-cyan-700 border border-cyan-600'
                          : isCompleted
                          ? isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isFutureLocked
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] opacity-75">{idx + 1}.</span>
                      )}
                      <span>{step.label}</span>
                    </button>
                    {idx < 18 && <span className="text-slate-500 text-xs shrink-0 font-normal">&rarr;</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

            {/* Top Wizard Progress Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">Product Master Completion:</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      currentProductProgress === 100 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : currentProductProgress > 0
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-700/60 text-slate-300 border border-slate-600'
                    }`}>
                      {currentProductStatus} &bull; {currentProductProgress}% ({activeStep + 1} of 19 Steps)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                    Linked PLM Project: <strong className="text-cyan-400">{projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId)?.name || 'Electric Scooter Development'}</strong>
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${currentProductProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Wizard Container */}
            <div className="space-y-6 w-full">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 font-mono mb-4">
                Section {activeStep + 1} of 19 &bull; {stepsList[activeStep].label}
              </div>
              {/* STEP 01: BASIC PRODUCT INFORMATION */}
              {activeStep === 0 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    01 — Basic Product Information & Project Linkage
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Assigned PLM Project */}
                    <div className="space-y-1 md:col-span-3 p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <label className="font-bold block text-cyan-400">Parent PLM Project Master *</label>
                        <p className="text-[11px] text-slate-400">
                          Product Number, Name, Program, and Milestone sync are inherited directly from this project.
                        </p>
                      </div>
                      <select
                        value={formFields.projectId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const targetPrj = projects.find(p => p.id === pId || p.code === pId);
                          const generatedPn = `PN-${targetPrj?.code.replace('PRJ-', '') || '3003'}`;
                          const generatedName = targetPrj?.releasedProduct || `${targetPrj?.name || 'Electric Scooter'} Drivetrain & Frame Assembly`;
                          handleFieldChange({ 
                            projectId: pId,
                            partNumber: generatedPn,
                            name: generatedName,
                            program: targetPrj?.program || formFields.program,
                            customer: targetPrj?.customer || formFields.customer
                          });
                          syncMilestonesWithProject(pId, activeStep, stepCompletion, false);
                        }}
                        className="plm-select px-3 py-2 sm:w-80 font-bold text-cyan-400 bg-slate-900 border-cyan-500/40"
                      >
                        {projects.map(prj => (
                          <option key={prj.id} value={prj.id}>
                            [{prj.code}] {prj.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Product Type *</label>
                      <select
                        value={formFields.type}
                        onChange={(e) => handleFieldChange({ type: e.target.value as PartType })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        <option value="Component">Component</option>
                        <option value="Part">Part</option>
                        <option value="Sub-Assembly">Sub-Assembly</option>
                        <option value="Assembly">Assembly</option>
                        <option value="Finished Product">Finished Product</option>
                        <option value="Raw Material">Raw Material</option>
                        <option value="Tool">Tool</option>
                        <option value="Fixture">Fixture</option>
                        <option value="Spare Part">Spare Part</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Product Category *</label>
                      <select
                        value={formFields.category}
                        onChange={(e) => handleFieldChange({ category: e.target.value as PartCategory })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        <option value="CNC Machined">CNC Machined</option>
                        <option value="Sheet Metal">Sheet Metal</option>
                        <option value="Injection Molded">Injection Molded</option>
                        <option value="Cast Metal">Cast Metal</option>
                        <option value="Electrical/Sensors">Electrical/Sensors</option>
                        <option value="Fastener/Hardware">Fastener/Hardware</option>
                        <option value="Composite/Carbon">Composite/Carbon</option>
                        <option value="Composite Assembly">Composite Assembly</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Product Class</label>
                      <input
                        type="text"
                        value={formFields.productClass}
                        onChange={(e) => handleFieldChange({ productClass: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold block">Product Description *</label>
                    <textarea
                      rows={4}
                      value={formFields.description}
                      onChange={(e) => handleFieldChange({ description: e.target.value })}
                      className="plm-input p-3 w-full"
                      placeholder="Enter mechanical system description..."
                    />
                    {errors.description && <p className="text-rose-500 text-[10px]">{errors.description}</p>}
                  </div>
                </div>
              )}

              {/* STEP 02: PRODUCT IDENTIFICATION */}
              {activeStep === 1 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    02 — Product Identification
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Internal Part Number</label>
                      <input
                        type="text"
                        value={formFields.internalPartNum}
                        onChange={(e) => handleFieldChange({ internalPartNum: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Drawing Number</label>
                      <input
                        type="text"
                        value={formFields.drawingNum}
                        onChange={(e) => handleFieldChange({ drawingNum: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Model Number</label>
                      <input
                        type="text"
                        value={formFields.modelNum}
                        onChange={(e) => handleFieldChange({ modelNum: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03: REVISION & VERSION CONTROL (SIGNIFICANTLY EXPANDED) */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  {/* Revision Core Fields */}
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                      03 — Revision & Version Control
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold block">Revision Number *</label>
                        <input
                          type="text"
                          value={formFields.revision}
                          onChange={(e) => handleFieldChange({ revision: e.target.value })}
                          className="plm-input px-3 py-2 w-full font-mono"
                        />
                        {errors.revision && <p className="text-rose-500 text-[10px]">{errors.revision}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Version Number *</label>
                        <input
                          type="text"
                          value={formFields.version}
                          onChange={(e) => handleFieldChange({ version: e.target.value })}
                          className="plm-input px-3 py-2 w-full font-mono"
                        />
                        {errors.version && <p className="text-rose-500 text-[10px]">{errors.version}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Revision Title *</label>
                        <input
                          type="text"
                          value={formFields.revisionTitle}
                          onChange={(e) => handleFieldChange({ revisionTitle: e.target.value })}
                          className="plm-input px-3 py-2 w-full"
                          placeholder="Initial Prototype Release"
                        />
                        {errors.revisionTitle && <p className="text-rose-500 text-[10px]">{errors.revisionTitle}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Revision Type *</label>
                        <select
                          value={formFields.revisionType}
                          onChange={(e) => handleFieldChange({ revisionType: e.target.value })}
                          className="plm-select px-3 py-2 w-full"
                        >
                          <option value="Initial Release">Initial Release</option>
                          <option value="Minor Revision">Minor Revision</option>
                          <option value="Major Revision">Major Revision</option>
                          <option value="Engineering Change">Engineering Change</option>
                          <option value="Manufacturing Change">Manufacturing Change</option>
                          <option value="Material Change">Material Change</option>
                          <option value="Design Change">Design Change</option>
                          <option value="Correction">Correction</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold block">Revision Description *</label>
                      <textarea
                        rows={3}
                        value={formFields.revisionDesc}
                        onChange={(e) => handleFieldChange({ revisionDesc: e.target.value })}
                        className="plm-input p-3 w-full"
                        placeholder="Detail the technical parameters of this specific version release..."
                      />
                      {errors.revisionDesc && <p className="text-rose-500 text-[10px]">{errors.revisionDesc}</p>}
                    </div>
                  </div>

                  {/* Change Information Subsection */}
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b pb-2 border-slate-700/30">
                      Change Information
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold block">Reason for Change *</label>
                        <input
                          type="text"
                          value={formFields.reasonForChange}
                          onChange={(e) => handleFieldChange({ reasonForChange: e.target.value })}
                          className="plm-input px-3 py-2 w-full"
                          placeholder="e.g. DFM pocket optimization"
                        />
                        {errors.reasonForChange && <p className="text-rose-500 text-[10px]">{errors.reasonForChange}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Change Request / ECR Number</label>
                        <input
                          type="text"
                          value={formFields.changeRequestEcr}
                          onChange={(e) => handleFieldChange({ changeRequestEcr: e.target.value })}
                          className="plm-input px-3 py-2 w-full font-mono"
                          placeholder="ECR-2026-004"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Change Category</label>
                        <select
                          value={formFields.changeCategory}
                          onChange={(e) => handleFieldChange({ changeCategory: e.target.value })}
                          className="plm-select px-3 py-2 w-full"
                        >
                          <option value="Design">Design</option>
                          <option value="Material">Material</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Quality">Quality</option>
                          <option value="Cost">Cost</option>
                          <option value="Regulatory">Regulatory</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Impact Analysis Checkboxes */}
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                      Revision Impact Analysis
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {[
                        { key: 'cadImpact', label: 'CAD Impact' },
                        { key: 'dwgImpact', label: 'Drawing Impact' },
                        { key: 'bomImpact', label: 'BOM Impact' },
                        { key: 'materialImpact', label: 'Material Impact' },
                        { key: 'routingImpact', label: 'Routing Impact' },
                        { key: 'qualityInspectionImpact', label: 'Quality Inspection' },
                        { key: 'dfmeaImpact', label: 'DFMEA Impact' },
                        { key: 'pfmeaImpact', label: 'PFMEA Impact' }
                      ].map(item => (
                        <div key={item.key} className="space-y-1">
                          <label className="font-semibold block">{item.label}</label>
                          <select
                            value={(formFields as any)[item.key]}
                            onChange={(e) => handleFieldChange({ [item.key]: e.target.value })}
                            className="plm-select py-1.5 w-full text-[11px]"
                          >
                            <option value="No Impact">No Impact</option>
                            <option value="Minor Impact">Minor Impact</option>
                            <option value="Major Impact">Major Impact</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 04: ENGINEERING */}
              {activeStep === 3 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    04 — Engineering Information
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Design Engineer</label>
                      <input
                        type="text"
                        value={formFields.designEngineer}
                        onChange={(e) => handleFieldChange({ designEngineer: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Lead Engineer</label>
                      <input
                        type="text"
                        value={formFields.leadEngineer}
                        onChange={(e) => handleFieldChange({ leadEngineer: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Design Standard</label>
                      <input
                        type="text"
                        value={formFields.designStandard}
                        onChange={(e) => handleFieldChange({ designStandard: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 05: MATERIALS */}
              {activeStep === 4 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    05 — Materials & Physical Properties
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Material</label>
                      <input
                        type="text"
                        value={formFields.material}
                        onChange={(e) => handleFieldChange({ material: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formFields.weightKg}
                        onChange={(e) => handleFieldChange({ weightKg: parseFloat(e.target.value) || 0 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Surface Finish</label>
                      <input
                        type="text"
                        value={formFields.surfaceFinish}
                        onChange={(e) => handleFieldChange({ surfaceFinish: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Heat Treatment</label>
                      <input
                        type="text"
                        value={formFields.heatTreatment}
                        onChange={(e) => handleFieldChange({ heatTreatment: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 06: DIMENSIONS */}
              {activeStep === 5 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    06 — Dimensions & Geometry
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Length</label>
                      <input
                        type="text"
                        value={formFields.length}
                        onChange={(e) => handleFieldChange({ length: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Width</label>
                      <input
                        type="text"
                        value={formFields.width}
                        onChange={(e) => handleFieldChange({ width: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Height</label>
                      <input
                        type="text"
                        value={formFields.height}
                        onChange={(e) => handleFieldChange({ height: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Units</label>
                      <select
                        value={formFields.units}
                        onChange={(e) => handleFieldChange({ units: e.target.value })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        <option value="mm">mm</option>
                        <option value="inch">inch</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 07: CAD & DESIGN (EXPANDED UPLOAD INTERFACES) */}
              {activeStep === 6 && (
                <div className="space-y-6">
                  {/* File Upload Area */}
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                      07 — CAD & Design Upload Vault
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 3D CAD Upload */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold block">3D CAD Model</span>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver3D(true); }}
                          onDragLeave={() => setIsDragOver3D(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver3D(false);
                            simulateFileUpload(e.dataTransfer.files, setUploaded3DFiles, ['STEP', 'STP', 'IGES', 'SLDPRT', 'SLDASM', 'PARASOLID'], 'cad');
                          }}
                          className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center justify-center h-32 ${
                            isDragOver3D
                              ? 'border-cyan-500 bg-cyan-500/5'
                              : isDark ? 'border-slate-700 bg-slate-800/10 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                          }`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => {
                              simulateFileUpload((e.target as HTMLInputElement).files, setUploaded3DFiles, ['STEP', 'STP', 'IGES', 'SLDPRT', 'SLDASM', 'PARASOLID'], 'cad');
                            };
                            input.click();
                          }}
                        >
                          <UploadCloud className="w-7 h-7 text-cyan-500 mb-1" />
                          <span className="text-[10px] font-bold block text-slate-300">Drag 3D CAD here</span>
                          <span className="text-[9px] text-slate-500">STEP, IGES, SLDPRT</span>
                        </div>
                      </div>

                      {/* 2D Drawings */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold block">2D Production Drawing</span>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver2D(true); }}
                          onDragLeave={() => setIsDragOver2D(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver2D(false);
                            simulateFileUpload(e.dataTransfer.files, setUploaded2DFiles, ['DWG', 'DXF', 'PDF'], 'drawing');
                          }}
                          className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center justify-center h-32 ${
                            isDragOver2D
                              ? 'border-cyan-500 bg-cyan-500/5'
                              : isDark ? 'border-slate-700 bg-slate-800/10 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                          }`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => {
                              simulateFileUpload((e.target as HTMLInputElement).files, setUploaded2DFiles, ['DWG', 'DXF', 'PDF'], 'drawing');
                            };
                            input.click();
                          }}
                        >
                          <UploadCloud className="w-7 h-7 text-emerald-500 mb-1" />
                          <span className="text-[10px] font-bold block text-slate-300">Drag 2D Drawing here</span>
                          <span className="text-[9px] text-slate-500">PDF, DXF, DWG</span>
                        </div>
                      </div>

                      {/* 3D Annotated Docs */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold block">3D Annotated Doc / PMI</span>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver3DDoc(true); }}
                          onDragLeave={() => setIsDragOver3DDoc(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver3DDoc(false);
                            simulateFileUpload(e.dataTransfer.files, setUploaded3DDocs, ['PDF', 'DWG'], 'pmi');
                          }}
                          className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center justify-center h-32 ${
                            isDragOver3DDoc
                              ? 'border-cyan-500 bg-cyan-500/5'
                              : isDark ? 'border-slate-700 bg-slate-800/10 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                          }`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => {
                              simulateFileUpload((e.target as HTMLInputElement).files, setUploaded3DDocs, ['PDF', 'DWG'], 'pmi');
                            };
                            input.click();
                          }}
                        >
                          <UploadCloud className="w-7 h-7 text-purple-500 mb-1" />
                          <span className="text-[10px] font-bold block text-slate-300">Drag 3D Doc here</span>
                          <span className="text-[9px] text-slate-500">3D PDF, PMI Drawings</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Queue Progress / Lists */}
                  {(uploaded3DFiles.length > 0 || uploaded2DFiles.length > 0 || uploaded3DDocs.length > 0) && (
                    <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                        <span className="text-xs font-bold block text-cyan-400">Uploaded File Ledger &amp; Automatic Product Linkage</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Linked Product ID: <strong className="text-cyan-400">{formFields.partNumber}</strong> &bull; Project: <strong className="text-purple-400">{projects.find(p => p.id === formFields.projectId || p.code === formFields.projectId)?.name || 'PRJ-01'}</strong>
                        </span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {[...uploaded3DFiles, ...uploaded2DFiles, ...uploaded3DDocs].map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/10 border border-slate-700/40 text-xs">
                            <div className="space-y-1 flex-1 pr-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                    {file.type}
                                  </span>
                                  <span className="font-semibold font-mono truncate max-w-[280px] text-slate-200">{file.name}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">{file.size}</span>
                              </div>
                              {file.status === 'Uploading' ? (
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Linked to Product {formFields.partNumber}</span>
                                  </span>
                                  <span>{file.uploadedDate}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {file.dataUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadActualStoredFile({
                                      id: file.id,
                                      productId: formFields.partNumber,
                                      partNumber: formFields.partNumber,
                                      projectId: formFields.projectId,
                                      fileName: file.name,
                                      fileType: file.type,
                                      category: (file.category || 'cad') as any,
                                      fileSize: file.size,
                                      uploadDate: file.uploadedDate,
                                      uploadedBy: file.uploadedBy,
                                      dataUrl: file.dataUrl || ''
                                    }, logAction);
                                  }}
                                  className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded cursor-pointer"
                                  title="Download actual uploaded file"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  deleteUploadedFile(file.id, setUploaded3DFiles);
                                  deleteUploadedFile(file.id, setUploaded2DFiles);
                                  deleteUploadedFile(file.id, setUploaded3DDocs);
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 08: BOM STRUCTURE */}
              {activeStep === 7 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-cyan-500">
                        08 — Bill of Materials (BOM) Structure
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Manually assemble child components. Parent product <span className="font-mono text-cyan-400 font-bold">{formFields.partNumber || 'Current Assembly'}</span> is prevented from self-selection.
                      </p>
                    </div>
                    {!isAddingBomComponent && (
                      <button
                        type="button"
                        onClick={() => {
                          // Find first available part that is NOT the parent part
                          const availablePart = parts.find(p => p.partNumber !== formFields.partNumber && p.name !== formFields.name && !bomComponents.some(b => b.partNumber === p.partNumber));
                          setNewBomComponent({
                            partId: availablePart?.id || `PN-${Date.now().toString().slice(-4)}`,
                            partNumber: availablePart?.partNumber || 'PN-NEW-001',
                            name: availablePart?.name || 'Component Sub-Assembly',
                            quantity: 1,
                            material: availablePart?.material || 'Aluminum 6061-T6',
                            unitCost: availablePart?.estimatedCost || 50
                          });
                          setIsAddingBomComponent(true);
                        }}
                        className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Component</span>
                      </button>
                    )}
                  </div>

                  {/* Manual Component Entry Form */}
                  {isAddingBomComponent && (
                    <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-500/5 space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5 border-cyan-500/20">
                        <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Define Manual BOM Component</span>
                        </span>
                        <span className="text-[10px] text-slate-400">All fields editable</span>
                      </div>

                      {/* Select existing part or type new */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300 block">Select Existing Catalog Part (Optional)</label>
                        <select
                          value={newBomComponent.partNumber}
                          onChange={(e) => {
                            const selected = parts.find(p => p.partNumber === e.target.value);
                            if (selected) {
                              setNewBomComponent({
                                partId: selected.id,
                                partNumber: selected.partNumber,
                                name: selected.name,
                                quantity: newBomComponent.quantity || 1,
                                material: selected.material,
                                unitCost: selected.estimatedCost
                              });
                            } else {
                              setNewBomComponent(prev => ({ ...prev, partNumber: e.target.value }));
                            }
                          }}
                          className="plm-select w-full text-xs"
                        >
                          <option value="">-- Or Select from Existing Parts Catalog --</option>
                          {parts
                            .filter(p => p.partNumber !== formFields.partNumber && p.name !== formFields.name)
                            .map(p => (
                              <option key={p.id} value={p.partNumber}>
                                {p.partNumber} &mdash; {p.name} ({p.material})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold block text-slate-300">Part Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ASM-CAR-510"
                            value={newBomComponent.partNumber}
                            onChange={(e) => setNewBomComponent(prev => ({ ...prev, partNumber: e.target.value }))}
                            className="plm-input w-full font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold block text-slate-300">Part Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Planet Gear Carrier Sub-Assembly"
                            value={newBomComponent.name}
                            onChange={(e) => setNewBomComponent(prev => ({ ...prev, name: e.target.value }))}
                            className="plm-input w-full text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold block text-slate-300">Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={newBomComponent.quantity}
                            onChange={(e) => setNewBomComponent(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="plm-input w-full font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold block text-slate-300">Material</label>
                          <input
                            type="text"
                            placeholder="e.g. Aluminum 7075-T6"
                            value={newBomComponent.material}
                            onChange={(e) => setNewBomComponent(prev => ({ ...prev, material: e.target.value }))}
                            className="plm-input w-full text-xs"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold block text-slate-300">Unit Cost ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newBomComponent.unitCost}
                            onChange={(e) => setNewBomComponent(prev => ({ ...prev, unitCost: Number(e.target.value) || 0 }))}
                            className="plm-input w-full font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-cyan-500/20">
                        <button
                          type="button"
                          onClick={() => setIsAddingBomComponent(false)}
                          className="btn-secondary btn-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBomComponent.partNumber || !newBomComponent.name) {
                              alert('Please enter a Part Number and Part Name.');
                              return;
                            }

                            // Prevent parent product from being added
                            if (newBomComponent.partNumber === formFields.partNumber || newBomComponent.name === formFields.name) {
                              alert(`Cannot add the parent product (${newBomComponent.partNumber}) as its own child component.`);
                              return;
                            }

                            // Prevent duplicate rows
                            if (bomComponents.some(c => c.partNumber.toLowerCase() === newBomComponent.partNumber.toLowerCase())) {
                              alert(`Component with Part Number "${newBomComponent.partNumber}" is already in the BOM list.`);
                              return;
                            }

                            setBomComponents(prev => [
                              ...prev,
                              {
                                partId: newBomComponent.partId || `PN-${Date.now().toString().slice(-4)}`,
                                partNumber: newBomComponent.partNumber.trim(),
                                name: newBomComponent.name.trim(),
                                quantity: Number(newBomComponent.quantity) || 1,
                                material: newBomComponent.material || 'Alloy Steel',
                                unitCost: Number(newBomComponent.unitCost) || 0
                              }
                            ]);

                            setIsAddingBomComponent(false);
                          }}
                          className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer shadow-md shadow-cyan-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Component to BOM</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Components List Table */}
                  {bomComponents.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {bomComponents.map((comp, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}>
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-cyan-400 font-mono">{comp.partNumber}</span>
                                <span className="text-slate-400">&bull;</span>
                                <span className="font-semibold text-slate-200">{comp.name}</span>
                              </div>
                              <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                                Material: <strong className="text-slate-300">{comp.material}</strong> &bull; Unit Cost: <strong className="text-emerald-400 font-mono">${comp.unitCost}</strong> &bull; Ext. Cost: <strong className="text-emerald-400 font-mono">${(comp.unitCost * comp.quantity).toFixed(2)}</strong>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3.5 justify-end">
                              <div className="flex items-center space-x-1.5 font-mono text-xs">
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={comp.quantity}
                                  onChange={(e) => {
                                    const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                    setBomComponents(prev => prev.map((c, i) => i === idx ? { ...c, quantity: newQty } : c));
                                  }}
                                  className="plm-input w-16 font-mono px-2 py-0.5 text-center text-xs font-bold text-cyan-300"
                                />
                              </div>

                              <button
                                type="button"
                                title="Remove component from BOM"
                                onClick={() => {
                                  setBomComponents(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rollup Summary */}
                      <div className="p-3 rounded-xl bg-slate-700/10 border border-slate-700/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div>
                          <span className="text-slate-400">Total Unique Items: </span>
                          <strong className="text-cyan-400">{bomComponents.length}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Assembly Qty: </span>
                          <strong className="text-cyan-400">{bomComponents.reduce((sum, c) => sum + c.quantity, 0)} pcs</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Rollup Ext. Cost: </span>
                          <strong className="text-emerald-400">${bomComponents.reduce((sum, c) => sum + (c.unitCost * c.quantity), 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
                      <Layers className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-semibold text-slate-300">
                        No BOM components added yet.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Click <strong className="text-cyan-400">"+ Add Component"</strong> above to manually enter or select part numbers, names, and quantities.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 09: MANUFACTURING */}
              {activeStep === 8 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    09 — Manufacturing Data
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Manufacturing Method</label>
                      <select
                        value={formFields.mfgMethod}
                        onChange={(e) => handleFieldChange({ mfgMethod: e.target.value })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        <option value="Machining">Machining</option>
                        <option value="Casting">Casting</option>
                        <option value="Forging">Forging</option>
                        <option value="Sheet Metal">Sheet Metal</option>
                        <option value="Welding">Welding</option>
                        <option value="Additive Manufacturing">Additive Manufacturing</option>
                        <option value="Assembly">Assembly</option>
                        <option value="Injection Molding">Injection Molding</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Routing / Flow</label>
                      <input
                        type="text"
                        value={formFields.routing}
                        onChange={(e) => handleFieldChange({ routing: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Cycle Time (min)</label>
                      <input
                        type="number"
                        value={formFields.cycleTimeMin}
                        onChange={(e) => handleFieldChange({ cycleTimeMin: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 10: PROCUREMENT */}
              {activeStep === 9 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    10 — Procurement & Supplier
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Make / Buy</label>
                      <select
                        value={formFields.makeBuy}
                        onChange={(e) => handleFieldChange({ makeBuy: e.target.value })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        <option value="Make">Make</option>
                        <option value="Buy">Buy</option>
                        <option value="Make & Buy">Make & Buy</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Preferred Supplier</label>
                      <input
                        type="text"
                        value={formFields.preferredSupplier}
                        onChange={(e) => handleFieldChange({ preferredSupplier: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Target Lead Time</label>
                      <input
                        type="text"
                        value={formFields.procureLeadTime}
                        onChange={(e) => handleFieldChange({ procureLeadTime: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 11: COSTS */}
              {activeStep === 10 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    11 — Cost & Commercial Information
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Material Cost ($)</label>
                      <input
                        type="number"
                        value={formFields.materialCost}
                        onChange={(e) => handleFieldChange({ materialCost: parseFloat(e.target.value) || 0 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Labor Cost ($)</label>
                      <input
                        type="number"
                        value={formFields.laborCost}
                        onChange={(e) => handleFieldChange({ laborCost: parseFloat(e.target.value) || 0 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Overhead Cost ($)</label>
                      <input
                        type="number"
                        value={formFields.overheadCost}
                        onChange={(e) => handleFieldChange({ overheadCost: parseFloat(e.target.value) || 0 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block text-cyan-500 font-bold">Estimated Total Cost</label>
                      <div className="h-9 px-3 border border-slate-700/40 rounded-lg flex items-center bg-slate-700/10 font-bold font-mono text-cyan-500">
                        ${calculatedTotalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 12: QUALITY */}
              {activeStep === 11 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    12 — Quality Requirements
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Quality Level</label>
                      <input
                        type="text"
                        value={formFields.qualityLevel}
                        onChange={(e) => handleFieldChange({ qualityLevel: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Inspection Standard</label>
                      <input
                        type="text"
                        value={formFields.inspectionStandard}
                        onChange={(e) => handleFieldChange({ inspectionStandard: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Critical Characteristics</label>
                      <input
                        type="text"
                        value={formFields.criticalChar}
                        onChange={(e) => handleFieldChange({ criticalChar: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 13: DFMEA */}
              {activeStep === 12 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    13 — DFMEA Risk Assessment
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="font-semibold block">Severity (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.dfmeaSeverity}
                        onChange={(e) => handleFieldChange({ dfmeaSeverity: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Occurrence (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.dfmeaOccurrence}
                        onChange={(e) => handleFieldChange({ dfmeaOccurrence: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Detection (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.dfmeaDetection}
                        onChange={(e) => handleFieldChange({ dfmeaDetection: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block text-cyan-500 font-bold">Calculated RPN</label>
                      <div className="h-9 px-3 border border-slate-700/40 rounded-lg flex items-center bg-slate-700/10 font-bold font-mono text-cyan-500">
                        {(formFields.dfmeaSeverity * formFields.dfmeaOccurrence * formFields.dfmeaDetection)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 14: PFMEA */}
              {activeStep === 13 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    14 — PFMEA Process Risk
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <label className="font-semibold block">Severity (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.pfmeaSeverity}
                        onChange={(e) => handleFieldChange({ pfmeaSeverity: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Occurrence (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.pfmeaOccurrence}
                        onChange={(e) => handleFieldChange({ pfmeaOccurrence: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Detection (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formFields.pfmeaDetection}
                        onChange={(e) => handleFieldChange({ pfmeaDetection: parseInt(e.target.value) || 1 })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block text-cyan-500 font-bold">Calculated RPN</label>
                      <div className="h-9 px-3 border border-slate-700/40 rounded-lg flex items-center bg-slate-700/10 font-bold font-mono text-cyan-500">
                        {(formFields.pfmeaSeverity * formFields.pfmeaOccurrence * formFields.pfmeaDetection)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 15: DOCUMENTS (EXPANDED PROJECT DOCUMENTS) */}
              {activeStep === 14 && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                      15 — Project Documents & Specifications
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold block">Document Number</label>
                        <input
                          type="text"
                          value={formFields.docNumber}
                          onChange={(e) => handleFieldChange({ docNumber: e.target.value })}
                          className="plm-input px-3 py-2 w-full font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Document Type</label>
                        <select
                          value={formFields.docType}
                          onChange={(e) => handleFieldChange({ docType: e.target.value })}
                          className="plm-select px-3 py-2 w-full"
                        >
                          <option value="CAD Drawing">2D Drawing / Blueprints</option>
                          <option value="Specification">Design Specification</option>
                          <option value="Test Report">ISO Inspection Report</option>
                          <option value="Instruction">Assembly Work Instruction</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold block">Document Classification</label>
                        <span className="badge-status badge-active block py-2.5 text-center mt-1 text-[10px]">APPROVED &middot; ENGINEERING</span>
                      </div>
                    </div>

                    {/* Drag and Drop Project Documents Area */}
                    <div className="space-y-2 text-xs">
                      <span className="font-semibold block">Attach Specifications, Datasheets & Manuals</span>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverProjDoc(true); }}
                        onDragLeave={() => setIsDragOverProjDoc(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOverProjDoc(false);
                          simulateFileUpload(e.dataTransfer.files, setUploadedProjectDocs, ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'CSV'], 'document');
                        }}
                        className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors flex flex-col items-center justify-center h-32 ${
                          isDragOverProjDoc
                            ? 'border-cyan-500 bg-cyan-500/5'
                            : isDark ? 'border-slate-700 bg-slate-800/10 hover:border-slate-600' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                        }`}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.onchange = (e) => {
                            simulateFileUpload((e.target as HTMLInputElement).files, setUploadedProjectDocs, ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'CSV'], 'document');
                          };
                          input.click();
                        }}
                      >
                        <UploadCloud className="w-8 h-8 text-cyan-500 mb-1" />
                        <span className="text-[11px] font-bold block text-slate-300">Drag Project Documents here</span>
                        <span className="text-[9px] text-slate-500">PDF, DOCX, XLSX, CSV</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Documents Queue */}
                  {uploadedProjectDocs.length > 0 && (
                    <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-1 border-slate-700/30">
                        <span className="text-xs font-bold block text-cyan-400">Project Attachments Vault</span>
                        <span className="text-[10px] text-slate-400 font-mono">Linked to Product {formFields.partNumber}</span>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {uploadedProjectDocs.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/10 border border-slate-700/40 text-xs">
                            <div className="space-y-1 flex-1 pr-4">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold font-mono truncate max-w-[280px] text-slate-200">{file.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">{file.size}</span>
                              </div>
                              {file.status === 'Uploading' ? (
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span className="text-emerald-400 font-semibold">Attached &bull; Project {projects.find(p => p.id === formFields.projectId)?.name || 'PRJ-01'}</span>
                                  <span>{file.uploadedDate}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {file.dataUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadActualStoredFile({
                                      id: file.id,
                                      productId: formFields.partNumber,
                                      partNumber: formFields.partNumber,
                                      projectId: formFields.projectId,
                                      fileName: file.name,
                                      fileType: file.type,
                                      category: 'document',
                                      fileSize: file.size,
                                      uploadDate: file.uploadedDate,
                                      uploadedBy: file.uploadedBy,
                                      dataUrl: file.dataUrl || ''
                                    }, logAction);
                                  }}
                                  className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded cursor-pointer"
                                  title="Download file"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteUploadedFile(file.id, setUploadedProjectDocs)}
                                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 16: PROJECTS */}
              {activeStep === 15 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    16 — Project & Program Association
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Project Program</label>
                      <select
                        value={formFields.projectId}
                        onChange={(e) => handleFieldChange({ projectId: e.target.value })}
                        className="plm-select px-3 py-2 w-full"
                      >
                        {projects.map(prj => (
                          <option key={prj.id} value={prj.id}>{prj.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Project Phase</label>
                      <input
                        type="text"
                        value={formFields.projectPhase}
                        onChange={(e) => handleFieldChange({ projectPhase: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Target Release Date</label>
                      <input
                        type="date"
                        value={formFields.targetReleaseDate}
                        onChange={(e) => handleFieldChange({ targetReleaseDate: e.target.value })}
                        className="plm-input px-3 py-2 w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 17: OWNERSHIP */}
              {activeStep === 16 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    17 — Ownership
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold block">Product Owner</label>
                      <input
                        type="text"
                        value={formFields.engOwner}
                        onChange={(e) => handleFieldChange({ engOwner: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Department</label>
                      <input
                        type="text"
                        value={formFields.engDepartment}
                        onChange={(e) => handleFieldChange({ engDepartment: e.target.value })}
                        className="plm-input px-3 py-2 w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Engineering Owner</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.name}
                        className="plm-input px-3 py-2 w-full bg-slate-700/10 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 18: LIFECYCLE & APPROVAL FLOW */}
              {activeStep === 17 && (
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                    18 — Lifecycle Stage & Approval Review Path
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs py-4 overflow-x-auto w-full">
                    {[
                      { label: 'DRAFT', desc: 'Completed' },
                      { label: 'ENGINEERING REVIEW', desc: 'Active' },
                      { label: 'DESIGN REVIEW', desc: 'Pending' },
                      { label: 'MANUFACTURING REVIEW', desc: 'Pending' },
                      { label: 'QUALITY REVIEW', desc: 'Pending' },
                      { label: 'APPROVAL', desc: 'Pending' },
                      { label: 'RELEASED', desc: 'Pending' }
                    ].map((step, idx) => {
                      const isCompleted = idx === 0;
                      const isActive = idx === 1;
                      return (
                        <React.Fragment key={idx}>
                          <div className={`p-3 rounded-xl border shrink-0 font-mono text-[10px] text-center font-bold flex-1 ${
                            isActive
                              ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]'
                              : isCompleted
                              ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                              : isDark ? 'border-[#334155] bg-[#111B2E] text-[#CBD5E1]' : 'border-[#CBD5E1] bg-slate-100 text-slate-700'
                          }`} style={{ minWidth: '138px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {step.label}
                          </div>
                          {idx < 6 && <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 19: REVIEW & SUBMIT */}
              {activeStep === 18 && (
                <div className="space-y-6">
                  {/* Summary of Core Sections */}
                  <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-500 border-b pb-2 border-slate-700/30">
                      19 — Review & Submit
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* Summary Section 01 */}
                      <div className="flex items-start justify-between border-b pb-2 border-slate-700/20">
                        <div>
                          <strong className="text-slate-200">01 — Basic Product Information</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Number: {formFields.partNumber} &bull; Name: {formFields.name} &bull; Type: {formFields.type} &bull; Category: {formFields.category}
                          </p>
                        </div>
                        <button type="button" onClick={() => setActiveStep(0)} className="text-cyan-500 hover:underline">Edit</button>
                      </div>

                      {/* Summary Section 03 */}
                      <div className="flex items-start justify-between border-b pb-2 border-slate-700/20">
                        <div>
                          <strong className="text-slate-200">03 — Revision & Version Control</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Rev: {formFields.revision} &bull; Ver: {formFields.version} &bull; Reason: {formFields.reasonForChange}
                          </p>
                        </div>
                        <button type="button" onClick={() => setActiveStep(2)} className="text-cyan-500 hover:underline">Edit</button>
                      </div>

                      {/* Summary Section 05 */}
                      <div className="flex items-start justify-between border-b pb-2 border-slate-700/20">
                        <div>
                          <strong className="text-slate-200">05 — Materials & Physical Properties</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Material: {formFields.material} &bull; Weight: {formFields.weightKg} kg &bull; Finish: {formFields.surfaceFinish}
                          </p>
                        </div>
                        <button type="button" onClick={() => setActiveStep(4)} className="text-cyan-500 hover:underline">Edit</button>
                      </div>

                      {/* Summary Section 07 */}
                      <div className="flex items-start justify-between border-b pb-2 border-slate-700/20">
                        <div>
                          <strong className="text-slate-200">07 — CAD & Design Files</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Uploaded CAD Models: {uploaded3DFiles.length} &bull; Uploaded 2D Drawings: {uploaded2DFiles.length}
                          </p>
                        </div>
                        <button type="button" onClick={() => setActiveStep(6)} className="text-cyan-500 hover:underline">Edit</button>
                      </div>
                    </div>
                  </div>

                  {/* Submission triggers */}
                  <div className={`rounded-xl p-5 border shadow-sm flex items-center justify-end space-x-2 text-xs ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="btn-secondary cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateProduct}
                      className="btn-primary cursor-pointer"
                    >
                      {editingProductId ? 'Save Product Changes' : 'Create Product Record'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sticky bottom navigation (Steps 0 to 17) */}
              {activeStep < 18 && (
                <div className="space-y-3">
                  {/* Validation Error Message Banner */}
                  {validationAlert && (
                    <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-start space-x-2.5 text-xs animate-in fade-in duration-200 shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="font-bold text-rose-300">Required Field Missing</div>
                        <div className="text-rose-200/90 text-[11px] leading-relaxed">{validationAlert}</div>
                      </div>
                    </div>
                  )}

                  <div className={`rounded-xl p-4 border shadow-sm flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <button
                      type="button"
                      disabled={activeStep === 0}
                      onClick={handlePrevStep}
                      className={`btn-secondary cursor-pointer ${activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <div className="hidden sm:flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                      <span>Section {activeStep + 1} of 19 &bull; {stepsList[activeStep].label}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="btn-primary cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* 3. PRODUCT DETAILS VIEW */}
      {viewMode === 'details' && selectedProduct && (
        <div className="space-y-6">
          {/* Header */}
          <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="flex items-center space-x-3.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl border shrink-0 transition-colors hover:bg-slate-700/10 cursor-pointer ${
                  isDark ? 'border-[#243149] text-cyan-400' : 'border-[#E2E8F0] text-cyan-700'
                }`}
                title="Back to Product Master"
              >
                <ArrowRight className="w-4.5 h-4.5 rotate-180" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-cyan-500 text-lg">{selectedProduct.partNumber}</span>
                  <span className="badge-status badge-active text-[10px]">REV {selectedProduct.currentRev}</span>
                  <span className={`badge-status ${
                    selectedProduct.lifecycleStage === 'production' || selectedProduct.completionPercent === 100
                      ? 'badge-active'
                      : 'badge-draft'
                  } text-[10px] uppercase font-bold`}>
                    {selectedProduct.lifecycleStage === 'production' || selectedProduct.completionPercent === 100
                      ? 'COMPLETED / RELEASE-READY'
                      : `IN PROGRESS (${selectedProduct.completionPercent || 50}%)`}
                  </span>
                </div>
                <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  {selectedProduct.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => handleOpenEditProduct(selectedProduct)}
                className="btn-primary cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-cyan-500/20"
                title="Open and edit this product in Product Master"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Product Master</span>
              </button>
              <button
                onClick={() => handleCreateNewRevision(selectedProduct)}
                className="btn-secondary cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Revision</span>
              </button>
              <button
                onClick={() => {
                  onSelectPart(selectedProduct.id);
                  onNavigateTab('cad');
                }}
                className="btn-secondary cursor-pointer"
              >
                <span>Interactive 3D CAD</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setProductToDelete(selectedProduct)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/70 font-semibold cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm shadow-rose-500/10"
                  title="Permanently delete this product across entire PLM system (Admin Only)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Product</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs bar */}
          <div className={`rounded-xl border p-1 shadow-sm flex items-center space-x-1 overflow-x-auto ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            {[
              { id: 'overview', label: 'OVERVIEW' },
              { id: 'cad', label: 'CAD' },
              { id: 'bom', label: 'BOM' },
              { id: 'documents', label: 'DOCUMENTS' },
              { id: 'engineering', label: 'ENGINEERING' },
              { id: 'dfmea', label: 'RISK / DFMEA' },
              { id: 'changes', label: 'CHANGE' },
              { id: 'manufacturing', label: 'MANUFACTURING' },
              { id: 'quality', label: 'QUALITY' },
              { id: 'history', label: 'REVISION HISTORY' },
              { id: 'projects', label: 'PROJECT' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  detailTab === tab.id
                    ? isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                    : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F32]' : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Details Tabs contents */}
          <div className="space-y-6">
            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className={`rounded-xl p-5 border shadow-sm space-y-4 md:col-span-2 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Basic Info & Identification</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#94A3B8] block">Product Number:</span>
                      <strong className="font-mono text-cyan-400">{selectedProduct.partNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block">Type:</span>
                      <strong>{selectedProduct.type}</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block">Category:</span>
                      <strong>{selectedProduct.category}</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block">Current Revision:</span>
                      <strong className="font-mono text-amber-500">Rev {selectedProduct.currentRev}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#94A3B8] block">Description:</span>
                      <p className="mt-1 text-slate-300">{selectedProduct.description}</p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Lifecycle Stage Workflow</h3>
                  
                  <div className="space-y-3.5">
                    {[
                      { label: 'Concept (Draft)', val: 'concept' },
                      { label: 'Engineering Design', val: 'design' },
                      { label: 'Design Review / Prototype', val: 'prototype' },
                      { label: 'Production Validation (Released)', val: 'production' },
                      { label: 'Obsolete / End of Life', val: 'obsolete' }
                    ].map((step, idx) => {
                      const isActive = selectedProduct.lifecycleStage === step.val;
                      return (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                              : 'bg-slate-700/20 border-slate-700 text-slate-500'
                          }`}>
                            {isActive ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span className={isActive ? 'font-bold text-cyan-400' : 'text-slate-500'}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'engineering' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Engineering Specifications</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[#94A3B8] block">Lead Design Engineer:</span>
                      <strong>Alex Rivera, PE</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block">Design Standard Complied:</span>
                      <strong>ASME Y14.5M GD&T Compliant</strong>
                    </div>
                    <div>
                      <span className="text-[#94A3B8] block">Performance Requirements:</span>
                      <p className="mt-1 text-slate-300">Max operating torque dynamic load 120 Nm. ISO rotational balance Grade G2.5.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[#94A3B8] block">Design Notes & Technical Comments:</span>
                      <p className="p-3 bg-slate-700/10 border border-slate-700/40 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed">
                        Case harden gears using alloy carburizing to depth 0.8-1.2mm. Flange surface parallel limits crucial to limit bearing vibration telemetry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'cad' && (() => {
              const productVaultFiles = [
                ...getStoredCadVaultFiles(selectedProduct.id),
                ...getStoredCadVaultFiles(selectedProduct.partNumber),
                ...(selectedProduct.cadMetadata?.attachedFiles || [])
              ].filter((f, idx, arr) => arr.findIndex(x => x.id === f.id || (x.fileName === f.fileName && x.dataUrl === f.dataUrl)) === idx);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`rounded-xl p-5 border shadow-sm space-y-4 md:col-span-2 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>CAD Master &amp; Geometry Metadata</h3>
                        <span className="badge-status badge-active text-[10px]">VAULT CONTROLLED</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-[#94A3B8] block">CAD File Name:</span>
                          <strong className="text-cyan-400">{selectedProduct.cadMetadata.fileName}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Format:</span>
                          <strong>{selectedProduct.cadMetadata.format}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">File Size:</span>
                          <strong>{selectedProduct.cadMetadata.fileSize}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Bounding Box:</span>
                          <strong>{selectedProduct.cadMetadata.boundingDimensionsMm?.join(' x ')} mm</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Surface Area:</span>
                          <strong>{selectedProduct.cadMetadata.surfaceAreaCm2} cm²</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Volume:</span>
                          <strong>{selectedProduct.cadMetadata.volumeCm3} cm³</strong>
                        </div>
                      </div>

                      {/* Direct CAD Upload Box */}
                      <div className="pt-4 border-t border-slate-700/30">
                        <label className="text-xs font-bold text-slate-200 block mb-2">
                          Upload New 3D CAD Master (STEP, STP, IGES, SLDPRT, SLDASM, STL, DWG, PDF)
                        </label>
                        <div className="p-4 border-2 border-dashed rounded-xl text-center border-slate-700/40 bg-slate-700/10 hover:border-cyan-500/50 transition-all">
                          <input
                            type="file"
                            accept=".step,.stp,.iges,.igs,.sldprt,.sldasm,.x_t,.x_b,.stl,.dwg,.dxf,.pdf"
                            onChange={(e) => handleDirectCadUpload(e, selectedProduct)}
                            className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-500 mt-2 font-mono">
                            Uploaded CAD files automatically link to Product {selectedProduct.partNumber}, appear in CAD Vault, Documents, and Revision History.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CAD Actions Card */}
                    <div className={`rounded-xl p-5 border shadow-sm flex flex-col justify-between space-y-4 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}>
                      <div className="space-y-3 text-center">
                        <Box className="w-12 h-12 text-cyan-400 mx-auto" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">CAD Vault Status</span>
                          <p className="text-[11px] text-[#94A3B8] mt-1">3D B-Rep geometry parsed, checked-in, and synchronized across PLM modules.</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <button
                          onClick={() => setCadPreviewPart(selectedProduct)}
                          className="btn-primary btn-sm w-full flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View / Preview 3D CAD</span>
                        </button>

                        <button
                          onClick={() => {
                            onSelectPart(selectedProduct.id);
                            onNavigateTab('cad');
                          }}
                          className="btn-secondary btn-sm w-full flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Box className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Open in CAD Vault</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => downloadCadVaultFile({ part: selectedProduct, fileType: 'cad', logAction })}
                            className="btn-secondary btn-sm flex items-center justify-center space-x-1"
                            title="Download actual CAD file"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>Download CAD</span>
                          </button>

                          <button
                            onClick={() => downloadCadVaultFile({ part: selectedProduct, fileType: 'step', logAction })}
                            className="btn-secondary btn-sm flex items-center justify-center space-x-1"
                            title="Download actual STEP file"
                          >
                            <Download className="w-3 h-3 text-purple-400" />
                            <span>Download STEP</span>
                          </button>
                        </div>

                        <button
                          onClick={() => downloadCadVaultFile({ part: selectedProduct, fileType: 'pdf', logAction })}
                          className="btn-secondary btn-sm w-full flex items-center justify-center space-x-1"
                          title="Download 2D engineering drawing PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-400" />
                          <span>Download Drawing PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attached CAD & Vault Files Card */}
                  {productVaultFiles.length > 0 && (
                    <div className={`rounded-xl p-5 border shadow-sm space-y-3 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                        <div className="flex items-center space-x-2">
                          <Box className="w-4 h-4 text-cyan-400" />
                          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                            Attached CAD &amp; Vault Files ({productVaultFiles.length})
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Linked to Product: <strong className="text-cyan-400">{selectedProduct.partNumber}</strong> &bull; Project: <strong className="text-purple-400">{selectedProduct.projectName || selectedProduct.projectId || 'PRJ-01'}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {productVaultFiles.map((file, idx) => (
                          <div 
                            key={file.id || idx}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              isDark ? 'bg-[#0D1628] border-slate-700/50 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                  {file.fileType}
                                </span>
                                <strong className="font-mono text-xs truncate block text-slate-200" title={file.fileName}>
                                  {file.fileName}
                                </strong>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                {file.fileSize} &bull; {file.uploadDate}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => setCadPreviewPart(selectedProduct)}
                                className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-400 cursor-pointer"
                                title="View / Preview file in 3D"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => downloadActualStoredFile(file, logAction)}
                                className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400 cursor-pointer"
                                title="Download actual uploaded file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {detailTab === 'bom' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Bill of Materials Explorer Structure</h3>
                  <span className="badge-status badge-active text-[10px]">ENGINEERING EBOM</span>
                </div>

                {bomTrees[selectedProduct.id] ? (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-slate-700/10 border border-slate-700/40 rounded-xl font-mono text-xs flex items-center space-x-1.5 text-cyan-400">
                      <Box className="w-4 h-4" />
                      <strong>{selectedProduct.partNumber} &mdash; {selectedProduct.name} (Top Level Assembly)</strong>
                    </div>

                    <div className="pl-6 space-y-2 border-l-2 border-slate-700/40">
                      {bomTrees[selectedProduct.id].children?.map((node, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-700/40 bg-slate-700/5 text-xs">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-cyan-500">{node.partNumber}</span>
                            <span className="text-[#CBD5E1]">&bull;</span>
                            <span className="text-slate-300">{node.name}</span>
                          </div>

                          <div className="flex items-center space-x-4 font-mono text-[11px]">
                            <span>Qty: <strong className="text-amber-500">{node.quantity}</strong></span>
                            <span>Mat: <strong className="text-slate-300">{node.material}</strong></span>
                            <span>Cost: <strong className="text-emerald-500">${node.unitCost}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
                    No components linked. This item represents a standalone component item.
                  </div>
                )}
              </div>
            )}

            {detailTab === 'documents' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Attached Engineering Drawings & Spec Sheets</h3>
                
                <div className="space-y-2">
                  {(() => {
                    const linked = documents.filter(doc => doc.linkedPartId === selectedProduct.id || doc.docNumber?.includes(selectedProduct.partNumber));
                    if (linked.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                          No documents attached to this product master. Upload files during creation or editing.
                        </div>
                      );
                    }
                    return linked.map((doc, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-700/10 border-slate-700/40 hover:border-cyan-500/40 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <FileText className="w-5 h-5 shrink-0" />
                          </div>
                          <div>
                            <strong className="text-slate-200">{doc.title}</strong>
                            <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                              Doc Number: <span className="text-cyan-400">{doc.docNumber}</span> &bull; Rev {doc.revision} &bull; Type: {doc.type} &bull; Size: {doc.fileSize}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
                                const parts = doc.fileUrl.split(',');
                                const mimeMatch = parts[0].match(/:(.*?);/);
                                const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                                const bstr = atob(parts[1]);
                                let n = bstr.length;
                                const u8arr = new Uint8Array(n);
                                while (n--) {
                                  u8arr[n] = bstr.charCodeAt(n);
                                }
                                const blob = new Blob([u8arr], { type: mime });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.title.includes('.') ? doc.title : `${doc.docNumber}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }, 1000);
                              } else {
                                downloadCadVaultFile({
                                  part: selectedProduct,
                                  revision: doc.revision,
                                  fileType: doc.type.includes('Model') ? 'step' : 'pdf',
                                  userRole: currentUser.systemRole,
                                  logAction
                                });
                              }
                            }}
                            className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
                            title="Download actual stored file"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Download</span>
                          </button>
                          <span className="badge-status badge-active text-[10px]">CONTROLLED</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {detailTab === 'manufacturing' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>CAPP Process Planning & MES Parameters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="p-4 rounded-xl border border-slate-700/40 bg-slate-700/10 space-y-1">
                    <span className="text-[#94A3B8] block">Mfg Method:</span>
                    <strong className="text-cyan-400 text-sm">Precision Machining</strong>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-700/40 bg-slate-700/10 space-y-1">
                    <span className="text-[#94A3B8] block">Lead Time:</span>
                    <strong className="text-cyan-400 text-sm">15 Days Production</strong>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-700/40 bg-slate-700/10 space-y-1">
                    <span className="text-[#94A3B8] block">Machine Assigned:</span>
                    <strong className="text-cyan-400 text-sm">Haas 5-Axis Milling WC-05</strong>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'quality' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>ISO 9001 Metrology & Non-Conformance Records (NCR)</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-700/10 border border-slate-700/40 rounded-xl space-y-1">
                      <span className="text-[#94A3B8] block">Inspection Level:</span>
                      <strong className="text-cyan-400 font-semibold">AQL 1.0 (CMM Metric)</strong>
                    </div>
                    <div className="p-3 bg-slate-700/10 border border-slate-700/40 rounded-xl space-y-1">
                      <span className="text-[#94A3B8] block">Inspection Plan:</span>
                      <strong className="text-cyan-400 font-semibold">IP-{selectedProduct.partNumber}</strong>
                    </div>
                    <div className="p-3 bg-slate-700/10 border border-slate-700/40 rounded-xl space-y-1">
                      <span className="text-[#94A3B8] block">Metrology Target:</span>
                      <strong className="text-cyan-400 font-semibold">ISO 2859-1</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Related Quality NCR Tickets</span>
                    {(() => {
                      const linked = ncrs.filter(ncr => ncr.linkedPartId === selectedProduct.id || ncr.targetPartNumber === selectedProduct.partNumber);
                      if (linked.length === 0) {
                        return (
                          <div className="p-4 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                            No Non-Conformance Records (NCR) linked to this product.
                          </div>
                        );
                      }
                      return linked.map((ncr, idx) => (
                        <div key={idx} className="p-3 rounded-xl border flex items-center justify-between text-xs bg-slate-700/10 border-slate-700/40">
                          <div className="space-y-0.5">
                            <strong className="text-rose-400 font-mono">{ncr.ncrNumber} &bull; {ncr.title}</strong>
                            <div className="text-[10px] text-slate-400">
                              Reported By: {ncr.reportedBy} &bull; Date: {ncr.dateReported} &bull; Severity: <span className="text-rose-400 font-bold">{ncr.severity}</span>
                            </div>
                          </div>
                          <span className={`badge-status ${ncr.status === 'Closed' ? 'badge-active' : 'badge-draft'} text-[10px]`}>
                            {ncr.status.toUpperCase()}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'dfmea' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>DFMEA Design Failure Modes & Risk Matrix</h3>
                  <span className="badge-status badge-review text-[10px]">RPN CHECKED</span>
                </div>
                
                {(() => {
                  const row = dfmeaRows.find(r => r.linkedCadId === selectedProduct.id || r.component?.includes(selectedProduct.partNumber));
                  if (!row) {
                    return (
                      <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                        No active DFMEA risk assessment row linked to this product.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#94A3B8] block">Potential Failure Mode:</span>
                          <strong className="text-rose-400">{row.potentialFailureMode}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Potential Effect:</span>
                          <strong className="text-slate-300">{row.potentialEffect}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Recommended Action:</span>
                          <strong className="text-emerald-400">{row.recommendedDesignAction}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Status:</span>
                          <strong className="text-slate-300">{row.status}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-xs font-mono text-center">
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">SEVERITY (S)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.severity}</strong>
                        </div>
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">OCCURRENCE (O)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.occurrence}</strong>
                        </div>
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">DETECTION (D)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.detection}</strong>
                        </div>
                        <div className="p-2 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
                          <span className="text-cyan-400 block text-[9px]">RPN RATING</span>
                          <strong className="text-lg text-cyan-400 font-bold">{row.rpn}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {detailTab === 'pfmea' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                  <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>PFMEA Process Failures & Shop-Floor Risk</h3>
                  <span className="badge-status badge-review text-[10px]">RPN CHECKED</span>
                </div>
                
                {(() => {
                  const row = pfmeaRows.find(r => r.linkedPartId === selectedProduct.id || r.processStep?.includes(selectedProduct.partNumber));
                  if (!row) {
                    return (
                      <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                        No active PFMEA risk assessment row linked to this product.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#94A3B8] block">Potential Process Failure:</span>
                          <strong className="text-rose-400">{row.potentialProcessFailure}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Potential Effect:</span>
                          <strong className="text-slate-300">{row.effect}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Recommended Action:</span>
                          <strong className="text-emerald-400">{row.correctiveAction}</strong>
                        </div>
                        <div>
                          <span className="text-[#94A3B8] block">Status:</span>
                          <strong className="text-slate-300">{row.status}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-xs font-mono text-center">
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">SEVERITY (S)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.severity}</strong>
                        </div>
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">OCCURRENCE (O)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.occurrence}</strong>
                        </div>
                        <div className="p-2 border border-slate-700/40 rounded-xl">
                          <span className="text-slate-400 block text-[9px]">DETECTION (D)</span>
                          <strong className="text-lg text-amber-500 font-bold">{row.detection}</strong>
                        </div>
                        <div className="p-2 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
                          <span className="text-cyan-400 block text-[9px]">RPN RATING</span>
                          <strong className="text-lg text-cyan-400 font-bold">{row.rpn}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {detailTab === 'changes' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Linked Engineering Changes (ECR / ECN)</h3>
                
                <div className="space-y-2">
                  {(() => {
                    const linked = (ecrs || []).filter((ecr: ECR) => (
                      ecr.targetProductId === selectedProduct.id || 
                      ecr.targetProductPartNumber === selectedProduct.partNumber || 
                      ecr.impactedPartIds?.includes(selectedProduct.id)
                    ));
                    if (linked.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                          No active engineering changes (ECRs / ECOs) linked to this product.
                        </div>
                      );
                    }
                    return linked.map((ecr: ECR, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border flex items-center justify-between text-xs bg-slate-700/10 border-slate-700/40">
                        <div className="space-y-0.5">
                          <strong className="text-amber-500 font-mono">{ecr.id} &bull; {ecr.title}</strong>
                          <div className="text-[10px] text-slate-400">
                            Requested By: {ecr.requester || ecr.createdBy || 'Lead Engineer'} &bull; Severity: {ecr.severity}
                          </div>
                        </div>
                        <span className={`badge-status ${ecr.status === 'Approved' || ecr.status === 'Converted to ECN' ? 'badge-active' : 'badge-draft'} text-[10px]`}>
                          {ecr.status.toUpperCase()}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {detailTab === 'projects' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Linked Programs & Program Milestones</h3>
                
                {(() => {
                  const linkedTag = selectedProduct.tags.find(t => t.startsWith('PRJ-')) || 'PRJ-101';
                  const prj = projects.find(p => p.id === linkedTag || p.code === linkedTag) || projects[0];
                  if (!prj) {
                    return (
                      <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                        No active project mappings established.
                      </div>
                    );
                  }
                  return (
                    <div className="p-3.5 rounded-xl border flex items-center justify-between text-xs bg-slate-700/10 border-slate-700/40">
                      <div className="flex items-center space-x-3">
                        <FolderOpen className="w-5 h-5 text-cyan-500 shrink-0" />
                        <div>
                          <strong className="text-slate-200">{prj.name}</strong>
                          <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                            Code: {prj.code} &bull; Lead: {prj.manager} &bull; Progress: {prj.completionPercent}%
                          </div>
                        </div>
                      </div>
                      <span className="badge-status badge-active text-[10px]">ACTIVE WORKSPACE</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {detailTab === 'history' && (
              <div className={`rounded-xl p-5 border shadow-sm space-y-4 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <h3 className={`text-sm font-bold border-b pb-2 border-slate-700/30 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Revision Audit Trail</h3>
                
                <div className="plm-table-container">
                  <table className="plm-table text-xs">
                    <thead>
                      <tr>
                        <th>Revision</th>
                        <th>Modification Date</th>
                        <th>Author</th>
                        <th>Change Description Summary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.revisionHistory.map((rev, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-amber-500 font-mono">Rev {rev.revId}</td>
                          <td className="font-mono">{rev.date}</td>
                          <td>{rev.author}</td>
                          <td>{rev.changeSummary}</td>
                          <td>
                            <span className={`badge-status ${rev.status === 'Released' ? 'badge-active' : 'badge-draft'}`}>
                              {rev.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3D CAD & Attached Vault Preview Modal */}
      {cadPreviewPart && (
        <CadPreviewModal
          part={cadPreviewPart}
          onClose={() => setCadPreviewPart(null)}
        />
      )}

      {/* ADMIN PERMANENT DELETE CONFIRMATION MODAL */}
      {isAdmin && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 transition-colors ${
              isDark ? 'bg-[#0F172A] border-rose-500/40 text-[#F1F5F9]' : 'bg-white border-rose-300 text-[#172033]'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            {/* Modal Header */}
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase">
                    Admin Authorization Required
                  </span>
                </div>
                <h2 id="delete-dialog-title" className="text-lg font-bold text-rose-500 mt-1">
                  Delete this product permanently?
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  You are about to execute an irreversible system-wide deletion of this Product Master record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setProductToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Product Summary Card */}
            <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
              isDark ? 'bg-slate-900/80 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Product ID / Part Number:</span>
                <span className="font-bold text-cyan-400 text-sm">{productToDelete.partNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Product Name:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[260px]">{productToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Revision & Status:</span>
                <span className="text-amber-400">{productToDelete.currentRev || 'Rev A'} &bull; {productToDelete.productStatus || 'Draft'}</span>
              </div>
            </div>

            {/* System-Wide Cascade Warning */}
            <div className="rounded-xl p-3.5 bg-rose-500/10 border border-rose-500/25 space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanent System-Wide Purge Scope</span>
              </div>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                Confirming will immediately wipe this product and <strong>ALL associated data across all PLM modules</strong>:
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300 pt-1 font-mono">
                <span className="flex items-center space-x-1">&bull; Product Master record</span>
                <span className="flex items-center space-x-1">&bull; CAD Files & CAD Vault</span>
                <span className="flex items-center space-x-1">&bull; BOM / EBOM / MBOM</span>
                <span className="flex items-center space-x-1">&bull; Engineering Documents</span>
                <span className="flex items-center space-x-1">&bull; DFMEA & PFMEA rows</span>
                <span className="flex items-center space-x-1">&bull; ECR & ECO Changes</span>
                <span className="flex items-center space-x-1">&bull; Quality NCRs & CAPAs</span>
                <span className="flex items-center space-x-1">&bull; Inventory & CAPP routes</span>
              </div>
              <div className="text-[10px] text-rose-300 font-mono pt-1 border-t border-rose-500/20">
                🔒 ID <span className="font-bold underline">{productToDelete.partNumber}</span> will be permanently blacklisted to prevent duplicate recreation. Unrelated products/projects will not be altered.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-600 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteProduct(productToDelete)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Entire PLM System...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
