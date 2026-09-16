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

export const INITIAL_PARTS: PartItem[] = [
  {
    id: 'PN-1001',
    partNumber: 'ASM-EV-9000',
    name: 'Electric Scooter Drivetrain & Frame Assembly',
    description: 'Master mechanical assembly for electric scooter frame, drivetrain, wheels, and braking system.',
    type: 'Assembly',
    category: 'Composite Assembly',
    material: 'Aluminium 7075-T6 & Carbon Composite',
    weightKg: 28.4,
    estimatedCost: 1850.00,
    actualCost: 1780.00,
    currentRev: 'A.4',
    lifecycleStage: 'design',
    isCheckedOut: false,
    cadMetadata: {
      fileName: 'ASM-EV-9000.SLDASM',
      format: 'SLDASM',
      fileSize: '24.8 MB',
      surfaceAreaCm2: 12400.0,
      volumeCm3: 8400.0,
      boundingDimensionsMm: [450, 680, 1250],
      geometryType: 'ev_drivetrain',
      renderColor: '#38bdf8',
      supplierCode: 'VND-EV-900',
      familyGroup: 'Electric Mobility'
    },
    revisionHistory: [
      { revId: 'A.2', date: '2026-08-18', author: 'Alex Rivera', changeSummary: 'Initial DFM Optimization Release', status: 'Released' },
      { revId: 'A.3', date: '2026-08-20', author: 'Alex Rivera', changeSummary: 'Material change to Al 7075-T6', status: 'Released' },
      { revId: 'A.4', date: '2026-08-22', author: 'Alex Rivera', changeSummary: 'ECN-2026-042 Gear Radius Adjustment', status: 'Draft' }
    ],
    tags: ['EV Mobility', 'Master Assembly', 'SolidWorks 2025', 'Critical Path']
  },
  {
    id: 'PN-1002',
    partNumber: 'ASM-CAR-510',
    name: 'Planet Gear Carrier Sub-Assembly',
    description: 'CNC Machined 7075-T6 Aluminum Carrier supporting 3 planet shafts.',
    type: 'Sub-Assembly',
    category: 'CNC Machined',
    material: 'Aluminum 7075-T6 Anodized',
    weightKg: 3.20,
    estimatedCost: 380.00,
    actualCost: 345.00,
    currentRev: 'Rev B.0',
    lifecycleStage: 'prototype',
    isCheckedOut: true,
    checkedOutBy: 'Alex Rivera, PE',
    checkedOutDate: '2026-07-28 14:30',
    parentAssemblyId: 'PN-1001',
    cadMetadata: {
      fileName: 'ASM-CAR-510-REV-B.STEP',
      format: 'STEP',
      fileSize: '18.4 MB',
      surfaceAreaCm2: 1820.0,
      volumeCm3: 1180.0,
      boundingDimensionsMm: [180, 180, 85],
      geometryType: 'planetary_gearbox',
      renderColor: '#0ea5e9',
      supplierCode: 'VND-ALU-404'
    },
    revisionHistory: [
      { revId: 'Rev A.0', date: '2026-01-15', author: 'Alex Rivera', changeSummary: 'Initial release', status: 'Superseded' },
      { revId: 'Rev B.0', date: '2026-04-10', author: 'Alex Rivera', changeSummary: 'Lightweighting pocket cutouts added', status: 'Released' }
    ],
    tags: ['CNC Machined', 'Lightweight', 'Anodized']
  },
  {
    id: 'PN-1003',
    partNumber: 'PN-PGR-511',
    name: 'Precision Planet Gear 24T',
    description: 'Case hardened 8620 alloy steel planet gear, AGMA Quality 12 ground teeth.',
    type: 'Component',
    category: 'Cast Metal',
    material: '8620 Alloy Steel (Case Hardened 60 HRC)',
    weightKg: 0.65,
    estimatedCost: 85.00,
    actualCost: 78.00,
    currentRev: 'Rev A.2',
    lifecycleStage: 'production',
    isCheckedOut: false,
    parentAssemblyId: 'PN-1002',
    cadMetadata: {
      fileName: 'PN-PGR-511-A2.IGES',
      format: 'IGES',
      fileSize: '6.1 MB',
      surfaceAreaCm2: 410.0,
      volumeCm3: 82.0,
      boundingDimensionsMm: [72, 72, 35],
      geometryType: 'planetary_gearbox',
      renderColor: '#f59e0b',
      supplierCode: 'VND-GEAR-11'
    },
    revisionHistory: [
      { revId: 'Rev A.0', date: '2025-11-20', author: 'Alex Rivera', changeSummary: 'Initial Design', status: 'Superseded' },
      { revId: 'Rev A.2', date: '2026-02-14', author: 'Elena Rostova', changeSummary: 'Crowning added to tooth flank for noise reduction', status: 'Released' }
    ],
    tags: ['Gear', 'Carburized Steel', 'AGMA 12']
  },
  {
    id: 'PN-1004',
    partNumber: 'PN-SGN-520',
    name: 'Sun Gear Input Shaft 18T',
    description: 'Integrated sun gear and spline input drive shaft.',
    type: 'Component',
    category: 'CNC Machined',
    material: '4340 Chromoly Steel Nickel Plated',
    weightKg: 1.45,
    estimatedCost: 140.00,
    actualCost: 132.00,
    currentRev: 'Rev B.0',
    lifecycleStage: 'prototype',
    isCheckedOut: false,
    parentAssemblyId: 'PN-1001',
    cadMetadata: {
      fileName: 'PN-SGN-520.SLDPRT',
      format: 'SLDPRT',
      fileSize: '12.3 MB',
      surfaceAreaCm2: 650.0,
      volumeCm3: 185.0,
      boundingDimensionsMm: [55, 55, 240],
      geometryType: 'planetary_gearbox',
      renderColor: '#a855f7'
    },
    revisionHistory: [
      { revId: 'Rev A.0', date: '2026-01-10', author: 'Alex Rivera', changeSummary: 'Initial Concept Draft (Drawing pending)', status: 'Superseded' },
      { revId: 'Rev B.0', date: '2026-03-01', author: 'Alex Rivera', changeSummary: 'Involute spline DIN 5480 update', status: 'Released' }
    ],
    tags: ['Input Drive', 'Spline', 'High Stress']
  },
  {
    id: 'PN-2001',
    partNumber: 'ASM-EV-9000',
    name: 'Electric Scooter Drivetrain & Frame Assembly',
    description: 'Next-gen urban mobility chassis with integrated battery bay and rear hub drivetrain.',
    type: 'Assembly',
    category: 'Composite Assembly',
    material: 'Aluminum 6061-T6 Monocoque',
    weightKg: 28.40,
    estimatedCost: 2150.00,
    actualCost: 2090.00,
    currentRev: 'Rev A.4',
    lifecycleStage: 'design',
    isCheckedOut: false,
    cadMetadata: {
      fileName: 'ASM-EV-9000-A4.SLDASM',
      format: 'SLDASM',
      fileSize: '84.5 MB',
      surfaceAreaCm2: 12400.0,
      volumeCm3: 8400.0,
      boundingDimensionsMm: [450, 680, 1250],
      geometryType: 'ev_drivetrain',
      renderColor: '#10b981'
    },
    revisionHistory: [
      { revId: 'Rev A.0', date: '2026-02-01', author: 'Alex Rivera', changeSummary: 'Concept Architecture Freeze', status: 'Superseded' },
      { revId: 'Rev A.4', date: '2026-07-10', author: 'Marcus Vance', changeSummary: 'Chassis weldment gussets added after FEA stress study', status: 'Draft' }
    ],
    tags: ['EV Mobility', 'Chassis', 'Monocoque', 'FEA Validated']
  },
  {
    id: 'PN-3001',
    partNumber: 'ASM-DRN-1000',
    name: 'Autonomous Industrial Inspection Drone Frame',
    description: 'Carbon-fiber composite quadrotor airframe designed for IP67 harsh environments.',
    type: 'Assembly',
    category: 'Composite Assembly',
    material: '3K Carbon Fiber Weave & Titanium Hardware',
    weightKg: 2.15,
    estimatedCost: 890.00,
    actualCost: 840.00,
    currentRev: 'Rev C.0',
    lifecycleStage: 'production',
    isCheckedOut: false,
    cadMetadata: {
      fileName: 'ASM-DRN-1000-REV-C.STEP',
      format: 'STEP',
      fileSize: '29.8 MB',
      surfaceAreaCm2: 3400.0,
      volumeCm3: 540.0,
      boundingDimensionsMm: [520, 520, 180],
      geometryType: 'drone_frame',
      renderColor: '#ec4899'
    },
    revisionHistory: [
      { revId: 'Rev C.0', date: '2026-05-18', author: 'Alex Rivera', changeSummary: 'Production release for Gen 2 Drone', status: 'Released' }
    ],
    tags: ['UAV', 'Carbon Fiber', 'IP67', 'Aerospace']
  }
];

export const INITIAL_BOM_TREES: Record<string, BOMNode> = {
  'PN-1001': {
    id: 'BOM-001',
    partId: 'PN-1001',
    partNumber: 'ASM-GBX-5000',
    name: 'High-Torque Industrial Planetary Gearbox Assembly',
    revision: 'Rev B.1',
    quantity: 1,
    unit: 'pcs',
    material: 'Mixed Assembly',
    unitCost: 1180.50,
    weightKg: 14.85,
    carbonKgCO2: 42.5,
    children: [
      {
        id: 'BOM-002',
        partId: 'PN-1002',
        partNumber: 'ASM-CAR-510',
        name: 'Planet Gear Carrier Sub-Assembly',
        revision: 'Rev B.0',
        quantity: 1,
        unit: 'pcs',
        refDes: 'SUB-CARRIER-01',
        material: 'Aluminum 7075-T6 Anodized',
        unitCost: 345.00,
        weightKg: 3.20,
        carbonKgCO2: 18.2,
        stockStatus: 'In Stock',
        children: [
          {
            id: 'BOM-003',
            partId: 'PN-1003',
            partNumber: 'PN-PGR-511',
            name: 'Precision Planet Gear 24T',
            revision: 'Rev A.2',
            quantity: 3,
            unit: 'pcs',
            refDes: 'PGR-1, PGR-2, PGR-3',
            material: '8620 Alloy Steel (Case Hardened)',
            unitCost: 78.00,
            weightKg: 0.65,
            carbonKgCO2: 3.1,
            stockStatus: 'In Stock'
          },
          {
            id: 'BOM-004',
            partId: 'PN-PIN-515',
            partNumber: 'PN-PIN-515',
            name: 'Planet Shaft Dowel Pin 12x45mm',
            revision: 'Rev A.0',
            quantity: 3,
            unit: 'pcs',
            refDes: 'PIN-1, PIN-2, PIN-3',
            material: 'Hardened Tool Steel Ground',
            unitCost: 12.50,
            weightKg: 0.08,
            carbonKgCO2: 0.4,
            stockStatus: 'In Stock'
          }
        ]
      },
      {
        id: 'BOM-006',
        partId: 'PN-1004',
        partNumber: 'PN-SGN-520',
        name: 'Sun Gear Input Shaft 18T',
        revision: 'Rev B.0',
        quantity: 1,
        unit: 'pcs',
        refDes: 'INPUT-SUN-01',
        material: '4340 Chromoly Steel',
        unitCost: 132.00,
        weightKg: 1.45,
        carbonKgCO2: 6.8,
        stockStatus: 'Low Stock'
      },
      {
        id: 'BOM-MBOM-01',
        partId: 'MBOM-GREASE-01',
        partNumber: 'M-GREASE-SYNTH',
        name: 'Mobilith SHC 220 Synthetic Grease',
        revision: 'Rev A.0',
        quantity: 45,
        unit: 'grams',
        material: 'NLGI Grade 2 Synthetic Grease',
        unitCost: 0.15,
        weightKg: 0.045,
        carbonKgCO2: 0.1,
        isMbomOnly: true,
        mbomInstruction: 'Pack planet gear needle bearings with 15g each prior to carrier pressing.'
      },
      {
        id: 'BOM-SBOM-01',
        partId: 'SBOM-SEAL-KIT',
        partNumber: 'KIT-SEAL-GBX-500',
        name: 'Field Service Gearbox Fluororubber Seal Replacement Pack',
        revision: 'Rev A.0',
        quantity: 1,
        unit: 'kit',
        material: 'FKM Fluororubber & Viton O-Rings',
        unitCost: 28.50,
        weightKg: 0.12,
        carbonKgCO2: 0.6,
        isSbomOnly: true,
        sbomMaintenanceInterval: 'Recommended replacement every 2,500 operating hours or 12 months.'
      }
    ]
  }
};

export const INITIAL_ECRS: ECR[] = [
  {
    id: 'ECR-2026-104',
    title: 'Increase Sun Gear Fillet Radius to Mitigate Tooth Root Stress',
    requester: 'Alex Rivera, PE',
    dateCreated: '2026-07-20',
    severity: 'Critical',
    rootCause: 'Quality Non-Conformance',
    description: 'FEA fatigue analysis under 450 Nm overload torque demonstrated localized stress concentration exceeding yield at the root trochoid fillet.',
    proposedSolution: 'Increase root fillet radius from R0.6mm to R1.2mm using full-radius gear hobbing cutter.',
    impactedPartIds: ['PN-1004', 'PN-1001'],
    status: 'In Review',
    workflowStage: 'Design Review',
    priority: 'Critical',
    riskScore: 68,
    targetProductId: 'PN-1004',
    targetProductPartNumber: 'PN-1004 (Sun Gear)',
    currentRevision: 'Rev B.0',
    proposedRevision: 'Rev B.1',
    reasonForChange: 'Resolve tooth root micro-fractures under cyclical shock loads in mining drivetrain endurance tests.',
    affectedComponents: 'Planetary Sun Gear, Spline Shaft Coupling',
    estimatedSavingsOrCost: 1450.00,
    attachments: [
      { id: 'att-101', name: 'FEA_Stress_Concentration_Report_v2.pdf', size: '2.4 MB', type: 'PDF Report', uploadedAt: '2026-07-20' },
      { id: 'att-102', name: 'Sun_Gear_Fillet_Redline_RevB.dwg', size: '4.8 MB', type: 'CAD Drawing', uploadedAt: '2026-07-21' }
    ],
    signoffs: {
      design: { persona: 'design', approved: true, approverName: 'Alex Rivera, PE', date: '2026-07-22', comments: 'FEA model stress verification verified in ANSYS Workbench.', digitalSignatureHash: 'SIG-94B201-ALEX' },
      mfg: { persona: 'mfg', approved: false, approverName: 'Marcus Vance', comments: 'Evaluating CNC hobbing tool clearance and cycle time impact.' },
      quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
      pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
      admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
    }
  },
  {
    id: 'ECR-2026-105',
    title: 'Material Substitution for Ring Gear Flange Housing',
    requester: 'Marcus Vance',
    dateCreated: '2026-08-01',
    severity: 'Major',
    rootCause: 'Cost Reduction',
    description: 'Transition from forged 4340 alloy steel to investment cast ductile iron grade 80-55-06 for non-structural outer casing to reduce billet machining cycle time by 32%.',
    proposedSolution: 'Qualify ductile iron ASTM A536 casting supplier and update FEA structural casing model.',
    impactedPartIds: ['PN-1001'],
    status: 'In Review',
    workflowStage: 'Mfg Review',
    priority: 'High',
    riskScore: 42,
    targetProductId: 'PN-1001',
    targetProductPartNumber: 'PN-1001 (Gearbox Housing)',
    currentRevision: 'Rev B.0',
    proposedRevision: 'Rev B.1',
    reasonForChange: 'Reduce rough turning machine hours and raw material ingot cost without compromising structural torsional stiffness.',
    affectedComponents: 'Housing Casing, Mounting Flange',
    estimatedSavingsOrCost: 3800.00,
    attachments: [
      { id: 'att-103', name: 'Material_Tensile_Test_Spec_DuctileIron.pdf', size: '1.8 MB', type: 'Material Spec', uploadedAt: '2026-08-01' }
    ],
    signoffs: {
      design: { persona: 'design', approved: true, approverName: 'Alex Rivera, PE', date: '2026-08-02', comments: 'Wall thickness increased by 0.5mm to match torsional rigidity.', digitalSignatureHash: 'SIG-88E412-ALEX' },
      mfg: { persona: 'mfg', approved: true, approverName: 'Marcus Vance', date: '2026-08-04', comments: 'Foundry casting tooling quote approved with Tier-1 supplier.', digitalSignatureHash: 'SIG-77F891-MARCUS' },
      quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
      pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
      admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
    }
  },
  {
    id: 'ECR-2026-106',
    title: 'Bearing Retention Ring Chamfer & Groove Tolerance Adjustment',
    requester: 'Alex Rivera, PE',
    dateCreated: '2026-08-10',
    severity: 'Minor',
    rootCause: 'DFM Friction',
    description: 'Assembly line reported occasional binding during high-speed automated robotic snap-ring insertion into carrier groove.',
    proposedSolution: 'Add 15° lead-in chamfer on the inner retention groove and expand radial tolerance by +0.025mm.',
    impactedPartIds: ['PN-1002'],
    status: 'Draft',
    workflowStage: 'Draft',
    priority: 'Medium',
    riskScore: 18,
    targetProductId: 'PN-1002',
    targetProductPartNumber: 'PN-1002 (Planetary Carrier)',
    currentRevision: 'Rev A.2',
    proposedRevision: 'Rev A.3',
    reasonForChange: 'Eliminate operator manual rework during automated robotic snap-ring assembly.',
    affectedComponents: 'Planetary Carrier, Retaining Rings',
    estimatedSavingsOrCost: 850.00,
    attachments: [
      { id: 'att-104', name: 'Snap_Ring_Groove_Dimension_Tolerance.pdf', size: '1.2 MB', type: 'Drawing Markup', uploadedAt: '2026-08-10' }
    ],
    signoffs: {
      design: { persona: 'design', approved: false, approverName: 'Alex Rivera, PE' },
      mfg: { persona: 'mfg', approved: false, approverName: 'Marcus Vance' },
      quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova' },
      pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
      admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
    }
  }
];

export const INITIAL_ECNS: ECN[] = [
  {
    id: 'ECN-2026-042',
    title: 'Planetary Gearbox Housing Tolerancing & Bearing Seat Upgrade',
    linkedEcrId: 'ECR-2026-088',
    leadEngineer: 'Marcus Vance',
    dateInitiated: '2026-06-15',
    targetReleaseDate: '2026-08-15',
    pipelineStage: 'Quality Review',
    targetPartId: 'PN-1001',
    fromRevision: 'Rev B.0',
    toRevision: 'Rev B.1',
    reasonForChange: 'Resolve thermal binding issue during continuous duty 10,000 RPM endurance run.',
    riskScore: 28,
    impactAnalysis: {
      bomCostDeltaPercent: -2.4,
      massDeltaKg: -0.15,
      toolingModRequired: true,
      assemblyTimeDeltaSec: -45,
      scrapInventoryCost: 420.00
    },
    signoffs: {
      design: { persona: 'design', approved: true, approverName: 'Alex Rivera, PE', date: '2026-06-18', comments: 'Thermal clearance verified via ANSYS Mechanical Workbench.', digitalSignatureHash: 'SIG-88F92A-ALEX' },
      mfg: { persona: 'mfg', approved: true, approverName: 'Marcus Vance', date: '2026-06-22', comments: 'CNC bore reaming toolpath updated on Mazak 5-Axis.', digitalSignatureHash: 'SIG-90E14B-MARCUS' },
      quality: { persona: 'quality', approved: false, approverName: 'Dr. Elena Rostova', comments: 'Awaiting CMM inspection result on 1st article sample.' },
      pm: { persona: 'pm', approved: false, approverName: 'David Sterling' },
      admin: { persona: 'admin', approved: false, approverName: 'System Admin' }
    }
  }
];

export const INITIAL_STAGE_GATES: StageGate[] = [
  {
    gateId: 1,
    gateName: 'Gate 1: Concept & Product Architecture Freeze',
    stage: 'concept',
    description: 'Validation of market requirements, system envelope calculations, initial BOM estimates, and patent clearance.',
    status: 'Passed',
    targetCompletionDate: '2026-02-15',
    actualCompletionDate: '2026-02-10',
    completionPercent: 100,
    responsibleEngineer: 'Alex Rivera, PE',
    checklist: [
      { id: 'G1-01', task: 'System Specification Freeze Document', requiredRole: 'pm', completed: true, completedBy: 'David Sterling' }
    ]
  }
];

export const INITIAL_DOCUMENTS: EngineeringDocument[] = [
  {
    id: 'DOC-101',
    title: 'High-Torque Planetary Gearbox 2D Assembly Drawing.pdf',
    docNumber: 'DWG-GBX-5000-01',
    type: '2D Drawing PDF',
    linkedPartId: 'PN-1001',
    revision: 'Rev B.1',
    author: 'Alex Rivera, PE',
    uploadDate: '2026-06-22',
    fileSize: '4.8 MB',
    status: 'Approved',
    fileExtension: 'pdf',
    category: 'pdf',
    description: 'ASME Y14.5M Master Orthographic Assembly Drawing with GD&T and Balloon BOM callouts.'
  },
  {
    id: 'DOC-102',
    title: 'ASM-GBX-5000 Planetary Gearbox Main Assembly.step',
    docNumber: 'CAD-GBX-5000-01',
    type: '3D CAD Model',
    linkedPartId: 'PN-1001',
    revision: 'Rev B.1',
    author: 'Alex Rivera, PE',
    uploadDate: '2026-06-25',
    fileSize: '28.4 MB',
    status: 'Approved',
    fileExtension: 'step',
    category: 'cad',
    description: 'ISO 10303 STEP AP242 3D solid model with integrated PMI and kinematic constraints.'
  },
  {
    id: 'DOC-103',
    title: 'SPEC-GBX-5000 Aerospace Gearbox Technical Specifications.docx',
    docNumber: 'SPEC-GBX-5000-A',
    type: 'Technical Specification',
    linkedPartId: 'PN-1001',
    revision: 'Rev A.2',
    author: 'Sarah Chen, Chief Systems Engineer',
    uploadDate: '2026-07-02',
    fileSize: '1.2 MB',
    status: 'Approved',
    fileExtension: 'docx',
    category: 'doc',
    description: 'Formal product specifications, torsional stiffness benchmarks, thermal envelope, and lubrication criteria.'
  },
  {
    id: 'DOC-104',
    title: 'DFMEA-GBX-5000 Design Failure Mode & Effects Analysis.xlsx',
    docNumber: 'DFMEA-2026-088',
    type: 'DFMEA',
    linkedPartId: 'PN-1001',
    revision: 'Rev B.0',
    author: 'David Kim, Reliability Director',
    uploadDate: '2026-07-10',
    fileSize: '2.6 MB',
    status: 'Approved',
    fileExtension: 'xlsx',
    category: 'fmea',
    description: 'AIAG-VDA compliant FMEA model detailing tooth root stress, oil starvation, and bearing fatigue modes.'
  },
  {
    id: 'DOC-105',
    title: 'PN-1004 Sun Gear Precision Hardened Pinion 3D B-Rep.sldprt',
    docNumber: 'CAD-PRT-1004-03',
    type: '3D CAD Model',
    linkedPartId: 'PN-1004',
    revision: 'Rev C.0',
    author: 'Elena Rostova, Senior CAD Engineer',
    uploadDate: '2026-07-15',
    fileSize: '14.2 MB',
    status: 'Approved',
    fileExtension: 'sldprt',
    category: 'cad',
    description: 'SolidWorks Native part model for 24-tooth carburized sun pinion gear with ground involute profile.'
  },
  {
    id: 'DOC-106',
    title: 'INSP-2026-742 Zeiss CMM First Article Inspection Report.pdf',
    docNumber: 'INSP-FAIR-902',
    type: 'Inspection Plan',
    linkedPartId: 'PN-1004',
    revision: 'Rev A.0',
    author: 'Inspector J. Miller (CMM Lab)',
    uploadDate: '2026-07-24',
    fileSize: '1.8 MB',
    status: 'Approved',
    fileExtension: 'pdf',
    category: 'inspection',
    description: 'AS9102 Rev B First Article Inspection Form 3 with CMM coordinate verification and bore runout analysis.'
  },
  {
    id: 'DOC-107',
    title: 'CERT-ROHS-REACH-2026 EU Material Safety Compliance.pdf',
    docNumber: 'CERT-ENV-2026-04',
    type: 'RoHS/REACH Cert',
    linkedPartId: 'PN-1002',
    revision: 'Rev 2.0',
    author: 'Dr. Aris Thorne, Materials Compliance',
    uploadDate: '2026-08-01',
    fileSize: '850 KB',
    status: 'Approved',
    fileExtension: 'pdf',
    category: 'compliance',
    description: 'EU RoHS Directive 2011/65/EU and REACH (EC 1907/2006) Annex XVII Declaration of Conformance.'
  },
  {
    id: 'DOC-108',
    title: 'SOW-Precision-Gear-Hobbing-Subcontract-Agreement.docx',
    docNumber: 'SOW-SC-2026-11',
    type: 'Statement of Work',
    linkedPartId: 'PN-1004',
    revision: 'Rev 1.1',
    author: 'Marcus Vance, VP Manufacturing',
    uploadDate: '2026-08-12',
    fileSize: '940 KB',
    status: 'Approved',
    fileExtension: 'docx',
    category: 'doc',
    description: 'Tier-1 Supplier master procurement agreement and AGMA Class 12 tolerances SLA terms.'
  }
];

export const INITIAL_QUALITY_NCRS: QualityNCR[] = [
  {
    id: 'NCR-2026-009',
    ncrNumber: 'NCR-88902',
    title: 'Sun Gear Bore Concentricity Exceeds 12µm Limit',
    ncrType: 'In-Process Machining',
    severity: 'Major',
    status: 'Under Investigation',
    linkedPartId: 'PN-1004',
    targetPartNumber: 'PN-1004',
    productAssembly: 'ASM-GBX-5000 Planetary Gearbox',
    workOrder: 'WO-2026-0742',
    machineEquipment: 'Mazak INTEGREX e-420H CNC #01',
    defectCategory: 'Dimensional Out-of-Tolerance',
    ppmImpact: 140,
    reportedBy: 'Inspector J. Miller (CMM Lab)',
    detectedBy: 'Inspector J. Miller (CMM Lab)',
    dateReported: '2026-07-24',
    dateDetected: '2026-07-24',
    department: 'Quality Assurance & CMM Lab',
    description: 'During Op 30 precision reaming on Sun Gear Bore, CMM first-article inspection revealed bore concentricity of 18.2µm, exceeding the maximum engineering specification limit of 12.0µm.',
    nonConformanceDescription: 'During Op 30 precision reaming on Sun Gear Bore, CMM first-article inspection revealed bore concentricity of 18.2µm, exceeding the maximum engineering specification limit of 12.0µm.',
    specificationRequirement: 'Bore Concentricity ≤ 12.0 µm relative to Datum A-B',
    actualCondition: '18.2 µm runout observed across 6 parts in Lot #742',
    expectedCondition: 'Concentricity within 0.000 – 0.012 mm',
    quantityAffected: 24,
    defectLocation: 'Inner Sun Gear Bore (Op 30)',
    rootCauseCategory: 'Tooling Wear / Thermal Drift',
    rootCause5Why: 'Tool wear on CNC lathe reamer fixture caused thermal drift during batch machining.',
    rootCauseDescription: 'Reamer insert edge breakdown after 120 cycles coupled with coolant thermal buildup.',
    containmentAction: 'Quarantine all 24 units in Lot #742 in Red Hold Area; swap tool station on Mazak #01.',
    correctiveAction: 'Re-tooling fixture with diamond PCD inserts and in-process laser gauging.',
    preventiveAction: 'Incorporate automated Renishaw laser bore concentricity check every 10 parts in CNC macro.',
    inspectionMethod: 'Zeiss Prismo 3D Coordinate Measuring Machine (CMM)',
    inspectionResult: 'NON-CONFORMING (18.2 µm)',
    measurementValue: '18.2 µm',
    specificationLimit: '≤ 12.0 µm',
    inspector: 'Inspector J. Miller',
    inspectionDate: '2026-07-24',
    attachments: [
      {
        id: 'ATT-NCR-01',
        name: 'Zeiss_CMM_Inspection_Scan_Lot742.pdf',
        size: '1.8 MB',
        type: 'Inspection Report',
        uploadedAt: '2026-07-24 14:32'
      },
      {
        id: 'ATT-NCR-02',
        name: 'Bore_Concentricity_Deviation_Chart.png',
        size: '640 KB',
        type: 'Measurement Data',
        uploadedAt: '2026-07-24 14:35'
      }
    ],
    history: [
      {
        action: 'NCR Logged',
        user: 'Inspector J. Miller',
        timestamp: '2026-07-24 14:30',
        details: 'Initial CMM out-of-tolerance non-conformance recorded.'
      },
      {
        action: 'Status changed to Under Investigation',
        user: 'Dr. Elena Rostova',
        timestamp: '2026-07-24 16:15',
        details: 'Assigned 5-Why root cause team for CNC lathe thermal drift analysis.'
      }
    ]
  }
];

export const INITIAL_CAPAS: CAPA[] = [
  {
    id: 'CAPA-2026-03',
    capaNumber: 'CAPA-901',
    linkedNcrId: 'NCR-2026-009',
    title: 'Precision Reaming Tool Monitoring & Laser Gauging System',
    owner: 'Marcus Vance',
    targetDate: '2026-08-30',
    status: 'In Progress'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    vendorCode: 'VND-PREC-902',
    name: 'Apex Precision Gears & Machining Corp',
    category: 'High-Precision Gear Cutting',
    ratingScore: 97.2,
    deliveryScorePercent: 98.5,
    qualityScorePpm: 12,
    leadTimeWeeks: 6,
    status: 'Approved',
    contactEmail: 'engineering@apexgears.com',
    location: 'Stuttgart, Germany'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-101',
    code: 'PRJ-EV-SCOOTER',
    name: 'Electric Scooter Development',
    customer: 'CityGlide Urban Mobility',
    program: 'Gen 2 EV Platform',
    manager: 'David Sterling',
    designEngineer: 'Alex Rivera, PE',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    status: 'In Progress',
    completionPercent: 20,
    budgetTotal: 650000,
    budgetSpent: 195000,
    engHoursTotal: 2400,
    engHoursSpent: 720,
    tasks: [
      { id: 'T-101', taskNumber: '01', taskName: '01 Requirements Definition', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: 'None', startDate: '2026-05-01', endDate: '2026-05-15', durationDays: 14, progressPercent: 100, status: 'Completed', completedDate: '2026-05-15', completedBy: 'David Sterling' },
      { id: 'T-102', taskNumber: '02', taskName: '02 3D CAD Modeling', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '01 Requirements Definition', startDate: '2026-05-16', endDate: '2026-06-15', durationDays: 30, progressPercent: 100, status: 'Completed', completedDate: '2026-06-15', completedBy: 'Alex Rivera, PE' },
      { id: 'T-103', taskNumber: '03', taskName: '03 2D Drawing', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '02 3D CAD Modeling', startDate: '2026-06-16', endDate: '2026-06-30', durationDays: 14, progressPercent: 100, status: 'Completed', completedDate: '2026-06-30', completedBy: 'Alex Rivera, PE' },
      { id: 'T-104', taskNumber: '04', taskName: '04 Engineering Review', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '03 2D Drawing', startDate: '2026-07-01', endDate: '2026-07-10', durationDays: 10, progressPercent: 50, status: 'In Progress' },
      { id: 'T-105', taskNumber: '05', taskName: '05 EBOM Creation', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '04 Engineering Review', startDate: '2026-07-11', endDate: '2026-07-25', durationDays: 14, progressPercent: 25, status: 'In Progress' },
      { id: 'T-106', taskNumber: '06', taskName: '06 DFMEA', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '05 EBOM Creation', startDate: '2026-07-26', endDate: '2026-08-05', durationDays: 10, progressPercent: 0, status: 'Not Started' },
      { id: 'T-107', taskNumber: '07', taskName: '07 Prototype Development', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '06 DFMEA', startDate: '2026-08-06', endDate: '2026-08-25', durationDays: 20, progressPercent: 0, status: 'Not Started' },
      { id: 'T-108', taskNumber: '08', taskName: '08 CAPP / Process Planning', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '07 Prototype Development', startDate: '2026-08-26', endDate: '2026-09-10', durationDays: 15, progressPercent: 0, status: 'Not Started' },
      { id: 'T-109', taskNumber: '09', taskName: '09 MBOM Creation', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '08 CAPP / Process Planning', startDate: '2026-09-11', endDate: '2026-09-22', durationDays: 12, progressPercent: 0, status: 'Not Started' },
      { id: 'T-110', taskNumber: '10', taskName: '10 PFMEA', weight: 5, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '09 MBOM Creation', startDate: '2026-09-23', endDate: '2026-10-02', durationDays: 10, progressPercent: 0, status: 'Not Started' },
      { id: 'T-111', taskNumber: '11', taskName: '11 Manufacturing Review', weight: 5, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '10 PFMEA', startDate: '2026-10-03', endDate: '2026-10-10', durationDays: 7, progressPercent: 0, status: 'Not Started' },
      { id: 'T-112', taskNumber: '12', taskName: '12 Quality Inspection', weight: 5, assignedRole: 'quality', owner: 'Dr. Elena Rostova', dependency: '11 Manufacturing Review', startDate: '2026-10-11', endDate: '2026-10-22', durationDays: 12, progressPercent: 0, status: 'Not Started' },
      { id: 'T-113', taskNumber: '13', taskName: '13 Final Engineering Approval', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '12 Quality Inspection', startDate: '2026-10-23', endDate: '2026-10-28', durationDays: 5, progressPercent: 0, status: 'Not Started' },
      { id: 'T-114', taskNumber: '14', taskName: '14 Product Release', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '13 Final Engineering Approval', startDate: '2026-10-29', endDate: '2026-11-03', durationDays: 5, progressPercent: 0, status: 'Not Started' },
      { id: 'T-115', taskNumber: '15', taskName: '15 Project Documentation', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '14 Product Release', startDate: '2026-11-04', endDate: '2026-11-10', durationDays: 7, progressPercent: 0, status: 'Not Started' },
      { id: 'T-116', taskNumber: '16', taskName: '16 Final Project Review', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '15 Project Documentation', startDate: '2026-11-11', endDate: '2026-11-16', durationDays: 5, progressPercent: 0, status: 'Not Started' }
    ]
  },
  {
    id: 'PRJ-102',
    code: 'PRJ-ROBO-GBX',
    name: 'Next-Gen High-Torque Planetary Actuator',
    customer: 'Apex Robotics Systems',
    program: 'RoboJoint 6-Axis Drivetrain',
    manager: 'David Sterling',
    designEngineer: 'Alex Rivera, PE',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    status: 'In Progress',
    completionPercent: 20,
    budgetTotal: 450000,
    budgetSpent: 135000,
    engHoursTotal: 1800,
    engHoursSpent: 540,
    tasks: [
      { id: 'T-201', taskNumber: '01', taskName: '01 Requirements Definition', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: 'None', startDate: '2026-06-01', endDate: '2026-06-15', durationDays: 14, progressPercent: 100, status: 'Completed', completedDate: '2026-06-15', completedBy: 'David Sterling' },
      { id: 'T-202', taskNumber: '02', taskName: '02 3D CAD Modeling', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '01 Requirements Definition', startDate: '2026-06-16', endDate: '2026-07-15', durationDays: 30, progressPercent: 100, status: 'Completed', completedDate: '2026-07-15', completedBy: 'Alex Rivera, PE' },
      { id: 'T-203', taskNumber: '03', taskName: '03 2D Drawing', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '02 3D CAD Modeling', startDate: '2026-07-16', endDate: '2026-07-30', durationDays: 14, progressPercent: 100, status: 'Completed', completedDate: '2026-07-30', completedBy: 'Alex Rivera, PE' },
      { id: 'T-204', taskNumber: '04', taskName: '04 Engineering Review', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '03 2D Drawing', startDate: '2026-08-01', endDate: '2026-08-10', durationDays: 10, progressPercent: 50, status: 'In Progress' },
      { id: 'T-205', taskNumber: '05', taskName: '05 EBOM Creation', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '04 Engineering Review', startDate: '2026-08-11', endDate: '2026-08-25', durationDays: 14, progressPercent: 25, status: 'In Progress' },
      { id: 'T-206', taskNumber: '06', taskName: '06 DFMEA', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '05 EBOM Creation', startDate: '2026-08-26', endDate: '2026-09-05', durationDays: 10, progressPercent: 0, status: 'Not Started' },
      { id: 'T-207', taskNumber: '07', taskName: '07 Prototype Development', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '06 DFMEA', startDate: '2026-09-06', endDate: '2026-09-25', durationDays: 20, progressPercent: 0, status: 'Not Started' },
      { id: 'T-208', taskNumber: '08', taskName: '08 CAPP / Process Planning', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '07 Prototype Development', startDate: '2026-09-26', endDate: '2026-10-10', durationDays: 15, progressPercent: 0, status: 'Not Started' },
      { id: 'T-209', taskNumber: '09', taskName: '09 MBOM Creation', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '08 CAPP / Process Planning', startDate: '2026-10-11', endDate: '2026-10-22', durationDays: 12, progressPercent: 0, status: 'Not Started' },
      { id: 'T-210', taskNumber: '10', taskName: '10 PFMEA', weight: 5, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '09 MBOM Creation', startDate: '2026-10-23', endDate: '2026-11-02', durationDays: 10, progressPercent: 0, status: 'Not Started' },
      { id: 'T-211', taskNumber: '11', taskName: '11 Manufacturing Review', weight: 5, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '10 PFMEA', startDate: '2026-11-03', endDate: '2026-11-10', durationDays: 7, progressPercent: 0, status: 'Not Started' },
      { id: 'T-212', taskNumber: '12', taskName: '12 Quality Inspection', weight: 5, assignedRole: 'quality', owner: 'Dr. Elena Rostova', dependency: '11 Manufacturing Review', startDate: '2026-11-11', endDate: '2026-11-22', durationDays: 12, progressPercent: 0, status: 'Not Started' },
      { id: 'T-213', taskNumber: '13', taskName: '13 Final Engineering Approval', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '12 Quality Inspection', startDate: '2026-11-23', endDate: '2026-11-28', durationDays: 5, progressPercent: 0, status: 'Not Started' },
      { id: 'T-214', taskNumber: '14', taskName: '14 Product Release', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '13 Final Engineering Approval', startDate: '2026-11-29', endDate: '2026-12-04', durationDays: 5, progressPercent: 0, status: 'Not Started' },
      { id: 'T-215', taskNumber: '15', taskName: '15 Project Documentation', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '14 Product Release', startDate: '2026-12-05', endDate: '2026-12-11', durationDays: 7, progressPercent: 0, status: 'Not Started' },
      { id: 'T-216', taskNumber: '16', taskName: '16 Final Project Review', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: '15 Project Documentation', startDate: '2026-12-12', endDate: '2026-12-17', durationDays: 5, progressPercent: 0, status: 'Not Started' }
    ]
  }
];

export const INITIAL_TELEMETRY: TelemetryPoint[] = [
  { timestamp: '14:00', tempCelsius: 42.1, stressMpa: 120, rpm: 3200, vibrationG: 0.12, powerKw: 4.2, healthScorePercent: 99.1 }
];

export const INITIAL_PROCESS_OPERATIONS: ProcessOperation[] = [
  {
    id: 'OP-10',
    opNumber: 10,
    name: 'Face & Turn Planet Carrier Billet Outer Diameter',
    machineId: 'MCH-MAZ-501',
    machineName: 'Mazak INTEGREX e-420H 5-Axis CNC',
    setupTimeMin: 45,
    cycleTimeSec: 280,
    toolRequired: 'T01 Carbide Turning Insert WNMG 080408',
    fixtureRequired: 'FJ-CAR-901 Hydraulic Chuck Jaws',
    operatorRole: 'CNC Machinist Level 3',
    estimatedCost: 45.00,
    inspectionPoints: 'Verify OD 180.00 ±0.015mm via digital micrometer.'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-101',
    sku: 'SKU-ALU-7075-BAR',
    name: 'Aluminum 7075-T6 Round Billet Stock Ø190mm x 3m',
    category: 'Raw Material',
    warehouseLocation: 'Warehouse A - Metal Yard',
    binNumber: 'A-12-04',
    stockQty: 84,
    minQty: 25,
    maxQty: 150,
    unitCost: 145.00,
    qrCodeUrl: 'QR-ALU-7075-BAR'
  }
];

/* INDEPENDENT DFMEA DATASET (DESIGN FAILURE MODES) */
export const INITIAL_DFMEA: DfmeaRow[] = [
  {
    id: 'DFM-001',
    system: 'Actuator Drivetrain',
    subsystem: 'Planetary Gear Train',
    component: 'Sun Gear Input Shaft (PN-SGN-520)',
    functionDesc: 'Transmit 450 Nm input torque from electric motor to planet carrier assembly.',
    designRequirement: 'Yield strength > 650 MPa, root trochoid fillet radius R1.2mm min to withstand overload.',
    potentialFailureMode: 'Tooth root fatigue fracture under cyclic shock load',
    potentialEffect: 'Catastrophic gear binding and total loss of drive torque to robotic arm joint.',
    severity: 9,
    potentialCause: 'Localized notch stress concentration at sharp tooth root fillet (R0.6mm).',
    occurrence: 3,
    currentDesignControls: 'ANSYS FEA structural stress simulation & AGMA 2001-D04 rating calculation.',
    detection: 4,
    rpn: 108,
    recommendedDesignAction: 'Increase root trochoid fillet radius to R1.2mm and apply shot-peening residual compressive stress.',
    responsibleEngineer: 'Alex Rivera, PE',
    dueDate: '2026-08-15',
    status: 'In Review',
    linkedCadId: 'PN-1004'
  },
  {
    id: 'DFM-002',
    system: 'Actuator Housing',
    subsystem: 'Carrier Sub-Assembly',
    component: 'Planet Carrier Web (ASM-CAR-510)',
    functionDesc: 'Provide rigid structural support for 3 planet gear shafts under maximum radial gear mesh forces.',
    designRequirement: 'Max deflection < 0.025mm across 300 Nm operating torque range.',
    potentialFailureMode: 'Carrier web torsional twist leading to gear tooth misalignment & high acoustic noise',
    potentialEffect: 'Premature gear tooth flank spalling and thermal degradation.',
    severity: 7,
    potentialCause: 'Lightweighting cutout pocket wall thickness under-dimensioned (2.0mm vs 3.5mm required).',
    occurrence: 2,
    currentDesignControls: '3D CAD CAD FEA modal & deflection study.',
    detection: 3,
    rpn: 42,
    recommendedDesignAction: 'Add stiffening web ribbing pattern across carrier pocket cutouts in 7075-T6 CAD model.',
    responsibleEngineer: 'Alex Rivera, PE',
    dueDate: '2026-08-20',
    status: 'Approved',
    linkedCadId: 'PN-1002'
  }
];

/* INDEPENDENT PFMEA DATASET (MANUFACTURING PROCESS FAILURES) */
export const INITIAL_PFMEA: PfmeaRow[] = [
  {
    id: 'PFM-101',
    processStep: 'Op 30: Precision Jig Boring of Planet Shaft Holes',
    opNumber: 30,
    machine: 'SIP Precision Jig Boring Machine MCH-SIP-800',
    tool: 'T08 PCD Diamond Micro Boring Bar 12.000mm',
    fixture: 'FJ-JIG-707 Rotary Index Table',
    operatorRole: 'Master Precision Toolmaker',
    potentialProcessFailure: 'Carrier bore finished diameter oversize beyond H7 limit (+18µm limit)',
    effect: 'Loose planet shaft dowel pin press-fit causing gear alignment binding during assembly.',
    severity: 8,
    cause: 'Thermal spindle growth during long 8-hour production run & reamer cutter wear.',
    occurrence: 3,
    processControls: 'In-process plug gauge check & CMM first article inspection report.',
    detection: 4,
    rpn: 96,
    correctiveAction: 'Install automated in-process Renishaw laser bore measuring probe on MCH-SIP-800.',
    productionEngineer: 'Marcus Vance',
    dueDate: '2026-08-30',
    status: 'Action Pending',
    linkedPartId: 'PN-1002'
  },
  {
    id: 'PFM-102',
    processStep: 'Op 10: 5-Axis Turning & Facing Carrier Billet',
    opNumber: 10,
    machine: 'Mazak INTEGREX e-420H 5-Axis CNC',
    tool: 'T01 Carbide Turning Insert WNMG 080408',
    fixture: 'FJ-CAR-901 Hydraulic Chuck Jaws',
    operatorRole: 'CNC Machinist Level 3',
    potentialProcessFailure: 'Workpiece slippage or chatter marks on outer diameter surface',
    effect: 'Surface finish roughness Ra > 1.6µm exceeding anodizing specification.',
    severity: 6,
    cause: 'Hydraulic chuck clamping pressure set below 2.5 MPa requirement.',
    occurrence: 2,
    processControls: 'Machinist visual surface finish comparator & digital roughness tester.',
    detection: 2,
    rpn: 24,
    correctiveAction: 'Interlock CNC spindle start command with automated hydraulic pressure sensor check.',
    productionEngineer: 'Marcus Vance',
    dueDate: '2026-08-10',
    status: 'Mitigated',
    linkedPartId: 'PN-1002'
  }
];

export const INITIAL_TOOLS: ToolItem[] = [
  {
    id: 'TL-501',
    toolNumber: 'T08-PCD-BORING',
    name: '12.000mm PCD Diamond Precision Micro Boring Bar',
    category: 'Cutting Insert',
    toolLifePercent: 88,
    calibrationDate: '2026-07-01',
    status: 'In Use',
    location: 'Mazak INTEGREX ATC Tool Magazine Spot #08'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-5001',
    timestamp: '2026-07-28 14:30:12',
    user: 'Alex Rivera, PE',
    persona: 'design',
    action: 'Checked Out CAD Item',
    category: 'CAD',
    targetId: 'PN-1002 (ASM-CAR-510)',
    details: 'Locked file for lightweighting pocket cutout modifications.'
  }
];
