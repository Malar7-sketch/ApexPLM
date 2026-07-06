// ============================================================
// PLM Nexus – Complete Mock Data
// High-Performance Mountain Bicycle (HPB-2026)
// ============================================================

// ─── PRODUCTS ────────────────────────────────────────────────
export const products = [
  {
    id: 'PRD-001',
    name: 'High-Performance Mountain Bicycle',
    code: 'HPB-2026',
    version: '1.0',
    revision: 'B.3',
    status: 'Released',
    weight: 13.8,
    weightUnit: 'kg',
    material: 'AISI 4130 Chromoly Steel',
    designer: 'Malarvannan M',
    projectManager: 'Shanthosh S',
    plant: 'Plant 01 — Coimbatore',
    releaseDate: '2026-02-12',
    readiness: 98,
    description: 'Professional-grade mountain bicycle engineered for extreme terrain performance. Features a lightweight chromoly steel frame, full suspension system, hydraulic disc brakes, and precision-machined components.',
    category: 'Bicycles',
    lifecycle: 'Production',
    thumbnail: '🚲',
  },
];

// ─── TEAM ────────────────────────────────────────────────────
export const teamMembers = [
  {
    id: 'TM-001',
    name: 'Malarvannan M',
    initials: 'MM',
    role: 'Lead Design Engineer',
    department: 'Engineering',
    email: 'malarvannan@plmnexus.com',
    skills: ['SolidWorks', 'CATIA', 'FEA', 'GD&T', 'DFM'],
    projects: ['HPB-2026'],
    experience: '8 years',
    responsibilities: 'Product design, CAD modeling, design validation, engineering change management',
    avatar: '#F96E2A',
  },
  {
    id: 'TM-002',
    name: 'Shanthosh S',
    initials: 'SS',
    role: 'Project Manager',
    department: 'PMO',
    email: 'shanthosh@plmnexus.com',
    skills: ['Project Planning', 'Risk Management', 'Agile', 'Stakeholder Management', 'MS Project'],
    projects: ['HPB-2026'],
    experience: '10 years',
    responsibilities: 'Project planning, resource allocation, timeline management, stakeholder communication',
    avatar: '#1E3E62',
  },
  {
    id: 'TM-003',
    name: 'Njanadeepan R K',
    initials: 'NR',
    role: 'CAE Engineer',
    department: 'Simulation',
    email: 'njanadeepan@plmnexus.com',
    skills: ['ANSYS', 'Abaqus', 'CFD', 'Modal Analysis', 'Fatigue Analysis'],
    projects: ['HPB-2026'],
    experience: '6 years',
    responsibilities: 'Structural analysis, simulation, stress testing, design optimization',
    avatar: '#10B981',
  },
  {
    id: 'TM-004',
    name: 'Dharanidharan S',
    initials: 'DS',
    role: 'Manufacturing Engineer',
    department: 'Manufacturing',
    email: 'dharanidharan@plmnexus.com',
    skills: ['CNC Programming', 'Process Planning', 'Lean Manufacturing', 'Six Sigma', 'TIG Welding'],
    projects: ['HPB-2026'],
    experience: '7 years',
    responsibilities: 'Manufacturing process design, production planning, quality systems, supplier coordination',
    avatar: '#8B5CF6',
  },
];

// ─── BOM DATA ────────────────────────────────────────────────
export interface BOMItem {
  id: string;
  partNumber: string;
  name: string;
  material: string;
  supplier: string;
  quantity: number;
  weight: number;
  cost: number;
  revision: string;
  status: string;
  level: number;
  children?: BOMItem[];
}

export const bomData: BOMItem[] = [
  {
    id: 'BOM-001', partNumber: 'FRM-100', name: 'Frame Assembly', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 2.8, cost: 285, revision: 'B', status: 'Released', level: 0,
    children: [
      { id: 'BOM-011', partNumber: 'FRM-101', name: 'Top Tube', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.42, cost: 32, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-012', partNumber: 'FRM-102', name: 'Down Tube', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.55, cost: 38, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-013', partNumber: 'FRM-103', name: 'Seat Tube', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.38, cost: 28, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-014', partNumber: 'FRM-104', name: 'Head Tube', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.25, cost: 22, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-015', partNumber: 'FRM-105', name: 'Chain Stay (L)', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.28, cost: 24, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-016', partNumber: 'FRM-106', name: 'Chain Stay (R)', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.28, cost: 24, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-017', partNumber: 'FRM-107', name: 'Seat Stay (L)', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.2, cost: 18, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-018', partNumber: 'FRM-108', name: 'Seat Stay (R)', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.2, cost: 18, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-019', partNumber: 'FRM-109', name: 'Bottom Bracket Shell', material: 'AISI 4130 Steel', supplier: 'TubeWorks India', quantity: 1, weight: 0.24, cost: 42, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-020', partNumber: 'FRM-110', name: 'Dropout (L)', material: 'AISI 4130 Steel', supplier: 'PrecisionCast Co', quantity: 1, weight: 0.05, cost: 12, revision: 'C', status: 'Released', level: 1 },
      { id: 'BOM-021', partNumber: 'FRM-111', name: 'Dropout (R)', material: 'AISI 4130 Steel', supplier: 'PrecisionCast Co', quantity: 1, weight: 0.05, cost: 12, revision: 'C', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-002', partNumber: 'FRK-200', name: 'Fork Assembly', material: 'Aluminum 7075-T6', supplier: 'RockShox India', quantity: 1, weight: 1.85, cost: 420, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-022', partNumber: 'FRK-201', name: 'Fork Stanchion (L)', material: 'Aluminum 7075-T6', supplier: 'RockShox India', quantity: 1, weight: 0.35, cost: 85, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-023', partNumber: 'FRK-202', name: 'Fork Stanchion (R)', material: 'Aluminum 7075-T6', supplier: 'RockShox India', quantity: 1, weight: 0.35, cost: 85, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-024', partNumber: 'FRK-203', name: 'Fork Crown', material: 'Aluminum 6061-T6', supplier: 'RockShox India', quantity: 1, weight: 0.45, cost: 65, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-025', partNumber: 'FRK-204', name: 'Fork Lower (L)', material: 'Magnesium Alloy', supplier: 'RockShox India', quantity: 1, weight: 0.25, cost: 72, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-026', partNumber: 'FRK-205', name: 'Fork Lower (R)', material: 'Magnesium Alloy', supplier: 'RockShox India', quantity: 1, weight: 0.25, cost: 72, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-027', partNumber: 'FRK-206', name: 'Steerer Tube', material: 'Aluminum 7075-T6', supplier: 'RockShox India', quantity: 1, weight: 0.2, cost: 41, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-003', partNumber: 'WHL-300', name: 'Wheel Assembly (Front)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 1.6, cost: 195, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-031', partNumber: 'WHL-301', name: 'Rim (Front)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 0.55, cost: 68, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-032', partNumber: 'WHL-302', name: 'Hub (Front)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 0.28, cost: 45, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-033', partNumber: 'WHL-303', name: 'Spokes (Front Set)', material: 'Stainless Steel', supplier: 'SpokeMaster', quantity: 32, weight: 0.32, cost: 28, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-034', partNumber: 'WHL-304', name: 'Tire (Front)', material: 'Rubber Compound', supplier: 'Continental India', quantity: 1, weight: 0.45, cost: 54, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-004', partNumber: 'WHL-400', name: 'Wheel Assembly (Rear)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 1.9, cost: 235, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-041', partNumber: 'WHL-401', name: 'Rim (Rear)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 0.55, cost: 68, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-042', partNumber: 'WHL-402', name: 'Hub (Rear)', material: 'Aluminum 6061-T6', supplier: 'SpokeMaster', quantity: 1, weight: 0.42, cost: 62, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-043', partNumber: 'WHL-403', name: 'Spokes (Rear Set)', material: 'Stainless Steel', supplier: 'SpokeMaster', quantity: 32, weight: 0.32, cost: 28, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-044', partNumber: 'WHL-404', name: 'Tire (Rear)', material: 'Rubber Compound', supplier: 'Continental India', quantity: 1, weight: 0.45, cost: 54, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-045', partNumber: 'WHL-405', name: 'Cassette', material: 'Nickel-Chrome Steel', supplier: 'Shimano India', quantity: 1, weight: 0.16, cost: 23, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-005', partNumber: 'BRK-500', name: 'Brake System', material: 'Various', supplier: 'Shimano India', quantity: 1, weight: 0.92, cost: 310, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-051', partNumber: 'BRK-501', name: 'Brake Caliper (Front)', material: 'Aluminum 6061', supplier: 'Shimano India', quantity: 1, weight: 0.18, cost: 65, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-052', partNumber: 'BRK-502', name: 'Brake Caliper (Rear)', material: 'Aluminum 6061', supplier: 'Shimano India', quantity: 1, weight: 0.18, cost: 65, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-053', partNumber: 'BRK-503', name: 'Brake Rotor (Front)', material: 'Stainless Steel', supplier: 'Shimano India', quantity: 1, weight: 0.14, cost: 35, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-054', partNumber: 'BRK-504', name: 'Brake Rotor (Rear)', material: 'Stainless Steel', supplier: 'Shimano India', quantity: 1, weight: 0.12, cost: 32, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-055', partNumber: 'BRK-505', name: 'Brake Lever (L)', material: 'Aluminum/Composite', supplier: 'Shimano India', quantity: 1, weight: 0.12, cost: 42, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-056', partNumber: 'BRK-506', name: 'Brake Lever (R)', material: 'Aluminum/Composite', supplier: 'Shimano India', quantity: 1, weight: 0.12, cost: 42, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-057', partNumber: 'BRK-507', name: 'Brake Hose Set', material: 'Reinforced Rubber', supplier: 'Shimano India', quantity: 1, weight: 0.06, cost: 29, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-006', partNumber: 'DRT-600', name: 'Drivetrain', material: 'Various', supplier: 'Shimano India', quantity: 1, weight: 1.85, cost: 385, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-061', partNumber: 'DRT-601', name: 'Crankset', material: 'Aluminum 7075', supplier: 'Shimano India', quantity: 1, weight: 0.62, cost: 95, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-062', partNumber: 'DRT-602', name: 'Bottom Bracket', material: 'Steel/Ceramic', supplier: 'Shimano India', quantity: 1, weight: 0.08, cost: 28, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-063', partNumber: 'DRT-603', name: 'Chain', material: 'Nickel-Plated Steel', supplier: 'KMC Chains', quantity: 1, weight: 0.28, cost: 22, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-064', partNumber: 'DRT-604', name: 'Rear Derailleur', material: 'Aluminum/Carbon', supplier: 'Shimano India', quantity: 1, weight: 0.25, cost: 110, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-065', partNumber: 'DRT-605', name: 'Shift Lever', material: 'Composite', supplier: 'Shimano India', quantity: 1, weight: 0.12, cost: 45, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-066', partNumber: 'DRT-606', name: 'Shift Cable Set', material: 'Stainless Steel', supplier: 'Shimano India', quantity: 1, weight: 0.08, cost: 12, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-067', partNumber: 'DRT-607', name: 'Pedals (Pair)', material: 'Aluminum/CrMo', supplier: 'CrankBrothers', quantity: 1, weight: 0.42, cost: 73, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-007', partNumber: 'SUS-700', name: 'Rear Suspension', material: 'Aluminum 7075-T6', supplier: 'Fox Racing Shox', quantity: 1, weight: 0.68, cost: 380, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-071', partNumber: 'SUS-701', name: 'Shock Absorber', material: 'Aluminum 7075-T6', supplier: 'Fox Racing Shox', quantity: 1, weight: 0.35, cost: 245, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-072', partNumber: 'SUS-702', name: 'Linkage Arms', material: 'Aluminum 6061-T6', supplier: 'Fox Racing Shox', quantity: 2, weight: 0.18, cost: 68, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-073', partNumber: 'SUS-703', name: 'Pivot Bearings', material: 'Steel/Ceramic', supplier: 'SKF India', quantity: 4, weight: 0.08, cost: 35, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-074', partNumber: 'SUS-704', name: 'Pivot Hardware', material: 'Titanium', supplier: 'Fox Racing Shox', quantity: 1, weight: 0.07, cost: 32, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-008', partNumber: 'CPT-800', name: 'Cockpit', material: 'Various', supplier: 'Various', quantity: 1, weight: 1.1, cost: 190, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-081', partNumber: 'CPT-801', name: 'Handlebar', material: 'Aluminum 7075', supplier: 'RaceFace', quantity: 1, weight: 0.32, cost: 55, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-082', partNumber: 'CPT-802', name: 'Stem', material: 'Aluminum 6061', supplier: 'RaceFace', quantity: 1, weight: 0.15, cost: 35, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-083', partNumber: 'CPT-803', name: 'Headset', material: 'Steel/Aluminum', supplier: 'Chris King', quantity: 1, weight: 0.12, cost: 42, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-084', partNumber: 'CPT-804', name: 'Grips (Pair)', material: 'Silicone/Rubber', supplier: 'Ergon', quantity: 1, weight: 0.08, cost: 18, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-085', partNumber: 'CPT-805', name: 'Seatpost', material: 'Aluminum 7075', supplier: 'RaceFace', quantity: 1, weight: 0.28, cost: 25, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-086', partNumber: 'CPT-806', name: 'Saddle', material: 'Carbon/Foam/Leather', supplier: 'WTB', quantity: 1, weight: 0.15, cost: 15, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-009', partNumber: 'HDW-900', name: 'Hardware & Fasteners', material: 'Various', supplier: 'FastTech', quantity: 1, weight: 0.35, cost: 48, revision: 'A', status: 'Released', level: 0,
    children: [
      { id: 'BOM-091', partNumber: 'HDW-901', name: 'Bolts M5 Set', material: 'Stainless Steel', supplier: 'FastTech', quantity: 24, weight: 0.12, cost: 15, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-092', partNumber: 'HDW-902', name: 'Bolts M6 Set', material: 'Stainless Steel', supplier: 'FastTech', quantity: 12, weight: 0.1, cost: 12, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-093', partNumber: 'HDW-903', name: 'Cable Guides', material: 'Nylon', supplier: 'FastTech', quantity: 6, weight: 0.03, cost: 6, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-094', partNumber: 'HDW-904', name: 'Water Bottle Cage Bolts', material: 'Stainless Steel', supplier: 'FastTech', quantity: 4, weight: 0.02, cost: 3, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-095', partNumber: 'HDW-905', name: 'Decal Set', material: 'Vinyl', supplier: 'GraphicPro', quantity: 1, weight: 0.05, cost: 8, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-096', partNumber: 'HDW-906', name: 'Reflector Kit', material: 'Polycarbonate', supplier: 'FastTech', quantity: 1, weight: 0.03, cost: 4, revision: 'A', status: 'Released', level: 1 },
    ],
  },
  {
    id: 'BOM-010', partNumber: 'FNS-1000', name: 'Paint & Finish', material: 'Various', supplier: 'CoatingTech', quantity: 1, weight: 0.75, cost: 95, revision: 'B', status: 'Released', level: 0,
    children: [
      { id: 'BOM-101', partNumber: 'FNS-1001', name: 'Primer Coat', material: 'Epoxy Primer', supplier: 'CoatingTech', quantity: 1, weight: 0.15, cost: 18, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-102', partNumber: 'FNS-1002', name: 'Base Coat (Matte Black)', material: 'Polyurethane', supplier: 'CoatingTech', quantity: 1, weight: 0.25, cost: 28, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-103', partNumber: 'FNS-1003', name: 'Accent Coat (Orange)', material: 'Polyurethane', supplier: 'CoatingTech', quantity: 1, weight: 0.1, cost: 15, revision: 'B', status: 'Released', level: 1 },
      { id: 'BOM-104', partNumber: 'FNS-1004', name: 'Clear Coat', material: 'UV-Resistant Clear', supplier: 'CoatingTech', quantity: 1, weight: 0.2, cost: 25, revision: 'A', status: 'Released', level: 1 },
      { id: 'BOM-105', partNumber: 'FNS-1005', name: 'Anti-Chip Film', material: 'TPU Film', supplier: 'CoatingTech', quantity: 1, weight: 0.05, cost: 9, revision: 'A', status: 'Released', level: 1 },
    ],
  },
];

// ─── CAD FILES ───────────────────────────────────────────────
export const cadFiles = [
  { id: 'CAD-001', name: 'Frame_Assembly.SLDASM', type: 'Assembly', revision: 'B.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-10', size: '45.2 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-002', name: 'Fork.SLDPRT', type: 'Part', revision: 'A.2', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-08', size: '12.8 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-003', name: 'Suspension.SLDASM', type: 'Assembly', revision: 'A.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-05', size: '38.6 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-004', name: 'Wheel_Front.SLDASM', type: 'Assembly', revision: 'A.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-03', size: '22.1 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-005', name: 'Wheel_Rear.SLDASM', type: 'Assembly', revision: 'A.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-03', size: '24.7 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-006', name: 'BrakeRotor_Front.STEP', type: 'Part', revision: 'B.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-28', size: '8.4 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-007', name: 'BrakeRotor_Rear.STEP', type: 'Part', revision: 'B.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-28', size: '7.9 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-008', name: 'Crankset.SLDPRT', type: 'Part', revision: 'A.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-25', size: '15.3 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-009', name: 'Handlebar.SLDPRT', type: 'Part', revision: 'A.2', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-22', size: '6.2 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-010', name: 'Saddle.SLDPRT', type: 'Part', revision: 'A.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-20', size: '9.8 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-011', name: 'HPB2026_Full_Assembly.SLDASM', type: 'Assembly', revision: 'B.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-12', size: '128.5 MB', checkedOut: false, folder: 'Top Level' },
  { id: 'CAD-012', name: 'Pedal_Assembly.SLDASM', type: 'Assembly', revision: 'A.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-18', size: '11.2 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-013', name: 'Derailleur_Mount.SLDPRT', type: 'Part', revision: 'A.2', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-15', size: '4.1 MB', checkedOut: false, folder: 'Parts' },
  { id: 'CAD-014', name: 'Headset_Assembly.SLDASM', type: 'Assembly', revision: 'A.1', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-12', size: '8.7 MB', checkedOut: false, folder: 'Assemblies' },
  { id: 'CAD-015', name: 'Frame_FEA_Results.pdf', type: 'Report', revision: 'B.2', status: 'Released', owner: 'Njanadeepan R K', department: 'Simulation', approval: 'Approved', dateModified: '2026-02-09', size: '18.3 MB', checkedOut: false, folder: 'Reports' },
  { id: 'CAD-016', name: 'StressAnalysis_Frame.pdf', type: 'Report', revision: 'B.1', status: 'Released', owner: 'Njanadeepan R K', department: 'Simulation', approval: 'Approved', dateModified: '2026-02-07', size: '22.6 MB', checkedOut: false, folder: 'Reports' },
  { id: 'CAD-017', name: 'ManufacturingPlan_HPB2026.pdf', type: 'Document', revision: 'A.3', status: 'Released', owner: 'Dharanidharan S', department: 'Manufacturing', approval: 'Approved', dateModified: '2026-02-11', size: '5.4 MB', checkedOut: false, folder: 'Documents' },
  { id: 'CAD-018', name: 'QualityChecklist_HPB2026.pdf', type: 'Document', revision: 'A.2', status: 'Released', owner: 'Shanthosh S', department: 'Quality', approval: 'Approved', dateModified: '2026-02-06', size: '2.1 MB', checkedOut: false, folder: 'Documents' },
  { id: 'CAD-019', name: 'Wheel.DWG', type: 'Drawing', revision: 'A.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-01-30', size: '3.8 MB', checkedOut: false, folder: 'Drawings' },
  { id: 'CAD-020', name: 'Frame_Drawing.DWG', type: 'Drawing', revision: 'B.3', status: 'Released', owner: 'Malarvannan M', department: 'Design', approval: 'Approved', dateModified: '2026-02-10', size: '4.2 MB', checkedOut: false, folder: 'Drawings' },
];

// ─── ENGINEERING CHANGES ─────────────────────────────────────
export const engineeringChanges = [
  {
    id: 'ECR-2026-001', title: 'Frame Weight Reduction — Rev B', description: 'Optimize frame tube wall thickness using FEA results to reduce overall weight by 420g while maintaining structural integrity.', affectedParts: ['FRM-100', 'FRM-101', 'FRM-102', 'FRM-103'], priority: 'High', status: 'Completed', type: 'ECO',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2025-11-15', dateDue: '2025-12-20', dateCompleted: '2025-12-18',
    workflow: 'Release', riskLevel: 'Medium', costImpact: '+$12 per unit',
  },
  {
    id: 'ECR-2026-002', title: 'Brake Rotor Material Change', description: 'Change brake rotor material from standard stainless steel to heat-treated SS for improved heat dissipation during prolonged braking.', affectedParts: ['BRK-503', 'BRK-504'], priority: 'Medium', status: 'Completed', type: 'ECO',
    requester: 'Njanadeepan R K', approver: 'Shanthosh S', dateCreated: '2025-12-01', dateDue: '2026-01-10', dateCompleted: '2026-01-08',
    workflow: 'Release', riskLevel: 'Low', costImpact: '+$8 per unit',
  },
  {
    id: 'ECR-2026-003', title: 'Paint Process Revision — Accent Color', description: 'Update accent color application process from spray to powder coat for improved durability and environmental compliance.', affectedParts: ['FNS-1002', 'FNS-1003'], priority: 'Low', status: 'Completed', type: 'ECO',
    requester: 'Dharanidharan S', approver: 'Shanthosh S', dateCreated: '2026-01-05', dateDue: '2026-01-25', dateCompleted: '2026-01-22',
    workflow: 'Release', riskLevel: 'Low', costImpact: '-$3 per unit',
  },
  {
    id: 'ECR-2026-004', title: 'Dropout Alignment Tolerance', description: 'Tighten dropout alignment tolerance from ±0.5mm to ±0.2mm to improve wheel alignment and reduce assembly issues.', affectedParts: ['FRM-110', 'FRM-111'], priority: 'High', status: 'In Review', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-02-15', dateDue: '2026-03-01', dateCompleted: '',
    workflow: 'Technical Review', riskLevel: 'Medium', costImpact: '+$5 per unit',
  },
  {
    id: 'ECR-2026-005', title: 'Handlebar Width Increase', description: 'Increase handlebar width from 760mm to 780mm per rider feedback for improved control on technical trails.', affectedParts: ['CPT-801'], priority: 'Medium', status: 'In Review', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-02-18', dateDue: '2026-03-05', dateCompleted: '',
    workflow: 'Impact Analysis', riskLevel: 'Low', costImpact: '+$2 per unit',
  },
  {
    id: 'ECR-2026-006', title: 'Suspension Linkage Bushing Upgrade', description: 'Replace standard bushings with DU (self-lubricating) bushings in suspension linkage for reduced maintenance.', affectedParts: ['SUS-702', 'SUS-703'], priority: 'Medium', status: 'Draft', type: 'ECR',
    requester: 'Njanadeepan R K', approver: 'Shanthosh S', dateCreated: '2026-02-22', dateDue: '2026-03-15', dateCompleted: '',
    workflow: 'Draft', riskLevel: 'Low', costImpact: '+$15 per unit',
  },
  {
    id: 'ECR-2026-007', title: 'Chain Guide Addition', description: 'Add ISCG-05 chain guide mount to frame for improved chain retention during aggressive riding.', affectedParts: ['FRM-100', 'DRT-600'], priority: 'Low', status: 'Draft', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-02-25', dateDue: '2026-03-20', dateCompleted: '',
    workflow: 'Draft', riskLevel: 'Low', costImpact: '+$18 per unit',
  },
  {
    id: 'ECR-2026-008', title: 'Seat Clamp Quick Release', description: 'Change seat clamp from bolt-type to quick-release for easier saddle height adjustment.', affectedParts: ['CPT-805'], priority: 'Low', status: 'Pending', type: 'ECR',
    requester: 'Dharanidharan S', approver: 'Shanthosh S', dateCreated: '2026-03-01', dateDue: '2026-03-25', dateCompleted: '',
    workflow: 'Pending', riskLevel: 'Low', costImpact: '+$4 per unit',
  },
  {
    id: 'ECR-2026-009', title: 'Spoke Tension Specification Update', description: 'Update spoke tension specification from 100-120 kgf to 110-130 kgf based on field testing data.', affectedParts: ['WHL-303', 'WHL-403'], priority: 'Medium', status: 'Approved', type: 'ECO',
    requester: 'Njanadeepan R K', approver: 'Shanthosh S', dateCreated: '2026-03-05', dateDue: '2026-03-18', dateCompleted: '',
    workflow: 'Implementation', riskLevel: 'Low', costImpact: '$0',
  },
  {
    id: 'ECR-2026-010', title: 'Headset Bearing Seal Upgrade', description: 'Upgrade headset bearing seals from contact seals to labyrinth seals for improved water and mud resistance.', affectedParts: ['CPT-803'], priority: 'Medium', status: 'In Review', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-03-08', dateDue: '2026-03-22', dateCompleted: '',
    workflow: 'Technical Review', riskLevel: 'Low', costImpact: '+$6 per unit',
  },
  {
    id: 'ECR-2026-011', title: 'Tire Compound Update for Wet Grip', description: 'Switch to softer rubber compound (60a durometer) for front tire to improve wet weather traction.', affectedParts: ['WHL-304'], priority: 'High', status: 'In Review', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-03-10', dateDue: '2026-03-28', dateCompleted: '',
    workflow: 'Impact Analysis', riskLevel: 'Medium', costImpact: '+$7 per unit',
  },
  {
    id: 'ECR-2026-012', title: 'Cable Routing Internalization', description: 'Route shift and brake cables internally through the frame for cleaner aesthetics and cable protection.', affectedParts: ['FRM-100', 'FRM-101', 'FRM-102'], priority: 'High', status: 'Draft', type: 'ECR',
    requester: 'Malarvannan M', approver: 'Shanthosh S', dateCreated: '2026-03-12', dateDue: '2026-04-05', dateCompleted: '',
    workflow: 'Draft', riskLevel: 'High', costImpact: '+$22 per unit',
  },
  {
    id: 'ECR-2026-013', title: 'Weld Sequence Optimization', description: 'Optimize welding sequence to reduce thermal distortion in frame assembly, improving dimensional accuracy.', affectedParts: ['FRM-100'], priority: 'Medium', status: 'Pending', type: 'ECR',
    requester: 'Dharanidharan S', approver: 'Shanthosh S', dateCreated: '2026-03-14', dateDue: '2026-04-01', dateCompleted: '',
    workflow: 'Pending', riskLevel: 'Medium', costImpact: '-$5 per unit',
  },
];

// ─── MANUFACTURING OPERATIONS ────────────────────────────────
export const manufacturingOps = [
  { id: 'OP-010', operation: 'Material Cutting', machine: 'Band Saw BS-400', operator: 'R. Kumar', cycleTime: '12 min', tool: 'Bi-Metal Blade', inspection: 'Dimensional Check', qcMethod: 'Caliper ±0.5mm' },
  { id: 'OP-020', operation: 'Tube Bending', machine: 'CNC Tube Bender TB-200', operator: 'S. Prakash', cycleTime: '18 min', tool: 'Custom Mandrel Set', inspection: 'Angle Verification', qcMethod: 'Digital Protractor ±0.5°' },
  { id: 'OP-030', operation: 'Fixture Setup', machine: 'Custom Welding Jig WJ-01', operator: 'D. Selvam', cycleTime: '25 min', tool: 'Alignment Fixtures', inspection: 'Visual Alignment', qcMethod: 'Laser Alignment ±0.2mm' },
  { id: 'OP-040', operation: 'CNC Machining', machine: 'Haas VF-2SS', operator: 'P. Rajan', cycleTime: '35 min', tool: 'Carbide End Mills', inspection: 'CMM Measurement', qcMethod: 'CMM ±0.01mm' },
  { id: 'OP-050', operation: 'TIG Welding', machine: 'Miller Dynasty 350', operator: 'K. Murugan', cycleTime: '45 min', tool: 'ER70S-2 Filler Rod', inspection: 'Weld Quality', qcMethod: 'Visual + X-Ray' },
  { id: 'OP-060', operation: 'Grinding & Finishing', machine: 'Surface Grinder SG-200', operator: 'V. Anand', cycleTime: '20 min', tool: 'Grinding Wheels', inspection: 'Surface Finish', qcMethod: 'Profilometer Ra 1.6μm' },
  { id: 'OP-070', operation: 'Heat Treatment', machine: 'Furnace HT-800', operator: 'M. Suresh', cycleTime: '120 min', tool: 'Temperature Controller', inspection: 'Hardness Test', qcMethod: 'Rockwell HRC 28-32' },
  { id: 'OP-080', operation: 'Painting', machine: 'Paint Booth PB-400', operator: 'L. Ganesh', cycleTime: '60 min', tool: 'HVLP Spray Gun', inspection: 'Coating Thickness', qcMethod: 'DFT Gauge 60-80μm' },
  { id: 'OP-090', operation: 'Assembly', machine: 'Assembly Station AS-01', operator: 'Assembly Team', cycleTime: '90 min', tool: 'Torque Wrenches', inspection: 'Torque Verification', qcMethod: 'Calibrated Torque ±5%' },
  { id: 'OP-100', operation: 'Final Inspection', machine: 'Inspection Bay IB-01', operator: 'QC Team', cycleTime: '45 min', tool: 'Measurement Tools', inspection: 'Full Dimensional', qcMethod: 'Go/No-Go Gauges' },
  { id: 'OP-110', operation: 'Packaging', machine: 'Pack Station PS-01', operator: 'Logistics Team', cycleTime: '15 min', tool: 'Packaging Materials', inspection: 'Visual Check', qcMethod: 'Checklist Verification' },
];

// ─── SUPPLIERS ───────────────────────────────────────────────
export const suppliers = [
  { id: 'SUP-001', name: 'TubeWorks India', category: 'Raw Material', rating: 4.8, leadTime: '10 days', location: 'Chennai', status: 'Approved', deliveryPerf: 97, parts: ['FRM-100 series'], certifications: ['ISO 9001', 'ISO 14001'] },
  { id: 'SUP-002', name: 'RockShox India', category: 'Suspension', rating: 4.9, leadTime: '21 days', location: 'Pune', status: 'Approved', deliveryPerf: 95, parts: ['FRK-200 series'], certifications: ['ISO 9001', 'IATF 16949'] },
  { id: 'SUP-003', name: 'SpokeMaster', category: 'Wheels', rating: 4.6, leadTime: '14 days', location: 'Bangalore', status: 'Approved', deliveryPerf: 93, parts: ['WHL-300', 'WHL-400 series'], certifications: ['ISO 9001'] },
  { id: 'SUP-004', name: 'Shimano India', category: 'Components', rating: 4.9, leadTime: '18 days', location: 'Mumbai', status: 'Approved', deliveryPerf: 98, parts: ['BRK-500', 'DRT-600 series'], certifications: ['ISO 9001', 'ISO 14001', 'IATF 16949'] },
  { id: 'SUP-005', name: 'Fox Racing Shox', category: 'Suspension', rating: 4.7, leadTime: '25 days', location: 'Import — USA', status: 'Approved', deliveryPerf: 91, parts: ['SUS-700 series'], certifications: ['ISO 9001'] },
  { id: 'SUP-006', name: 'CoatingTech', category: 'Surface Treatment', rating: 4.5, leadTime: '7 days', location: 'Coimbatore', status: 'Approved', deliveryPerf: 96, parts: ['FNS-1000 series'], certifications: ['ISO 9001', 'ISO 14001'] },
  { id: 'SUP-007', name: 'FastTech', category: 'Hardware', rating: 4.3, leadTime: '5 days', location: 'Coimbatore', status: 'Approved', deliveryPerf: 99, parts: ['HDW-900 series'], certifications: ['ISO 9001'] },
  { id: 'SUP-008', name: 'Continental India', category: 'Tires', rating: 4.7, leadTime: '12 days', location: 'Delhi', status: 'Approved', deliveryPerf: 94, parts: ['WHL-304', 'WHL-404'], certifications: ['ISO 9001', 'ISO 14001'] },
  { id: 'SUP-009', name: 'KMC Chains', category: 'Drivetrain', rating: 4.4, leadTime: '10 days', location: 'Import — Taiwan', status: 'Approved', deliveryPerf: 92, parts: ['DRT-603'], certifications: ['ISO 9001'] },
  { id: 'SUP-010', name: 'PrecisionCast Co', category: 'Castings', rating: 4.6, leadTime: '15 days', location: 'Chennai', status: 'Approved', deliveryPerf: 90, parts: ['FRM-110', 'FRM-111'], certifications: ['ISO 9001', 'NADCAP'] },
  { id: 'SUP-011', name: 'RaceFace', category: 'Cockpit', rating: 4.5, leadTime: '20 days', location: 'Import — Canada', status: 'Approved', deliveryPerf: 89, parts: ['CPT-801', 'CPT-802', 'CPT-805'], certifications: ['ISO 9001'] },
  { id: 'SUP-012', name: 'SKF India', category: 'Bearings', rating: 4.8, leadTime: '8 days', location: 'Pune', status: 'Approved', deliveryPerf: 98, parts: ['SUS-703'], certifications: ['ISO 9001', 'IATF 16949', 'AS9100'] },
];

// ─── ACTIVITIES ──────────────────────────────────────────────
export const activities = [
  { id: 'ACT-001', time: '09:10', title: 'Frame Assembly updated to Rev B.3', user: 'Malarvannan M', type: 'design' },
  { id: 'ACT-002', time: '09:25', title: 'Revision B released to production', user: 'Shanthosh S', type: 'release' },
  { id: 'ACT-003', time: '10:05', title: 'Manufacturing plan approved', user: 'Shanthosh S', type: 'approval' },
  { id: 'ACT-004', time: '11:12', title: 'Quality inspection completed (98.6%)', user: 'Njanadeepan R K', type: 'quality' },
  { id: 'ACT-005', time: '11:45', title: 'Supplier GearWorks confirmed delivery', user: 'Purchase Cell', type: 'supplier' },
  { id: 'ACT-006', time: '12:00', title: 'Prototype PROTO-04 ready for validation', user: 'Malarvannan M', type: 'milestone' },
  { id: 'ACT-007', time: '13:30', title: 'ECR-2026-013 raised for weld sequence', user: 'Malarvannan M', type: 'ecr' },
];

export const upcomingTasks = [
  { id: 'TSK-001', title: 'Approve ECR-2026-013', due: 'Today', category: 'Approval', priority: 'High' },
  { id: 'TSK-002', title: 'Review FEA Report v1.3', due: 'Tomorrow', category: 'CAE', priority: 'Medium' },
  { id: 'TSK-003', title: 'Sign-off Assembly WI', due: 'Feb 12', category: 'MFG', priority: 'Medium' },
  { id: 'TSK-004', title: 'Supplier audit — GearWorks', due: 'Feb 15', category: 'Purchase', priority: 'Low' },
];

export const aiRecommendations = [
  { id: 'AI-001', text: 'Revision B reduced frame weight by 420 g', type: 'success' },
  { id: 'AI-002', text: 'Manufacturing cost can be reduced by 8% via tube-length optimization', type: 'info' },
  { id: 'AI-003', text: 'Part DRV-401 has no approved alternate supplier', type: 'warning' },
  { id: 'AI-004', text: 'Inspection report for WHL-303 missing for batch #4210', type: 'danger' },
  { id: 'AI-005', text: 'Tolerance on FRM-102 exceeds ISO 2768-mK — consider tightening', type: 'warning' },
];

// ─── PRODUCT LIFECYCLE STAGES ────────────────────────────────
export const lifecycleStages = [
  { id: 'LC-01', name: 'Concept', department: 'Engineering', owner: 'Malarvannan M', deliverables: 'Product brief, concept sketches, feasibility report', revision: 'A', status: 'Completed', approval: 'Approved', documents: 3, completion: 100, description: 'Initial product concept development, market analysis, and feasibility assessment for the mountain bicycle platform.' },
  { id: 'LC-02', name: 'Requirement Management', department: 'Engineering / PMO', owner: 'Shanthosh S', deliverables: 'PRD, requirements matrix, stakeholder approval', revision: 'B', status: 'Completed', approval: 'Approved', documents: 8, completion: 100, description: 'Comprehensive requirements gathering including performance specs, regulatory requirements, and customer expectations.' },
  { id: 'LC-03', name: 'CAD Design', department: 'Design', owner: 'Malarvannan M', deliverables: '3D models, assemblies, drawings, BOM', revision: 'B.3', status: 'Completed', approval: 'Approved', documents: 42, completion: 100, description: 'Detailed CAD design of all components including frame, fork, wheels, drivetrain, brakes, and cockpit assemblies.' },
  { id: 'LC-04', name: 'Simulation', department: 'CAE', owner: 'Njanadeepan R K', deliverables: 'FEA results, fatigue analysis, optimization report', revision: 'B.2', status: 'Completed', approval: 'Approved', documents: 12, completion: 100, description: 'Structural analysis, modal analysis, fatigue life prediction, and design optimization using FEA simulations.' },
  { id: 'LC-05', name: 'Prototype', department: 'Engineering', owner: 'Malarvannan M', deliverables: 'Physical prototype, test samples, validation plan', revision: 'PROTO-04', status: 'Completed', approval: 'Approved', documents: 6, completion: 100, description: 'Prototype fabrication and initial physical validation. Four prototypes built with progressive improvements.' },
  { id: 'LC-06', name: 'Manufacturing Planning', department: 'Manufacturing', owner: 'Dharanidharan S', deliverables: 'Process routes, work instructions, tool list', revision: 'A.3', status: 'Completed', approval: 'Approved', documents: 15, completion: 100, description: 'Manufacturing process design including routing, tooling selection, fixture design, and work instruction creation.' },
  { id: 'LC-07', name: 'Production', department: 'Manufacturing', owner: 'Dharanidharan S', deliverables: 'Production orders, batch records, inspection logs', revision: 'A', status: 'Active', approval: 'Released', documents: 28, completion: 92, description: 'Serial production of the HPB-2026 mountain bicycle. Currently in batch production with 18 active manufacturing orders.' },
  { id: 'LC-08', name: 'Assembly', department: 'Manufacturing', owner: 'Dharanidharan S', deliverables: 'Assembly procedures, torque specs, quality gates', revision: 'A.2', status: 'Active', approval: 'Released', documents: 8, completion: 95, description: 'Final assembly of all subsystems including frame, suspension, wheels, drivetrain, brakes, and cockpit components.' },
  { id: 'LC-09', name: 'Inspection', department: 'Quality', owner: 'Njanadeepan R K', deliverables: 'Inspection reports, test certificates, NCRs', revision: 'A', status: 'Active', approval: 'Released', documents: 18, completion: 98, description: 'Final quality inspection including dimensional verification, surface finish check, functional testing, and ride testing.' },
  { id: 'LC-10', name: 'Release', department: 'PMO', owner: 'Shanthosh S', deliverables: 'Release note, configuration baseline, documentation', revision: 'B.3', status: 'Completed', approval: 'Approved', documents: 5, completion: 100, description: 'Product release to market with full documentation package, configuration management baseline, and regulatory compliance.' },
  { id: 'LC-11', name: 'Service', department: 'Service', owner: 'Shanthosh S', deliverables: 'Service manuals, spare parts catalog, warranty policy', revision: 'A', status: 'Active', approval: 'Released', documents: 7, completion: 85, description: 'After-sales service setup including service manual development, spare parts cataloging, and dealer training.' },
  { id: 'LC-12', name: 'Maintenance', department: 'Service', owner: 'Dharanidharan S', deliverables: 'Maintenance schedule, wear parts list, service bulletins', revision: 'A', status: 'Planned', approval: 'Pending', documents: 3, completion: 40, description: 'Preventive and corrective maintenance planning for field-deployed products including interval-based service schedules.' },
  { id: 'LC-13', name: 'Retirement', department: 'PMO', owner: 'Shanthosh S', deliverables: 'End-of-life plan, recycling guide, material recovery', revision: '-', status: 'Planned', approval: 'Pending', documents: 1, completion: 10, description: 'End-of-life planning including recyclability assessment, material recovery procedures, and environmental compliance.' },
];

// ─── INVENTORY ───────────────────────────────────────────────
export const inventoryItems = [
  { id: 'INV-001', name: 'AISI 4130 Steel Tube (Ø28.6×0.9)', category: 'Raw Material', warehouse: 'WH-01', stock: 245, minStock: 50, unit: 'meters', lastReceived: '2026-02-01', supplier: 'TubeWorks India', status: 'In Stock' },
  { id: 'INV-002', name: 'AISI 4130 Steel Tube (Ø34.9×1.0)', category: 'Raw Material', warehouse: 'WH-01', stock: 180, minStock: 40, unit: 'meters', lastReceived: '2026-02-01', supplier: 'TubeWorks India', status: 'In Stock' },
  { id: 'INV-003', name: 'Fork Assembly (Complete)', category: 'Component', warehouse: 'WH-02', stock: 32, minStock: 10, unit: 'units', lastReceived: '2026-01-28', supplier: 'RockShox India', status: 'In Stock' },
  { id: 'INV-004', name: 'Wheel Set (Front + Rear)', category: 'Component', warehouse: 'WH-02', stock: 28, minStock: 10, unit: 'sets', lastReceived: '2026-01-25', supplier: 'SpokeMaster', status: 'In Stock' },
  { id: 'INV-005', name: 'Brake System Kit', category: 'Component', warehouse: 'WH-02', stock: 35, minStock: 15, unit: 'kits', lastReceived: '2026-02-05', supplier: 'Shimano India', status: 'In Stock' },
  { id: 'INV-006', name: 'Drivetrain Kit', category: 'Component', warehouse: 'WH-02', stock: 8, minStock: 10, unit: 'kits', lastReceived: '2026-01-20', supplier: 'Shimano India', status: 'Low Stock' },
  { id: 'INV-007', name: 'Rear Shock Absorber', category: 'Component', warehouse: 'WH-02', stock: 18, minStock: 8, unit: 'units', lastReceived: '2026-02-02', supplier: 'Fox Racing Shox', status: 'In Stock' },
  { id: 'INV-008', name: 'Handlebar Assembly', category: 'Component', warehouse: 'WH-02', stock: 42, minStock: 15, unit: 'units', lastReceived: '2026-01-30', supplier: 'RaceFace', status: 'In Stock' },
  { id: 'INV-009', name: 'Saddle', category: 'Component', warehouse: 'WH-02', stock: 55, minStock: 20, unit: 'units', lastReceived: '2026-02-03', supplier: 'WTB', status: 'In Stock' },
  { id: 'INV-010', name: 'Hardware Kit (Fasteners)', category: 'Component', warehouse: 'WH-03', stock: 120, minStock: 30, unit: 'kits', lastReceived: '2026-02-08', supplier: 'FastTech', status: 'In Stock' },
  { id: 'INV-011', name: 'Epoxy Primer (20L)', category: 'Consumable', warehouse: 'WH-03', stock: 5, minStock: 3, unit: 'drums', lastReceived: '2026-01-15', supplier: 'CoatingTech', status: 'In Stock' },
  { id: 'INV-012', name: 'Matte Black Paint (20L)', category: 'Consumable', warehouse: 'WH-03', stock: 3, minStock: 2, unit: 'drums', lastReceived: '2026-01-15', supplier: 'CoatingTech', status: 'In Stock' },
  { id: 'INV-013', name: 'ER70S-2 Welding Wire (15kg)', category: 'Consumable', warehouse: 'WH-03', stock: 12, minStock: 5, unit: 'spools', lastReceived: '2026-02-01', supplier: 'WeldSupply Co', status: 'In Stock' },
  { id: 'INV-014', name: 'HPB-2026 Complete Bicycle', category: 'Finished Goods', warehouse: 'WH-04', stock: 24, minStock: 5, unit: 'units', lastReceived: '2026-02-10', supplier: 'Internal', status: 'In Stock' },
  { id: 'INV-015', name: 'Packaging Box (Bicycle)', category: 'Consumable', warehouse: 'WH-04', stock: 4, minStock: 10, unit: 'units', lastReceived: '2026-01-28', supplier: 'PackagePro', status: 'Low Stock' },
];

// ─── QUALITY DATA ────────────────────────────────────────────
export const qualityMetrics = {
  overallYield: 98.6,
  inspectionPassRate: 97.2,
  cp: 1.67,
  cpk: 1.45,
  dpmo: 3400,
  costOfQuality: 2.1,
  ncrOpen: 3,
  ncrClosed: 24,
  capaOpen: 2,
  capaClosed: 18,
};

export const qualityInspections = [
  { id: 'QI-001', batch: '#4210', component: 'Frame Assembly', date: '2026-02-10', inspector: 'QC Team', result: 'Pass', defects: 0, notes: 'All dimensions within tolerance' },
  { id: 'QI-002', batch: '#4209', component: 'Fork Assembly', date: '2026-02-08', inspector: 'QC Team', result: 'Pass', defects: 0, notes: 'Surface finish excellent' },
  { id: 'QI-003', batch: '#4208', component: 'Wheel Set', date: '2026-02-05', inspector: 'QC Team', result: 'Pass', defects: 1, notes: 'Minor spoke tension variance — adjusted' },
  { id: 'QI-004', batch: '#4207', component: 'Brake System', date: '2026-02-03', inspector: 'QC Team', result: 'Pass', defects: 0, notes: 'Braking performance verified' },
  { id: 'QI-005', batch: '#4206', component: 'Frame Assembly', date: '2026-01-30', inspector: 'QC Team', result: 'Fail', defects: 2, notes: 'Weld porosity detected on down tube joint' },
  { id: 'QI-006', batch: '#4205', component: 'Paint & Finish', date: '2026-01-28', inspector: 'QC Team', result: 'Pass', defects: 0, notes: 'Coating thickness within spec' },
  { id: 'QI-007', batch: '#4204', component: 'Drivetrain', date: '2026-01-25', inspector: 'QC Team', result: 'Pass', defects: 0, notes: 'Shifting performance validated' },
  { id: 'QI-008', batch: '#4203', component: 'Full Assembly', date: '2026-01-22', inspector: 'QC Team', result: 'Pass', defects: 1, notes: 'Headset bearing play — retorqued' },
];

// ─── PRODUCTION DATA ────────────────────────────────────────
export const productionOrders = [
  { id: 'PO-001', orderNo: 'MFG-2026-018', product: 'HPB-2026', quantity: 50, completed: 42, status: 'In Progress', startDate: '2026-01-15', dueDate: '2026-02-28', priority: 'High' },
  { id: 'PO-002', orderNo: 'MFG-2026-017', product: 'HPB-2026', quantity: 50, completed: 50, status: 'Completed', startDate: '2025-12-01', dueDate: '2026-01-15', priority: 'Normal' },
  { id: 'PO-003', orderNo: 'MFG-2026-016', product: 'HPB-2026', quantity: 30, completed: 30, status: 'Completed', startDate: '2025-11-01', dueDate: '2025-12-01', priority: 'Normal' },
  { id: 'PO-004', orderNo: 'MFG-2026-019', product: 'HPB-2026', quantity: 50, completed: 0, status: 'Scheduled', startDate: '2026-03-01', dueDate: '2026-04-15', priority: 'Normal' },
];

export const productionStats = {
  machineUtilization: 87,
  oee: 82,
  dailyOutput: 4,
  weeklyOutput: 22,
  downtime: 3.2,
  rejectedParts: 7,
  completedOrders: 80,
  totalOrders: 130,
};

// ─── CHART DATA ──────────────────────────────────────────────
export const productionTrendData = [
  { day: 'Mon', planned: 35, actual: 34 },
  { day: 'Tue', planned: 40, actual: 38 },
  { day: 'Wed', planned: 42, actual: 43 },
  { day: 'Thu', planned: 45, actual: 44 },
  { day: 'Fri', planned: 45, actual: 46 },
  { day: 'Sat', planned: 48, actual: 47 },
  { day: 'Sun', planned: 35, actual: 30 },
];

export const qualityYieldData = [
  { week: 'W1', yield: 96.8 },
  { week: 'W2', yield: 97.2 },
  { week: 'W3', yield: 97.8 },
  { week: 'W4', yield: 98.1 },
  { week: 'W5', yield: 98.6 },
  { week: 'W6', yield: 98.4 },
];

export const bomCostData = [
  { name: 'Frame', value: 285, color: '#0B192C' },
  { name: 'Fork', value: 420, color: '#1E3E62' },
  { name: 'Wheels', value: 430, color: '#F96E2A' },
  { name: 'Brakes', value: 310, color: '#10B981' },
  { name: 'Drivetrain', value: 385, color: '#8B5CF6' },
  { name: 'Suspension', value: 380, color: '#EC4899' },
  { name: 'Cockpit', value: 190, color: '#06B6D4' },
  { name: 'Hardware', value: 48, color: '#F59E0B' },
  { name: 'Finish', value: 95, color: '#6366F1' },
];

export const engineeringChangesChartData = [
  { status: 'Draft', count: 3 },
  { status: 'Impact Analysis', count: 2 },
  { status: 'In Review', count: 3 },
  { status: 'Approved', count: 1 },
  { status: 'Implementation', count: 1 },
  { status: 'Completed', count: 3 },
];

// ─── NAVIGATION ──────────────────────────────────────────────
export const navigationItems = [
  { section: 'WORKSPACE', items: [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    { name: 'Products', path: '/products', icon: 'Package' },
    { name: 'Projects', path: '/projects', icon: 'FolderKanban' },
    { name: 'Product Lifecycle', path: '/lifecycle', icon: 'GitBranch' },
  ]},
  { section: 'ENGINEERING', items: [
    { name: 'Digital Twin', path: '/digital-twin', icon: 'Box' },
    { name: 'CAD Repository', path: '/cad-repository', icon: 'HardDrive' },
    { name: 'Documents', path: '/documents', icon: 'FileText' },
    { name: 'BOM Explorer', path: '/bom-explorer', icon: 'Network' },
    { name: 'Engineering Change', path: '/engineering-change', icon: 'GitPullRequest' },
  ]},
  { section: 'OPERATIONS', items: [
    { name: 'Manufacturing', path: '/manufacturing', icon: 'Factory' },
    { name: 'Production', path: '/production', icon: 'Activity' },
    { name: 'Quality', path: '/quality', icon: 'ShieldCheck' },
    { name: 'Suppliers', path: '/suppliers', icon: 'Truck' },
    { name: 'Inventory', path: '/inventory', icon: 'Warehouse' },
  ]},
  { section: 'INSIGHTS', items: [
    { name: 'Analytics', path: '/analytics', icon: 'BarChart3' },
    { name: 'Reports', path: '/reports', icon: 'ClipboardList' },
  ]},
  { section: 'ORGANIZATION', items: [
    { name: 'Team', path: '/team', icon: 'Users' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Contact', path: '/contact', icon: 'Mail' },
  ]},
];

// ─── AI COPILOT RESPONSES ────────────────────────────────────
export const aiCopilotResponses: Record<string, { title: string; content: string; type: string; actions?: string[] }> = {
  'default': {
    title: 'PLM AI Copilot',
    content: 'I\'m your intelligent engineering assistant. I can help you search documents, analyze BOMs, summarize engineering changes, recommend manufacturing improvements, and answer PLM questions. How can I help?',
    type: 'info',
  },
  'bom': {
    title: 'BOM Analysis — HPB-2026',
    content: 'The HPB-2026 BOM consists of 10 top-level assemblies with 67 child components. Total weight: 13.8 kg. Total material cost: $2,543. The Frame Assembly (FRM-100) is the heaviest single component at 2.8 kg. The Fork Assembly (FRK-200) is the most expensive at $420. All components are at "Released" status with approved suppliers.',
    type: 'analysis',
    actions: ['View Full BOM', 'Cost Breakdown', 'Weight Analysis'],
  },
  'ecr': {
    title: 'Engineering Change Summary',
    content: 'There are 13 engineering changes tracked for HPB-2026. 3 completed ECOs, 4 ECRs in review, 3 drafts, 2 pending, and 1 approved for implementation. The highest-impact change is ECR-2026-001 (Frame Weight Reduction) which achieved a 420g weight saving. Current open ECRs have a combined cost impact of +$77/unit.',
    type: 'summary',
    actions: ['View All ECRs', 'Impact Report', 'Approval Queue'],
  },
  'manufacturing': {
    title: 'Manufacturing Process Plan',
    content: 'The HPB-2026 manufacturing process consists of 11 operations from material cutting to packaging. Total cycle time: ~485 minutes (~8 hours). Critical path operations: TIG Welding (45 min), Heat Treatment (120 min), Assembly (90 min). Current OEE: 82%. Suggested optimization: Parallelizing heat treatment with sub-assembly prep could reduce total lead time by 15%.',
    type: 'recommendation',
    actions: ['View Process Route', 'Optimize Plan', 'Capacity Analysis'],
  },
  'quality': {
    title: 'Quality Analysis',
    content: 'Current quality metrics show strong performance. Yield: 98.6%, Cp: 1.67, Cpk: 1.45 (above 1.33 threshold). 3 open NCRs, 2 active CAPAs. Most common defect: weld porosity (37% of all NCRs). Recommendation: Implement gas pre-flow timer adjustment on TIG welder to reduce porosity incidents by an estimated 60%.',
    type: 'analysis',
    actions: ['View NCRs', 'Control Charts', 'CAPA Status'],
  },
  'material': {
    title: 'AISI 4130 Components',
    content: 'Found 12 parts made from AISI 4130 Chromoly Steel, all in the Frame Assembly (FRM-100 series). Total weight: 2.8 kg. Supplier: TubeWorks India (Rating: 4.8/5, Lead time: 10 days). Material properties: UTS 560 MPa, Yield 460 MPa, Elongation 22%. All material certificates valid through 2026-Q4.',
    type: 'search',
    actions: ['View Parts List', 'Material Certificate', 'Supplier Details'],
  },
  'supplier': {
    title: 'Supplier Lead Time Analysis',
    content: 'Shortest lead time suppliers: 1) FastTech — 5 days (Hardware), 2) CoatingTech — 7 days (Surface Treatment), 3) SKF India — 8 days (Bearings). Longest: Fox Racing Shox — 25 days (Suspension, Import). Average lead time across all suppliers: 13.8 days. On-time delivery performance: 94.4% average.',
    type: 'analysis',
    actions: ['Supplier Directory', 'Delivery Report', 'Risk Assessment'],
  },
};

export const aiSuggestedPrompts = [
  'Explain this BOM',
  'Compare Revision A and Revision B',
  'Summarize engineering changes',
  'Generate a manufacturing process plan',
  'Find all parts made from AISI 4130',
  'Which supplier has the shortest lead time?',
  'Create inspection checklist',
  'Show cost breakdown',
  'Predict manufacturing risks',
  'Summarize project status',
];

// ─── PROJECTS ────────────────────────────────────────────────
export const projects = [
  {
    id: 'PRJ-001',
    name: 'HPB-2026 Mountain Bicycle Development',
    code: 'HPB-2026',
    status: 'Active',
    progress: 92,
    startDate: '2025-06-01',
    endDate: '2026-06-30',
    manager: 'Shanthosh S',
    team: ['Malarvannan M', 'Shanthosh S', 'Njanadeepan R K', 'Dharanidharan S'],
    budget: 450000,
    spent: 385000,
    milestones: [
      { name: 'Concept Approval', date: '2025-07-15', status: 'Completed' },
      { name: 'Design Freeze', date: '2025-10-30', status: 'Completed' },
      { name: 'Prototype Validation', date: '2025-12-15', status: 'Completed' },
      { name: 'Production Release', date: '2026-02-12', status: 'Completed' },
      { name: 'Market Launch', date: '2026-04-01', status: 'In Progress' },
      { name: 'Project Closure', date: '2026-06-30', status: 'Planned' },
    ],
  },
];

// ─── NOTIFICATION DATA ───────────────────────────────────────
export const notifications = [
  { id: 'NOT-001', title: 'ECR-2026-013 requires your approval', category: 'Approvals', time: '5 min ago', read: false, priority: 'high' },
  { id: 'NOT-002', title: 'Manufacturing order MFG-2026-018 is 84% complete', category: 'Manufacturing', time: '1 hour ago', read: false, priority: 'medium' },
  { id: 'NOT-003', title: 'Quality inspection passed for batch #4210', category: 'Quality', time: '2 hours ago', read: true, priority: 'low' },
  { id: 'NOT-004', title: 'Drivetrain Kit stock below minimum threshold', category: 'Inventory', time: '3 hours ago', read: false, priority: 'high' },
  { id: 'NOT-005', title: 'FEA Report v1.3 uploaded by Njanadeepan R K', category: 'Engineering', time: '4 hours ago', read: true, priority: 'medium' },
  { id: 'NOT-006', title: 'Supplier delivery confirmed — RockShox India', category: 'Suppliers', time: '5 hours ago', read: true, priority: 'low' },
  { id: 'NOT-007', title: 'Prototype PROTO-04 validation report available', category: 'Projects', time: '6 hours ago', read: true, priority: 'medium' },
  { id: 'NOT-008', title: 'Frame Assembly Rev B.3 released to production', category: 'Engineering', time: '8 hours ago', read: true, priority: 'medium' },
];

// ─── USER ROLES ──────────────────────────────────────────────
export const userRoles = [
  { role: 'Administrator', permissions: ['All Access'], users: 1, description: 'Full system access with user management' },
  { role: 'Project Manager', permissions: ['Projects', 'Approvals', 'Reports', 'Team'], users: 1, description: 'Project oversight and approval authority' },
  { role: 'Design Engineer', permissions: ['CAD', 'BOM', 'ECR', 'Digital Twin', 'Documents'], users: 2, description: 'Product design and engineering changes' },
  { role: 'CAE Engineer', permissions: ['Simulation', 'Reports', 'ECR Review', 'Quality'], users: 1, description: 'Computer-aided engineering and analysis' },
  { role: 'Manufacturing Engineer', permissions: ['Manufacturing', 'Production', 'BOM', 'Quality'], users: 1, description: 'Manufacturing process and production management' },
  { role: 'Quality Engineer', permissions: ['Quality', 'Inspection', 'NCR', 'CAPA', 'Reports'], users: 1, description: 'Quality assurance and compliance' },
  { role: 'Purchase Engineer', permissions: ['Suppliers', 'Inventory', 'Purchase Orders'], users: 1, description: 'Procurement and supplier management' },
  { role: 'Supplier', permissions: ['View Assigned POs', 'Upload Documents'], users: 3, description: 'External supplier portal access' },
  { role: 'Viewer', permissions: ['Read-Only Access'], users: 5, description: 'View-only access to all modules' },
];

// ─── COMMAND PALETTE ─────────────────────────────────────────
export const commandPaletteItems = [
  { id: 'CMD-001', label: 'Go to Dashboard', category: 'Navigation', action: '/', icon: 'LayoutDashboard' },
  { id: 'CMD-002', label: 'Go to Digital Twin', category: 'Navigation', action: '/digital-twin', icon: 'Box' },
  { id: 'CMD-003', label: 'Go to BOM Explorer', category: 'Navigation', action: '/bom-explorer', icon: 'Network' },
  { id: 'CMD-004', label: 'Go to CAD Repository', category: 'Navigation', action: '/cad-repository', icon: 'HardDrive' },
  { id: 'CMD-005', label: 'Go to Engineering Changes', category: 'Navigation', action: '/engineering-change', icon: 'GitPullRequest' },
  { id: 'CMD-006', label: 'Go to Manufacturing', category: 'Navigation', action: '/manufacturing', icon: 'Factory' },
  { id: 'CMD-007', label: 'Go to Quality', category: 'Navigation', action: '/quality', icon: 'ShieldCheck' },
  { id: 'CMD-008', label: 'Go to Analytics', category: 'Navigation', action: '/analytics', icon: 'BarChart3' },
  { id: 'CMD-009', label: 'Open Bicycle Assembly', category: 'Quick Actions', action: '/digital-twin', icon: 'Box' },
  { id: 'CMD-010', label: 'View Stress Analysis', category: 'Quick Actions', action: '/documents', icon: 'FileText' },
  { id: 'CMD-011', label: 'Create New ECR', category: 'Quick Actions', action: '/engineering-change', icon: 'GitPullRequest' },
  { id: 'CMD-012', label: 'Generate Report', category: 'Quick Actions', action: '/reports', icon: 'ClipboardList' },
  { id: 'CMD-013', label: 'Frame Assembly', category: 'Products', action: '/bom-explorer', icon: 'Package' },
  { id: 'CMD-014', label: 'Fork Assembly', category: 'Products', action: '/bom-explorer', icon: 'Package' },
  { id: 'CMD-015', label: 'Brake System', category: 'Products', action: '/bom-explorer', icon: 'Package' },
  { id: 'CMD-016', label: 'Shimano India', category: 'Suppliers', action: '/suppliers', icon: 'Truck' },
  { id: 'CMD-017', label: 'TubeWorks India', category: 'Suppliers', action: '/suppliers', icon: 'Truck' },
  { id: 'CMD-018', label: 'RockShox India', category: 'Suppliers', action: '/suppliers', icon: 'Truck' },
];
