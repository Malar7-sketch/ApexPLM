const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const BOM = require('../models/BOM');
const Document = require('../models/Document');
const NCR = require('../models/NCR');
const Part = require('../models/Part');
const AuditLog = require('../models/AuditLog');

const initialUsers = [
  {
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
    status: 'Active',
    permissions: ['CAD Vault Checkout', 'EBOM Creation', 'ECN Submission', 'DFMEA Risk Analysis', '3D Model Release']
  },
  {
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
    status: 'Active',
    permissions: ['MBOM Assembly Rollup', 'CAPP Process Routing', 'PFMEA Analysis', 'CNC Toolpath CAM Release', 'Fixture Management']
  },
  {
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
    status: 'Active',
    permissions: ['Quality Inspection Approval', 'CAPA Root Cause Investigation', 'NCR Submission', 'PPAP Signoff', 'ISO Audit']
  },
  {
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
    status: 'Active',
    permissions: ['Full System Superuser', 'RBAC User Management', 'Database Backup', 'System Settings', 'Audit Log Clearing', 'SSO Active Directory']
  },
  {
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
    status: 'Active',
    permissions: ['View Personal Dashboard', 'View Assigned Work Orders', 'View Released Documents']
  },
  {
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
    status: 'Active',
    permissions: ['Project Creation', 'Gantt Milestone Approval', 'Project Budget Tracking', 'Cross-functional Team Lead']
  },
  {
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
    status: 'Active',
    permissions: ['3D CAD Modeling', 'EBOM Architecture', 'DFMEA Risk Management', 'GD&T Design Specs']
  },
  {
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
    status: 'Active',
    permissions: ['CAD Analysis', '2D Technical Drawings', 'Stress Testing Simulation']
  },
  {
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
    status: 'Active',
    permissions: ['CAD Vault Synchronization', 'STEP B-Rep Validation', '3D Model Release']
  }
];

const initialProjects = [
  {
    code: 'PRJ-EV-001',
    name: 'Gen-3 EV Planetary Powertrain',
    customer: 'Apex Motors Global',
    program: 'NextGen Electric Mobility 2026',
    stage: 'Design',
    status: 'On Track',
    progress: 42,
    startDate: '2026-01-15',
    endDate: '2026-08-30',
    durationFormatted: '227 Days (~32 Weeks / 7.5 Months)',
    manager: 'David Sterling',
    designEngineer: 'Alex Rivera, PE',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    budgetTotal: 850000,
    budgetSpent: 345000,
    engHoursTotal: 3200,
    engHoursSpent: 1380,
    targetRelease: 'Q4 2026',
    activeEcrs: 2,
    openNcrs: 1,
    cadModelsCount: 14,
    ebomPartCount: 68,
    description: 'Ultra high-efficiency planetary reduction transmission with integrated liquid cooling for 800V EV architecture.',
    teamMembers: [
      { employeeId: 'EMP-10042', name: 'David Sterling', role: 'Project Manager', department: 'Program Management Office', email: 'david.sterling@apexplm.io', avatar: '👔' },
      { employeeId: 'EMP-10482', name: 'Alex Rivera', role: 'Lead Design Engineer', department: 'Product Design & CAD Engineering', email: 'alex.rivera@apexplm.io', avatar: '👨‍💻' },
      { employeeId: 'EMP-20911', name: 'Marcus Vance', role: 'Manufacturing Engineer', department: 'Tooling & CAPP Process Planning', email: 'marcus.vance@apexplm.io', avatar: '👷‍♂️' },
      { employeeId: 'EMP-30489', name: 'Dr. Elena Rostova', role: 'Quality Lead Auditor', department: 'Quality Assurance & QMS Compliance', email: 'elena.rostova@apexplm.io', avatar: '👩‍🔬' }
    ],
    tasks: [
      { taskNumber: '01', taskName: '01 Requirements Definition', weight: 5, assignedRole: 'pm', owner: 'David Sterling', dependency: 'None', progressPercent: 100, status: 'Completed', durationDays: 14, startDate: '2026-01-15', endDate: '2026-01-29' },
      { taskNumber: '02', taskName: '02 3D CAD Modeling', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '01 Requirements Definition', progressPercent: 90, status: 'In Progress', durationDays: 30, startDate: '2026-01-30', endDate: '2026-03-01' },
      { taskNumber: '03', taskName: '03 2D Drawing', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '02 3D CAD Modeling', progressPercent: 70, status: 'In Progress', durationDays: 14, startDate: '2026-03-02', endDate: '2026-03-16' },
      { taskNumber: '04', taskName: '04 Engineering Review', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '03 2D Drawing', progressPercent: 50, status: 'In Progress', durationDays: 10, startDate: '2026-03-17', endDate: '2026-03-27' },
      { taskNumber: '05', taskName: '05 EBOM Creation', weight: 10, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '04 Engineering Review', progressPercent: 40, status: 'In Progress', durationDays: 14, startDate: '2026-03-28', endDate: '2026-04-11' },
      { taskNumber: '06', taskName: '06 DFMEA', weight: 5, assignedRole: 'design', owner: 'Alex Rivera, PE', dependency: '05 EBOM Creation', progressPercent: 30, status: 'In Progress', durationDays: 10, startDate: '2026-04-12', endDate: '2026-04-22' },
      { taskNumber: '07', taskName: '07 Prototype Development', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '06 DFMEA', progressPercent: 0, status: 'Not Started', durationDays: 20, startDate: '2026-04-23', endDate: '2026-05-13' },
      { taskNumber: '08', taskName: '08 CAPP / Process Planning', weight: 10, assignedRole: 'mfg', owner: 'Marcus Vance', dependency: '07 Prototype Development', progressPercent: 0, status: 'Not Started', durationDays: 15, startDate: '2026-05-14', endDate: '2026-05-29' }
    ]
  },
  {
    code: 'PRJ-EV-002',
    name: 'Modular 800V High-Density Battery Pack',
    customer: 'Voltaic Systems Corp',
    program: 'Heavy Vehicle Commercial Platform',
    stage: 'Validation',
    status: 'On Track',
    progress: 74,
    startDate: '2025-08-01',
    endDate: '2026-06-15',
    durationFormatted: '318 Days (~45 Weeks / 10.4 Months)',
    manager: 'David Sterling',
    designEngineer: 'Alex Rivera, PE',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    budgetTotal: 1200000,
    budgetSpent: 890000,
    engHoursTotal: 4800,
    engHoursSpent: 3550,
    targetRelease: 'Q3 2026',
    activeEcrs: 1,
    openNcrs: 0,
    cadModelsCount: 28,
    ebomPartCount: 142,
    description: 'Liquid immersed cell-to-pack structural battery enclosure for heavy haul commercial applications.',
    teamMembers: [
      { employeeId: 'EMP-10042', name: 'David Sterling', role: 'Project Manager', department: 'Program Management Office', email: 'david.sterling@apexplm.io', avatar: '👔' },
      { employeeId: 'EMP-10482', name: 'Alex Rivera', role: 'Lead Design Engineer', department: 'Product Design & CAD Engineering', email: 'alex.rivera@apexplm.io', avatar: '👨‍💻' }
    ],
    tasks: []
  },
  {
    code: 'PRJ-EV-003',
    name: 'Active Aerodynamic Rear Wing & Diffuser',
    customer: 'AeroDynamics Lab',
    program: 'Apex Track Hypercar',
    stage: 'Production',
    status: 'Completed',
    progress: 100,
    startDate: '2025-02-10',
    endDate: '2026-01-20',
    durationFormatted: '344 Days (~49 Weeks / 11.3 Months)',
    manager: 'David Sterling',
    designEngineer: 'Malarvannan M',
    mfgEngineer: 'Marcus Vance',
    qualityEngineer: 'Dr. Elena Rostova',
    procurementLead: 'Sarah Connor',
    budgetTotal: 450000,
    budgetSpent: 432000,
    engHoursTotal: 1800,
    engHoursSpent: 1790,
    targetRelease: 'Q1 2026',
    activeEcrs: 0,
    openNcrs: 0,
    cadModelsCount: 12,
    ebomPartCount: 34,
    description: 'Prepreg carbon fiber active wing with dual electro-hydraulic actuators.',
    teamMembers: [
      { employeeId: 'EMP-10042', name: 'David Sterling', role: 'Project Manager', department: 'Program Management Office', email: 'david.sterling@apexplm.io', avatar: '👔' },
      { employeeId: 'EMP-10088', name: 'Malarvannan M', role: 'Lead Design Engineer', department: 'Drivetrain & Mechanical Engineering', email: 'malarvannan.m@apexplm.io', avatar: '⚡' }
    ],
    tasks: []
  }
];

const initialBOM = {
  partId: 'PN-1001',
  projectId: 'PRJ-EV-001',
  rootNode: {
    id: 'BOM-1001-ROOT',
    partId: 'PN-1001',
    partNumber: 'PN-1001',
    name: 'Gen-3 EV Planetary Gearbox Assembly',
    revision: 'A.2',
    quantity: 1,
    unit: 'EA',
    material: 'Mixed Alloys Assembly',
    unitCost: 1450.00,
    weightKg: 24.5,
    carbonKgCO2: 38.2,
    stockStatus: 'In Stock',
    children: [
      {
        id: 'BOM-1001-01',
        partId: 'PN-1002',
        partNumber: 'PN-1002',
        name: 'Sun Gear Shaft 24T Direct Drive',
        revision: 'B.1',
        quantity: 1,
        unit: 'EA',
        material: 'AISI 8620 Case-Hardened Steel',
        unitCost: 125.00,
        weightKg: 2.3,
        carbonKgCO2: 5.1,
        stockStatus: 'In Stock',
        children: []
      },
      {
        id: 'BOM-1001-02',
        partId: 'PN-1003',
        partNumber: 'PN-1003',
        name: 'Planetary Gear 18T Set (3x)',
        revision: 'A.1',
        quantity: 3,
        unit: 'EA',
        material: 'Case-Hardened Steel 20MnCr5',
        unitCost: 85.00,
        weightKg: 1.2,
        carbonKgCO2: 2.8,
        stockStatus: 'In Stock',
        children: []
      },
      {
        id: 'BOM-1001-03',
        partId: 'PN-1004',
        partNumber: 'PN-1004',
        name: 'Annulus Internal Ring Gear 72T',
        revision: 'A.3',
        quantity: 1,
        unit: 'EA',
        material: 'AISI 4140 Quenched & Tempered',
        unitCost: 310.00,
        weightKg: 5.8,
        carbonKgCO2: 9.4,
        stockStatus: 'In Stock',
        children: []
      },
      {
        id: 'BOM-1001-04',
        partId: 'PN-1005',
        partNumber: 'PN-1005',
        name: 'High-Pressure Die-Cast Transmission Housing',
        revision: 'C.0',
        quantity: 1,
        unit: 'EA',
        material: 'A380 Die-Cast Aluminum',
        unitCost: 420.00,
        weightKg: 8.9,
        carbonKgCO2: 14.2,
        stockStatus: 'In Stock',
        children: []
      }
    ]
  }
};

const initialDocuments = [
  {
    docNumber: 'DOC-ENG-2026-001',
    title: 'Gen-3 EV Planetary Gearbox 2D GD&T Technical Drawing',
    type: '2D Drawing PDF',
    linkedPartId: 'PN-1001',
    projectId: 'PRJ-EV-001',
    revision: 'A.2',
    author: 'Alex Rivera, PE',
    uploadDate: '2026-02-14',
    fileSize: '4.2 MB',
    status: 'Approved',
    fileName: 'PN-1001_A2_Engineering_Drawing.pdf',
    category: 'pdf',
    description: 'Controlled ANSI Y14.5M tolerance blueprint and manufacturing surface finishes.'
  },
  {
    docNumber: 'DOC-ENG-2026-002',
    title: 'DFMEA Gear Tooth Bending & Contact Stress Analysis',
    type: 'DFMEA',
    linkedPartId: 'PN-1001',
    projectId: 'PRJ-EV-001',
    revision: 'B.0',
    author: 'Alex Rivera, PE',
    uploadDate: '2026-02-18',
    fileSize: '1.8 MB',
    status: 'Approved',
    fileName: 'PN-1001_DFMEA_Risk_Report.pdf',
    category: 'fmea',
    description: 'Design Failure Mode and Effects Analysis for 100,000 km durability target.'
  },
  {
    docNumber: 'DOC-ENG-2026-003',
    title: 'CMM Coordinate Metrology Inspection Protocol',
    type: 'Inspection Plan',
    linkedPartId: 'PN-1005',
    projectId: 'PRJ-EV-001',
    revision: 'A.1',
    author: 'Dr. Elena Rostova',
    uploadDate: '2026-03-01',
    fileSize: '2.1 MB',
    status: 'Approved',
    fileName: 'PN-1005_CMM_Quality_Plan.pdf',
    category: 'inspection',
    description: 'Inspection routines for Zeiss CMM machine and bearing bore concentricity.'
  }
];

const initialNCRs = [
  {
    ncrNumber: 'NCR-2026-042',
    title: 'CMM Sun Gear Pitch Diameter Out of Spec (+0.045mm)',
    description: 'Batch #8812 sun gear pitch diameter exceeded ISO 1328-1 Grade 6 tolerance limit.',
    severity: 'Major',
    status: 'Under Investigation',
    type: 'In-Process Machining',
    impactedPartId: 'PN-1002',
    impactedPartNumber: 'PN-1002',
    impactedPartName: 'Sun Gear Shaft 24T Direct Drive',
    projectId: 'PRJ-EV-001',
    projectName: 'Gen-3 EV Planetary Powertrain',
    defectCategory: 'Dimensional',
    rootCause: 'CNC Gear Hobber tool wear on carbide insert tooling.',
    containmentAction: 'Quarantined 240 units in Zone-C Quality Lockbox.',
    correctiveAction: 'Replace carbide tool inserts every 150 cycles.',
    loggedBy: 'Dr. Elena Rostova',
    assignedTo: 'Marcus Vance',
    dateLogged: '2026-03-10',
    targetClosureDate: '2026-03-24',
    costImpact: 4800,
    downtimeHours: 6.5,
    scrapQuantity: 12,
    disposition: 'Rework'
  }
];

const ensureInitialUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Bootstrapping initial PLM users with bcrypt encryption...');
      for (const u of initialUsers) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(u.password, salt);
        await User.create({
          ...u,
          passwordHash,
        });
      }
      console.log(`Bootstrapped ${initialUsers.length} system users successfully.`);
    }
  } catch (error) {
    console.error(`Error during user bootstrap: ${error.message}`);
  }
};

const seedDatabase = async () => {
  try {
    // 1. Seed Users
    await ensureInitialUsers();

    // 2. Seed Projects (Only when manual seed script is executed)
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      console.log('Seeding initial PLM projects into MongoDB...');
      await Project.insertMany(initialProjects);
      console.log(`Seeded ${initialProjects.length} projects successfully.`);
    }

    // 3. Seed BOM
    const bomCount = await BOM.countDocuments();
    if (bomCount === 0) {
      console.log('Seeding initial BOM hierarchies...');
      await BOM.create(initialBOM);
      console.log('Seeded BOM trees successfully.');
    }

    // 4. Seed Documents
    const docCount = await Document.countDocuments();
    if (docCount === 0) {
      console.log('Seeding engineering documents into vault...');
      await Document.insertMany(initialDocuments);
      console.log(`Seeded ${initialDocuments.length} documents successfully.`);
    }

    // 5. Seed NCRs
    const ncrCount = await NCR.countDocuments();
    if (ncrCount === 0) {
      console.log('Seeding Quality NCR records...');
      await NCR.insertMany(initialNCRs);
      console.log(`Seeded ${initialNCRs.length} NCRs successfully.`);
    }

    // 6. Seed AuditLog
    const logCount = await AuditLog.countDocuments();
    if (logCount === 0) {
      await AuditLog.create({
        user: 'System Admin',
        persona: 'admin',
        action: 'Database Initialization',
        category: 'SYSTEM',
        targetId: 'APEX-CLUSTER',
        details: 'ApexPLM MongoDB Atlas Central Database successfully provisioned and seeded.',
      });
      console.log('Audit log initialized.');
    }
  } catch (error) {
    console.error(`Error during database seeding: ${error.message}`);
  }
};

// If run directly via node seedData.js
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
  const connectDB = require('./db');
  connectDB().then(async () => {
    await seedDatabase();
    console.log('Seeding complete. Exiting.');
    process.exit(0);
  });
}

module.exports = { seedDatabase, ensureInitialUsers };

