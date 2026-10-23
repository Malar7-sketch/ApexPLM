const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Part = require('../models/Part');
const BOM = require('../models/BOM');
const Document = require('../models/Document');
const NCR = require('../models/NCR');
const AuditLog = require('../models/AuditLog');

// Confirmed dummy identifiers from seed scripts
const DUMMY_PROJECT_CODES = ['PRJ-EV-001', 'PRJ-EV-002', 'PRJ-EV-003'];
const DUMMY_PART_NUMBERS = [
  'ASM-EV-9000', 'ASM-CAR-510', 'PN-PGR-511', 'PN-RNG-512', 'HSG-EV-901',
  'PN-1001', 'PN-1002', 'PN-1003', 'PN-1004', 'PN-1005'
];
const DUMMY_DOCUMENT_NUMBERS = [
  'DWG-GBX-5000-01', 'CAD-GBX-5000-01', 'SPEC-GBX-5000-A', 'DFMEA-2026-088',
  'CAD-PRT-1004-03', 'INSP-FAIR-902', 'CERT-ENV-2026-04', 'SOW-SC-2026-11',
  'DOC-ENG-2026-001', 'DOC-ENG-2026-002', 'DOC-ENG-2026-003',
  'DOC-101', 'DOC-102', 'DOC-103', 'DOC-104', 'DOC-105', 'DOC-106', 'DOC-107', 'DOC-108'
];
const DUMMY_NCR_NUMBERS = ['NCR-2026-042', 'NCR-2026-088', 'NCR-2026-091', 'NCR-2026-104'];

/**
 * Safely audit and clean confirmed dummy records without deleting genuine user data
 */
const cleanConfirmedDummyData = async () => {
  const summary = {
    backupPath: null,
    deleted: {
      projects: 0,
      parts: 0,
      boms: 0,
      documents: 0,
      ncrs: 0,
      auditLogs: 0,
    },
    preserved: {
      users: 0,
      userProjects: 0,
      userParts: 0,
      userDocuments: 0,
      userNcrs: 0,
    }
  };

  try {
    // 1. Audit Projects
    const dummyProjects = await Project.find({
      $or: [
        { code: { $in: DUMMY_PROJECT_CODES } },
        { name: { $in: ['Gen-3 EV Planetary Powertrain', 'Modular 800V High-Density Battery Pack', 'Active Aerodynamic Rear Wing & Diffuser'] } }
      ]
    });
    const genuineProjectsCount = await Project.countDocuments({
      code: { $nin: DUMMY_PROJECT_CODES },
      name: { $nin: ['Gen-3 EV Planetary Powertrain', 'Modular 800V High-Density Battery Pack', 'Active Aerodynamic Rear Wing & Diffuser'] }
    });
    summary.preserved.userProjects = genuineProjectsCount;

    // 2. Audit Parts
    const dummyParts = await Part.find({
      $or: [
        { partNumber: { $in: DUMMY_PART_NUMBERS } },
        { id: { $in: DUMMY_PART_NUMBERS } }
      ]
    });
    summary.preserved.userParts = await Part.countDocuments({
      partNumber: { $nin: DUMMY_PART_NUMBERS },
      id: { $nin: DUMMY_PART_NUMBERS }
    });

    // 3. Audit BOMs
    const dummyBoms = await BOM.find({
      $or: [
        { partId: { $in: ['PN-1001', 'ASM-EV-9000'] } },
        { projectId: { $in: DUMMY_PROJECT_CODES } }
      ]
    });

    // 4. Audit Documents
    const dummyDocs = await Document.find({
      $or: [
        { docNumber: { $in: DUMMY_DOCUMENT_NUMBERS } },
        { id: { $in: DUMMY_DOCUMENT_NUMBERS } }
      ]
    });
    summary.preserved.userDocuments = await Document.countDocuments({
      docNumber: { $nin: DUMMY_DOCUMENT_NUMBERS },
      id: { $nin: DUMMY_DOCUMENT_NUMBERS }
    });

    // 5. Audit NCRs
    const dummyNcrs = await NCR.find({
      ncrNumber: { $in: DUMMY_NCR_NUMBERS }
    });
    summary.preserved.userNcrs = await NCR.countDocuments({
      ncrNumber: { $nin: DUMMY_NCR_NUMBERS }
    });

    // 6. Audit Logs (initial seed log)
    const dummyLogs = await AuditLog.find({
      targetId: 'APEX-CLUSTER',
      action: 'Database Initialization'
    });

    // Total dummy records to back up
    const backupData = {
      timestamp: new Date().toISOString(),
      dummyProjects,
      dummyParts,
      dummyBoms,
      dummyDocs,
      dummyNcrs,
      dummyLogs
    };

    // Save backup before deletion
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFile = path.join(backupDir, `dummy_data_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    summary.backupPath = backupFile;
    console.log(`[Clean PLM] Backed up ${dummyProjects.length} projects, ${dummyParts.length} parts, ${dummyBoms.length} BOMs, ${dummyDocs.length} docs, ${dummyNcrs.length} NCRs to: ${backupFile}`);

    // 7. Perform Safe Deletion of ONLY confirmed dummy records
    if (dummyProjects.length > 0) {
      const res = await Project.deleteMany({ _id: { $in: dummyProjects.map(p => p._id) } });
      summary.deleted.projects = res.deletedCount;
    }

    if (dummyParts.length > 0) {
      const res = await Part.deleteMany({ _id: { $in: dummyParts.map(p => p._id) } });
      summary.deleted.parts = res.deletedCount;
    }

    if (dummyBoms.length > 0) {
      const res = await BOM.deleteMany({ _id: { $in: dummyBoms.map(b => b._id) } });
      summary.deleted.boms = res.deletedCount;
    }

    if (dummyDocs.length > 0) {
      const res = await Document.deleteMany({ _id: { $in: dummyDocs.map(d => d._id) } });
      summary.deleted.documents = res.deletedCount;
    }

    if (dummyNcrs.length > 0) {
      const res = await NCR.deleteMany({ _id: { $in: dummyNcrs.map(n => n._id) } });
      summary.deleted.ncrs = res.deletedCount;
    }

    if (dummyLogs.length > 0) {
      const res = await AuditLog.deleteMany({ _id: { $in: dummyLogs.map(l => l._id) } });
      summary.deleted.auditLogs = res.deletedCount;
    }

    console.log('[Clean PLM] Cleanup completed successfully:', JSON.stringify(summary, null, 2));
    return summary;

  } catch (error) {
    console.error(`[Clean PLM Error] ${error.message}`);
    throw error;
  }
};

// If run directly via CLI: node cleanDummyData.js
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  const connectDB = require('./db');
  connectDB().then(async () => {
    console.log('[Clean PLM] Connected to MongoDB Atlas. Executing cleanup...');
    const result = await cleanConfirmedDummyData();
    console.log('[Clean PLM] Finished:', result);
    process.exit(0);
  }).catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
}

module.exports = { cleanConfirmedDummyData };
