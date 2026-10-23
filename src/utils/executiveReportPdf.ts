import { jsPDF } from 'jspdf';
import type { PartItem, ECN, QualityNCR, Supplier, Project } from '../types/plm';

export interface ExecutiveReportOptions {
  reportType: 'bom' | 'ecn' | 'quality' | 'supplier' | 'project';
  parts: PartItem[];
  ecns: ECN[];
  ncrs: QualityNCR[];
  suppliers: Supplier[];
  projects: Project[];
  generatedBy?: string;
  reportDate?: string;
}

export function generateExecutiveReportPdf(options: ExecutiveReportOptions): { blob: Blob; filename: string } {
  const {
    reportType,
    parts,
    ecns,
    ncrs,
    suppliers,
    projects,
    generatedBy = 'Engineering Lead',
    reportDate = new Date().toISOString().split('T')[0]
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const contentW = pageW - margin * 2; // 277mm

  const reportConfigs = {
    bom: {
      title: 'BOM & PART MASTER EXECUTIVE SUMMARY',
      id: 'REP-2026-001',
      filename: `ApexPLM_BOM_Part_Master_Report_${reportDate}.pdf`
    },
    ecn: {
      title: 'ENGINEERING CHANGE NOTICE AUDIT LOG',
      id: 'REP-2026-002',
      filename: `ApexPLM_ECN_Audit_Report_${reportDate}.pdf`
    },
    quality: {
      title: 'ISO 9001 QUALITY & NON-CONFORMANCE (NCR) SUMMARY',
      id: 'REP-2026-003',
      filename: `ApexPLM_ISO_Quality_NCR_Report_${reportDate}.pdf`
    },
    supplier: {
      title: 'APPROVED SUPPLIER & VENDOR AUDIT SCORECARD',
      id: 'REP-2026-004',
      filename: `ApexPLM_Supplier_Performance_Report_${reportDate}.pdf`
    },
    project: {
      title: 'ENTERPRISE PROJECT PORTFOLIO & STAGE-GATE SUMMARY',
      id: 'REP-2026-005',
      filename: `ApexPLM_Project_Portfolio_Report_${reportDate}.pdf`
    }
  };

  const config = reportConfigs[reportType];
  let currentPage = 1;

  // Header Renderer
  const renderHeader = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Outer Border
    doc.setLineWidth(0.4);
    doc.setDrawColor(15, 23, 42);
    doc.rect(margin, margin, contentW, pageH - margin * 2);

    // Title Block Area
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, margin, contentW, 24, 'FD');
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 24, margin + contentW, margin + 24);

    // Left Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('APEXPLM STUDIO', margin + 5, margin + 8);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Enterprise Mechanical Product Lifecycle Platform', margin + 5, margin + 13);
    doc.text('ENTERPRISE EXECUTIVE REPORT', margin + 5, margin + 17);

    // Center Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(config.title, margin + 80, margin + 8);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`REPORT ID: ${config.id}`, margin + 80, margin + 14);
    doc.text(`GENERATED: ${reportDate}`, margin + 140, margin + 14);
    doc.text(`PREPARED BY: ${generatedBy}`, margin + 80, margin + 19);
    doc.text(`STATUS: APPROVED / OFFICIAL AUDIT`, margin + 140, margin + 19);

    // Right Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ISO 9001:2015 AUDIT', margin + contentW - 50, margin + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Confidential Engineering Release', margin + contentW - 50, margin + 14);
    doc.text('Data Source: ApexPLM Database', margin + contentW - 50, margin + 18);
  };

  // Footer Renderer
  const renderFooter = (pageNo: number, total: number) => {
    const fy = pageH - margin - 4;
    doc.setLineWidth(0.25);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, fy - 2, margin + contentW, fy - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('APEXPLM STUDIO • CONFIDENTIAL & PROPRIETARY EXECUTIVE AUDIT DOCUMENT', margin + 4, fy + 1.5);
    doc.text(`Report ID: ${config.id} | Generated: ${reportDate}`, pageW / 2, fy + 1.5, { align: 'center' });
    doc.text(`Page ${pageNo} of ${total}`, margin + contentW - 15, fy + 1.5, { align: 'right' });
  };

  // 1. BOM Report
  if (reportType === 'bom') {
    const cols = [
      { label: 'PART NUMBER', w: 32, align: 'left' },
      { label: 'NAME', w: 68, align: 'left' },
      { label: 'REV', w: 14, align: 'center' },
      { label: 'TYPE', w: 28, align: 'left' },
      { label: 'CATEGORY', w: 35, align: 'left' },
      { label: 'MATERIAL', w: 55, align: 'left' },
      { label: 'WEIGHT (KG)', w: 22, align: 'right' },
      { label: 'EST. COST ($)', w: 23, align: 'right' }
    ];

    const rowsPerPage = 12;
    const totalPages = Math.ceil(parts.length / rowsPerPage) || 1;

    renderHeader();
    let tableY = margin + 27;

    const renderTableHeader = (y: number) => {
      doc.setFillColor(235, 240, 245);
      doc.rect(margin, y, contentW, 7, 'FD');
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y + 7, margin + contentW, y + 7);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      cols.forEach((col) => {
        const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 2 : curX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        doc.line(curX + col.w, y, curX + col.w, y + 7);
        curX += col.w;
      });
    };

    renderTableHeader(tableY);
    tableY += 7;

    parts.forEach((p, idx) => {
      if (tableY + 10 > pageH - margin - 12) {
        renderFooter(currentPage, totalPages);
        doc.addPage('a4', 'landscape');
        currentPage++;
        renderHeader();
        tableY = margin + 27;
        renderTableHeader(tableY);
        tableY += 7;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 254);
        doc.rect(margin, tableY, contentW, 10, 'F');
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, tableY + 10, margin + contentW, tableY + 10);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(2, 132, 199);
      doc.text(p.partNumber, curX + 2, tableY + 6);
      curX += 32;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const nameLines = doc.splitTextToSize(p.name, 64);
      doc.text(nameLines.slice(0, 2), curX + 2, tableY + 5);
      curX += 68;

      doc.text(p.currentRev, curX + 7, tableY + 6, { align: 'center' });
      curX += 14;

      doc.text(p.type, curX + 2, tableY + 6);
      curX += 28;

      doc.text(p.category, curX + 2, tableY + 6);
      curX += 35;

      const matLines = doc.splitTextToSize(p.material, 52);
      doc.text(matLines.slice(0, 2), curX + 2, tableY + 5);
      curX += 55;

      doc.text(p.weightKg.toFixed(2), curX + 20, tableY + 6, { align: 'right' });
      curX += 22;

      doc.setFont('helvetica', 'bold');
      doc.text(`$${p.estimatedCost.toFixed(2)}`, curX + 21, tableY + 6, { align: 'right' });

      tableY += 10;
    });

    renderFooter(currentPage, totalPages);
  }

  // 2. ECN Report
  else if (reportType === 'ecn') {
    const cols = [
      { label: 'ECN ID', w: 32, align: 'left' },
      { label: 'TITLE & CHANGE REASON', w: 90, align: 'left' },
      { label: 'TARGET PART', w: 35, align: 'left' },
      { label: 'STAGE', w: 40, align: 'center' },
      { label: 'REVISION BUMP', w: 35, align: 'center' },
      { label: 'RISK SCORE', w: 45, align: 'right' }
    ];

    const totalPages = Math.ceil(ecns.length / 12) || 1;
    renderHeader();
    let tableY = margin + 27;

    const renderTableHeader = (y: number) => {
      doc.setFillColor(235, 240, 245);
      doc.rect(margin, y, contentW, 7, 'FD');
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y + 7, margin + contentW, y + 7);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      cols.forEach((col) => {
        const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 2 : curX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        doc.line(curX + col.w, y, curX + col.w, y + 7);
        curX += col.w;
      });
    };

    renderTableHeader(tableY);
    tableY += 7;

    ecns.forEach((e, idx) => {
      if (tableY + 10 > pageH - margin - 12) {
        renderFooter(currentPage, totalPages);
        doc.addPage('a4', 'landscape');
        currentPage++;
        renderHeader();
        tableY = margin + 27;
        renderTableHeader(tableY);
        tableY += 7;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 254);
        doc.rect(margin, tableY, contentW, 10, 'F');
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, tableY + 10, margin + contentW, tableY + 10);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(217, 119, 6);
      doc.text(e.id, curX + 2, tableY + 6);
      curX += 32;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(e.title, 86);
      doc.text(titleLines.slice(0, 2), curX + 2, tableY + 5);
      curX += 90;

      doc.text(e.targetPartId, curX + 2, tableY + 6);
      curX += 35;

      doc.text(e.pipelineStage, curX + 20, tableY + 6, { align: 'center' });
      curX += 40;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(`${e.fromRevision} → ${e.toRevision}`, curX + 17.5, tableY + 6, { align: 'center' });
      curX += 35;

      doc.setTextColor(15, 23, 42);
      doc.text(`${e.riskScore} / 100`, curX + 43, tableY + 6, { align: 'right' });

      tableY += 10;
    });

    renderFooter(currentPage, totalPages);
  }

  // 3. Quality / NCR Report
  else if (reportType === 'quality') {
    const cols = [
      { label: 'NCR NUMBER', w: 35, align: 'left' },
      { label: 'TITLE & DEFECT DESCRIPTION', w: 90, align: 'left' },
      { label: 'LINKED PART ID', w: 38, align: 'left' },
      { label: 'SEVERITY', w: 32, align: 'center' },
      { label: 'DEFECT CATEGORY', w: 45, align: 'left' },
      { label: 'STATUS', w: 37, align: 'right' }
    ];

    const totalPages = Math.ceil(ncrs.length / 12) || 1;
    renderHeader();
    let tableY = margin + 27;

    const renderTableHeader = (y: number) => {
      doc.setFillColor(235, 240, 245);
      doc.rect(margin, y, contentW, 7, 'FD');
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y + 7, margin + contentW, y + 7);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      cols.forEach((col) => {
        const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 2 : curX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        doc.line(curX + col.w, y, curX + col.w, y + 7);
        curX += col.w;
      });
    };

    renderTableHeader(tableY);
    tableY += 7;

    ncrs.forEach((n, idx) => {
      if (tableY + 10 > pageH - margin - 12) {
        renderFooter(currentPage, totalPages);
        doc.addPage('a4', 'landscape');
        currentPage++;
        renderHeader();
        tableY = margin + 27;
        renderTableHeader(tableY);
        tableY += 7;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 254);
        doc.rect(margin, tableY, contentW, 10, 'F');
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, tableY + 10, margin + contentW, tableY + 10);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(225, 29, 72);
      doc.text(n.ncrNumber, curX + 2, tableY + 6);
      curX += 35;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(n.title, 86);
      doc.text(titleLines.slice(0, 2), curX + 2, tableY + 5);
      curX += 90;

      doc.text(n.linkedPartId, curX + 2, tableY + 6);
      curX += 38;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(n.severity === 'Critical' ? 225 : 217, n.severity === 'Critical' ? 29 : 119, n.severity === 'Critical' ? 72 : 6);
      doc.text(n.severity, curX + 16, tableY + 6, { align: 'center' });
      curX += 32;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(n.defectCategory || n.ncrType || 'General Defect', curX + 2, tableY + 6);
      curX += 45;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(n.status, curX + 35, tableY + 6, { align: 'right' });

      tableY += 10;
    });

    renderFooter(currentPage, totalPages);
  }

  // 4. Supplier / Vendor Report
  else if (reportType === 'supplier') {
    const cols = [
      { label: 'SUPPLIER NAME', w: 60, align: 'left' },
      { label: 'CATEGORY & COMMODITY', w: 55, align: 'left' },
      { label: 'RATING', w: 25, align: 'center' },
      { label: 'QUALITY SCORE', w: 35, align: 'center' },
      { label: 'ON-TIME DELIVERY', w: 40, align: 'center' },
      { label: 'STATUS', w: 62, align: 'right' }
    ];

    const totalPages = Math.ceil(suppliers.length / 12) || 1;
    renderHeader();
    let tableY = margin + 27;

    const renderTableHeader = (y: number) => {
      doc.setFillColor(235, 240, 245);
      doc.rect(margin, y, contentW, 7, 'FD');
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y + 7, margin + contentW, y + 7);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      cols.forEach((col) => {
        const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 2 : curX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        doc.line(curX + col.w, y, curX + col.w, y + 7);
        curX += col.w;
      });
    };

    renderTableHeader(tableY);
    tableY += 7;

    suppliers.forEach((s, idx) => {
      if (tableY + 10 > pageH - margin - 12) {
        renderFooter(currentPage, totalPages);
        doc.addPage('a4', 'landscape');
        currentPage++;
        renderHeader();
        tableY = margin + 27;
        renderTableHeader(tableY);
        tableY += 7;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 254);
        doc.rect(margin, tableY, contentW, 10, 'F');
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, tableY + 10, margin + contentW, tableY + 10);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text(s.name, curX + 2, tableY + 6);
      curX += 60;

      doc.setFont('helvetica', 'normal');
      doc.text(s.category, curX + 2, tableY + 6);
      curX += 55;

      doc.text((s.ratingScore ?? 4.8).toFixed(1) + ' ★', curX + 12.5, tableY + 6, { align: 'center' });
      curX += 25;

      doc.text(`${s.qualityScorePpm ?? 99.2} PPM`, curX + 17.5, tableY + 6, { align: 'center' });
      curX += 35;

      doc.text(`${s.deliveryScorePercent ?? 98.5}%`, curX + 20, tableY + 6, { align: 'center' });
      curX += 40;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(s.status === 'Approved' ? 5 : 217, s.status === 'Approved' ? 150 : 119, s.status === 'Approved' ? 105 : 6);
      doc.text(s.status, curX + 60, tableY + 6, { align: 'right' });

      tableY += 10;
    });

    renderFooter(currentPage, totalPages);
  }

  // 5. Project Portfolio Report
  else if (reportType === 'project') {
    const cols = [
      { label: 'PROJECT CODE & NAME', w: 75, align: 'left' },
      { label: 'MANAGER', w: 40, align: 'left' },
      { label: 'PROGRESS', w: 32, align: 'center' },
      { label: 'BUDGET TOTAL', w: 35, align: 'right' },
      { label: 'BUDGET SPENT', w: 35, align: 'right' },
      { label: 'ENG HOURS', w: 30, align: 'center' },
      { label: 'STATUS', w: 30, align: 'right' }
    ];

    const totalPages = Math.ceil(projects.length / 12) || 1;
    renderHeader();
    let tableY = margin + 27;

    const renderTableHeader = (y: number) => {
      doc.setFillColor(235, 240, 245);
      doc.rect(margin, y, contentW, 7, 'FD');
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y + 7, margin + contentW, y + 7);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      cols.forEach((col) => {
        const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 2 : curX + 2;
        doc.text(col.label, textX, y + 4.8, { align: col.align as any });
        doc.line(curX + col.w, y, curX + col.w, y + 7);
        curX += col.w;
      });
    };

    renderTableHeader(tableY);
    tableY += 7;

    projects.forEach((pr, idx) => {
      if (tableY + 10 > pageH - margin - 12) {
        renderFooter(currentPage, totalPages);
        doc.addPage('a4', 'landscape');
        currentPage++;
        renderHeader();
        tableY = margin + 27;
        renderTableHeader(tableY);
        tableY += 7;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(250, 252, 254);
        doc.rect(margin, tableY, contentW, 10, 'F');
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, tableY + 10, margin + contentW, tableY + 10);

      let curX = margin;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text(`${pr.code}: ${pr.name}`.substring(0, 48), curX + 2, tableY + 6);
      curX += 75;

      doc.setFont('helvetica', 'normal');
      doc.text(pr.manager, curX + 2, tableY + 6);
      curX += 40;

      doc.text(`${pr.completionPercent}%`, curX + 16, tableY + 6, { align: 'center' });
      curX += 32;

      doc.text(`$${(pr.budgetTotal / 1000).toFixed(0)}k`, curX + 33, tableY + 6, { align: 'right' });
      curX += 35;

      doc.text(`$${(pr.budgetSpent / 1000).toFixed(0)}k`, curX + 33, tableY + 6, { align: 'right' });
      curX += 35;

      doc.text(`${pr.engHoursSpent} / ${pr.engHoursTotal}h`, curX + 15, tableY + 6, { align: 'center' });
      curX += 30;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(pr.status, curX + 28, tableY + 6, { align: 'right' });

      tableY += 10;
    });

    renderFooter(currentPage, totalPages);
  }

  const blob = doc.output('blob');
  return { blob, filename: config.filename };
}
