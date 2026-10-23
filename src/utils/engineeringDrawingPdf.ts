import { jsPDF } from 'jspdf';
import type { PartItem, BOMNode } from '../types/plm';

export interface DrawingPdfOptions {
  part: PartItem;
  revision?: string;
  bomTree?: BOMNode;
  projectionAngle?: 'third' | 'first';
  authorName?: string;
  checkerName?: string;
  approverName?: string;
}

/**
 * Clean revision string for file naming (e.g., "Rev A.4" -> "A4")
 */
export function sanitizeRevName(rev: string): string {
  if (!rev) return '0.0';
  // Strip redundant leading "Rev" or "Rev." or "Rev-"
  const cleaned = rev.replace(/^rev[\s._-]*/i, '').trim();
  const safe = cleaned.replace(/[^a-zA-Z0-9._-]/g, '');
  return safe || '0.0';
}

/**
 * Generate standard drawing number for a part
 */
export function getDrawingNumber(partNumber: string): string {
  if (partNumber.startsWith('DWG-')) return partNumber;
  return `DWG-${partNumber}`;
}

/**
 * Helper to draw a dashed line in jsPDF
 */
function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, dashLen = 2, gapLen = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const ux = dx / len;
  const uy = dy / len;
  let curr = 0;
  let draw = true;
  while (curr < len) {
    const step = draw ? dashLen : gapLen;
    const next = Math.min(curr + step, len);
    if (draw) {
      doc.line(x1 + ux * curr, y1 + uy * curr, x1 + ux * next, y1 + uy * next);
    }
    curr = next;
    draw = !draw;
  }
}

/**
 * Draw Centerline (Long dash - dot - Long dash)
 */
function drawCenterLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;
  const ux = dx / len;
  const uy = dy / len;
  
  let curr = 0;
  while (curr < len) {
    // Long dash (4mm)
    const l1 = Math.min(curr + 4, len);
    doc.line(x1 + ux * curr, y1 + uy * curr, x1 + ux * l1, y1 + uy * l1);
    curr = l1 + 1; // Gap (1mm)
    if (curr >= len) break;

    // Dot (0.5mm)
    const d1 = Math.min(curr + 0.5, len);
    doc.line(x1 + ux * curr, y1 + uy * curr, x1 + ux * d1, y1 + uy * d1);
    curr = d1 + 1; // Gap (1mm)
  }
}

/**
 * Draw Projection Symbol (Cone & Concentric Circles) inside a dedicated box
 */
function drawProjectionSymbol(doc: jsPDF, cx: number, cy: number, type: 'first' | 'third') {
  doc.setLineWidth(0.25);
  doc.setDrawColor(15, 23, 42); // slate-900

  // Concentric Circles
  doc.circle(cx - 7, cy, 2.5, 'S');
  doc.circle(cx - 7, cy, 5, 'S');

  // Frustum Cone
  if (type === 'third') {
    doc.line(cx + 2, cy - 2.5, cx + 2, cy + 2.5);
    doc.line(cx + 10, cy - 5, cx + 10, cy + 5);
    doc.line(cx + 2, cy - 2.5, cx + 10, cy - 5);
    doc.line(cx + 2, cy + 2.5, cx + 10, cy + 5);
  } else {
    doc.line(cx - 2, cy - 5, cx - 2, cy + 5);
    doc.line(cx - 10, cy - 2.5, cx - 10, cy + 2.5);
    doc.line(cx - 2, cy - 5, cx - 10, cy - 2.5);
    doc.line(cx - 2, cy + 5, cx - 10, cy + 2.5);
  }

  // Center axes
  doc.setLineWidth(0.15);
  doc.setDrawColor(100, 116, 139);
  doc.line(cx - 14, cy, cx + 14, cy);
  doc.line(cx - 7, cy - 6.5, cx - 7, cy + 6.5);
}

/**
 * Draw Balloon Callout
 */
function drawBalloonCallout(doc: jsPDF, itemNo: number, x: number, y: number, targetX: number, targetY: number) {
  doc.setLineWidth(0.2);
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(255, 255, 255);

  // Pointer line
  doc.line(x, y, targetX, targetY);
  doc.circle(targetX, targetY, 0.5, 'FD');

  // Balloon circle
  doc.circle(x, y, 3.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(itemNo), x, y + 0.9, { align: 'center' });
}

/**
 * Main PDF Export Generator Function
 */
export async function generateEngineeringDrawingPdf(options: DrawingPdfOptions): Promise<{ blob: Blob; filename: string }> {
  const {
    part,
    revision: userRev,
    bomTree,
    projectionAngle = 'third',
    authorName = part.createdBy || 'Lead Design Engineer',
    checkerName = 'Engineering Reviewer',
    approverName = 'Chief Approver'
  } = options;

  const targetRev = userRev || part.currentRev || 'Rev 00';
  const cleanRev = sanitizeRevName(targetRev);
  const drawingNo = getDrawingNumber(part.partNumber);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${part.partNumber}_Rev_${cleanRev}_Drawing.pdf`;

  // Create A3 Landscape Document (420mm x 297mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });

  const pageW = 420;
  const pageH = 297;
  const totalSheets = 2;

  // Strict A3 Margins & Inner Frame
  const innerX = 20; // 20mm left margin for binding
  const innerY = 15; // 15mm top
  const innerW = 385; // 385mm width (leaves 15mm right margin)
  const innerH = 269; // 269mm height (leaves 13mm bottom margin)

  // Flatten BOM list for table
  const bomList: { item: number; partNo: string; name: string; qty: number; mat: string }[] = [];
  if (bomTree && bomTree.children && bomTree.children.length > 0) {
    bomTree.children.forEach((child, idx) => {
      bomList.push({
        item: idx + 1,
        partNo: child.partNumber,
        name: child.name,
        qty: child.quantity,
        mat: child.material || 'Standard Alloy'
      });
    });
  } else {
    bomList.push(
      { item: 1, partNo: part.partNumber, name: part.name, qty: 1, mat: part.material },
      { item: 2, partNo: 'PN-FAS-102', name: 'M8x25 Hex Flange Screw ISO 4017', qty: 6, mat: 'Class 10.9 Steel' },
      { item: 3, partNo: 'PN-WSH-08', name: 'M8 Spring Lock Washer DIN 127', qty: 6, mat: 'Spring Steel' },
      { item: 4, partNo: 'PN-BRG-6204', name: 'Deep Groove Ball Bearing 6204-2RS', qty: 2, mat: 'Chrome Steel 52100' }
    );
  }

  // Common sheet border & title block function
  const renderSheetFrame = (sheetNo: number) => {
    // 1. Pure White Background for Entire Page
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // 2. Outer Border (10mm margins)
    doc.setLineWidth(0.35);
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.rect(10, 10, pageW - 20, pageH - 20, 'S');

    // 3. Inner Drawing Border (Thicker standard line)
    doc.setLineWidth(0.7);
    doc.rect(innerX, innerY, innerW, innerH, 'S');

    // 4. Zone References (Grid Numbers 1-8 Top/Bottom, Letters A-D Left/Right)
    const colWidth = innerW / 8;
    const zoneNums = ['1', '2', '3', '4', '5', '6', '7', '8'];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    zoneNums.forEach((num, i) => {
      const zx = innerX + i * colWidth + colWidth / 2;
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      // Top ticks
      doc.line(innerX + (i + 1) * colWidth, 10, innerX + (i + 1) * colWidth, 15);
      doc.text(num, zx, 13.5, { align: 'center' });

      // Bottom ticks
      doc.line(innerX + (i + 1) * colWidth, innerY + innerH, innerX + (i + 1) * colWidth, pageH - 10);
      doc.text(num, zx, pageH - 11.5, { align: 'center' });
    });

    const rowHeight = innerH / 4;
    const zoneLetters = ['A', 'B', 'C', 'D'];
    zoneLetters.forEach((lettr, j) => {
      const zy = innerY + j * rowHeight + rowHeight / 2;
      doc.setLineWidth(0.25);
      doc.setDrawColor(15, 23, 42);
      // Left ticks
      doc.line(10, innerY + (j + 1) * rowHeight, 20, innerY + (j + 1) * rowHeight);
      doc.text(lettr, 15, zy + 1, { align: 'center' });

      // Right ticks
      doc.line(innerX + innerW, innerY + (j + 1) * rowHeight, pageW - 10, innerY + (j + 1) * rowHeight);
      doc.text(lettr, pageW - 13, zy + 1, { align: 'center' });
    });

    // ==========================================
    // 5. STRUCTURED TITLE BLOCK (Bottom-Right)
    // ==========================================
    const tbW = 175;
    const tbH = 48;
    const tbX = innerX + innerW - tbW; // 230
    const tbY = innerY + innerH - tbH; // 236

    // Title Block Background (Pure White) & Outer Border
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.setDrawColor(15, 23, 42);
    doc.rect(tbX, tbY, tbW, tbH, 'FD');

    // Horizontal Dividers
    doc.setLineWidth(0.3);
    doc.line(tbX, tbY + 16, tbX + tbW, tbY + 16); // Row 1 / Row 2
    doc.line(tbX, tbY + 28, tbX + tbW, tbY + 28); // Row 2 / Row 3

    // Vertical Dividers Row 1
    doc.line(tbX + 55, tbY, tbX + 55, tbY + 16);
    doc.line(tbX + 120, tbY, tbX + 120, tbY + 16);

    // Vertical Dividers Row 2
    doc.line(tbX + 55, tbY + 16, tbX + 55, tbY + 28);
    doc.line(tbX + 90, tbY + 16, tbX + 90, tbY + 28);
    doc.line(tbX + 120, tbY + 16, tbX + 120, tbY + 28);
    doc.line(tbX + 155, tbY + 16, tbX + 155, tbY + 28);

    // Vertical Dividers Row 3
    doc.line(tbX + 60, tbY + 28, tbX + 60, tbY + 48);
    doc.line(tbX + 115, tbY + 28, tbX + 115, tbY + 48);

    // --- ROW 1 CONTENT ---
    // Cell 1: Company Logo / Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('APEXPLM STUDIO', tbX + 3, tbY + 6);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('AUTOMOTIVE & AEROSPACE', tbX + 3, tbY + 10);
    doc.text('ENGINEERING SYSTEMS', tbX + 3, tbY + 13.5);

    // Cell 2: Title (Wrapped cleanly in 60mm)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('TITLE:', tbX + 57, tbY + 4);

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(part.name.toUpperCase(), 60);
    doc.text(titleLines.slice(0, 2), tbX + 57, tbY + 8.5);

    // Cell 3: Part No & Drawing No
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('PART NO:', tbX + 122, tbY + 4);
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(part.partNumber, tbX + 122, tbY + 7.5);

    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('DWG NO:', tbX + 122, tbY + 11.5);
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(drawingNo, tbX + 122, tbY + 14.5);

    // --- ROW 2 CONTENT ---
    // Cell 1: Material
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('MATERIAL:', tbX + 3, tbY + 19.5);
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    const matLines = doc.splitTextToSize(part.material || 'Aluminium 7075-T6', 50);
    doc.text(matLines[0] || 'Aluminium 7075-T6', tbX + 3, tbY + 24.5);

    // Cell 2: Finish
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('FINISH:', tbX + 57, tbY + 19.5);
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AS MACHINED / ANOD', tbX + 57, tbY + 24.5);

    // Cell 3: Scale & Units
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('SCALE / UNITS:', tbX + 92, tbY + 19.5);
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('1:2.5  (mm)', tbX + 92, tbY + 24.5);

    // Cell 4: Tolerance Standard
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOLERANCE:', tbX + 122, tbY + 19.5);
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ISO 2768-mK', tbX + 122, tbY + 24.5);

    // Cell 5: Revision
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text('REV:', tbX + 157, tbY + 19.5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(targetRev, tbX + 157, tbY + 25);

    // --- ROW 3 CONTENT ---
    // Cell 1: Signatures & Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`DRAWN: ${authorName}`, tbX + 3, tbY + 33);
    doc.text(`CHECKED: ${checkerName}`, tbX + 3, tbY + 38);
    doc.text(`APPROVED: ${approverName}`, tbX + 3, tbY + 43);
    doc.text(`DATE: ${dateStr}`, tbX + 3, tbY + 47);

    // Cell 2: Dedicated Projection Symbol Cell
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      projectionAngle === 'third' ? 'THIRD ANGLE PROJECTION' : 'FIRST ANGLE PROJECTION',
      tbX + 87.5,
      tbY + 32,
      { align: 'center' }
    );
    drawProjectionSymbol(doc, tbX + 87.5, tbY + 40, projectionAngle);

    // Cell 3: Sheet Information
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('SHEET SIZE: A3 LANDSCAPE', tbX + 118, tbY + 33);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`SHEET ${sheetNo} OF ${totalSheets}`, tbX + 118, tbY + 40);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('ASME Y14.5M / ISO STANDARD', tbX + 118, tbY + 45);

    // ==========================================
    // 6. REVISION TABLE (Top-Right)
    // ==========================================
    const revW = 150;
    const revH = 24;
    const revX = innerX + innerW - revW; // 255
    const revY = innerY; // 15

    // Outer box (White)
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.setDrawColor(15, 23, 42);
    doc.rect(revX, revY, revW, revH, 'FD');

    // Header Background (Very light gray tint)
    doc.setFillColor(245, 247, 250);
    doc.rect(revX, revY, revW, 6, 'FD');

    // Column Dividers
    doc.setLineWidth(0.25);
    doc.line(revX + 16, revY, revX + 16, revY + revH);
    doc.line(revX + 90, revY, revX + 90, revY + revH);
    doc.line(revX + 118, revY, revX + 118, revY + revH);

    // Row Dividers
    doc.line(revX, revY + 6, revX + revW, revY + 6);
    doc.line(revX, revY + 12, revX + revW, revY + 12);
    doc.line(revX, revY + 18, revX + revW, revY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 23, 42);
    doc.text('REV', revX + 3, revY + 4.2);
    doc.text('REVISION DESCRIPTION', revX + 19, revY + 4.2);
    doc.text('DATE', revX + 93, revY + 4.2);
    doc.text('APPROVED', revX + 121, revY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    const revHist = (part.revisionHistory && part.revisionHistory.length > 0)
      ? part.revisionHistory.map(r => ({
          revId: r.revision || 'Rev 00',
          date: r.releaseDate || dateStr,
          author: r.author || authorName,
          changeSummary: r.changeDescription || 'Engineering Revision',
          status: r.status || 'Released'
        }))
      : [
          { revId: targetRev, date: dateStr, author: authorName, changeSummary: 'Initial Product Release', status: 'Released' }
        ];

    revHist.slice(0, 3).forEach((r, idx) => {
      const ry = revY + 10.2 + idx * 6;
      doc.setFont('helvetica', 'bold');
      doc.text(r.revId, revX + 3, ry);
      doc.setFont('helvetica', 'normal');
      doc.text(r.changeSummary.substring(0, 44), revX + 19, ry);
      doc.text(r.date, revX + 93, ry);
      doc.text(r.status, revX + 121, ry);
    });

    // ==========================================
    // 7. GENERAL NOTES (Bottom-Left)
    // ==========================================
    const noteX = innerX + 5;
    const noteY = innerY + innerH - 42;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text('GENERAL NOTES (UNLESS OTHERWISE SPECIFIED):', noteX, noteY);

    const notes = [
      '1. ALL DIMENSIONS ARE IN MILLIMETERS (mm). INTERPRET DRAWING PER ASME Y14.5-2018.',
      '2. REMOVE ALL BURRS AND SHARP EDGES (R0.5 MAX). BREAK SHARP INTERNAL CORNERS R0.3.',
      '3. GENERAL TOLERANCES: LINEAR ±0.15 mm, ANGULAR ±0°30\' PER ISO 2768-mK.',
      '4. DO NOT SCALE DRAWING. WORK TO STATED DIMENSIONS AND CAD GEOMETRY ONLY.',
      '5. ALL MACHINED SURFACES SHALL BE FREE FROM TOOL MARKS, SCRATCHES, AND POROSITY.',
      '6. SURFACE FINISH: Ra 1.6 μm FOR ALL BEARING JOURNALS AND MATING FACES.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(51, 65, 85);
    notes.forEach((n, idx) => {
      doc.text(n, noteX, noteY + 5 + idx * 4.2);
    });
  };

  // ==========================================
  // SHEET 1: ORTHOGRAPHIC & ISOMETRIC CAD VIEWS
  // ==========================================
  renderSheetFrame(1);

  // BOM / Parts List Table (Upper Right, under Revision Table)
  const bomX = innerX + innerW - 150;
  const bomY = innerY + 28; // Below Revision block (height 24 + 4 gap)
  const bomW = 150;
  const bomRows = Math.min(bomList.length, 6);
  const bomH = 6 + bomRows * 5.5;

  // Pure White Table Background
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(bomX, bomY, bomW, bomH, 'FD');

  // Header Background
  doc.setFillColor(245, 247, 250);
  doc.rect(bomX, bomY, bomW, 6, 'FD');

  // Columns: ITEM (12), PART NO (42), DESCRIPTION (76), QTY (20)
  doc.setLineWidth(0.25);
  doc.line(bomX + 12, bomY, bomX + 12, bomY + bomH);
  doc.line(bomX + 54, bomY, bomX + 54, bomY + bomH);
  doc.line(bomX + 130, bomY, bomX + 130, bomY + bomH);
  doc.line(bomX, bomY + 6, bomX + bomW, bomY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEM', bomX + 2, bomY + 4.2);
  doc.text('PART NUMBER', bomX + 15, bomY + 4.2);
  doc.text('DESCRIPTION / PART NAME', bomX + 57, bomY + 4.2);
  doc.text('QTY', bomX + 134, bomY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  bomList.slice(0, 6).forEach((b, idx) => {
    const by = bomY + 10 + idx * 5.5;
    doc.line(bomX, by - 4, bomX + bomW, by - 4);
    doc.setFont('helvetica', 'bold');
    doc.text(String(b.item), bomX + 4, by);
    doc.setFont('helvetica', 'normal');
    doc.text(b.partNo, bomX + 15, by);
    doc.text(b.name.substring(0, 36), bomX + 57, by);
    doc.text(String(b.qty), bomX + 137, by);
  });

  // CAD 2D GEOMETRY VIEWS (Sheet 1)
  // 1. TOP VIEW (Center x: 85, y: 35)
  const tX = 50;
  const tY = 28;
  doc.setLineWidth(0.45);
  doc.setDrawColor(15, 23, 42);
  doc.rect(tX, tY, 80, 40, 'S');
  doc.rect(tX + 12, tY + 8, 56, 24, 'S');
  drawDashedLine(doc, tX + 22, tY, tX + 22, tY + 40);
  drawDashedLine(doc, tX + 58, tY, tX + 58, tY + 40);
  drawCenterLine(doc, tX + 40, tY - 4, tX + 40, tY + 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOP VIEW', tX + 40, tY + 47, { align: 'center' });

  // Top Dimension
  doc.setLineWidth(0.2);
  doc.line(tX + 85, tY, tX + 85, tY + 40);
  doc.line(tX + 82, tY, tX + 88, tY);
  doc.line(tX + 82, tY + 40, tX + 88, tY + 40);
  doc.setFontSize(6);
  doc.text('680.00', tX + 92, tY + 21);

  // 2. FRONT VIEW (Center x: 85, y: 125)
  const fX = 50;
  const fY = 88;
  doc.setLineWidth(0.5);
  doc.setDrawColor(15, 23, 42);

  // Outer Body Outline
  doc.rect(fX, fY, 80, 75, 'S');
  // Internal Stepped Pocket
  doc.rect(fX + 12, fY + 10, 56, 55, 'S');
  doc.circle(fX + 40, fY + 37.5, 18, 'S');
  doc.circle(fX + 40, fY + 37.5, 8, 'S');

  // Hidden Lines (Dashed)
  doc.setLineWidth(0.2);
  drawDashedLine(doc, fX + 5, fY, fX + 5, fY + 75);
  drawDashedLine(doc, fX + 75, fY, fX + 75, fY + 75);

  // Centerlines
  drawCenterLine(doc, fX + 40, fY - 8, fX + 40, fY + 83);
  drawCenterLine(doc, fX - 8, fY + 37.5, fX + 88, fY + 37.5);

  // View Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('FRONT VIEW (PRIMARY)', fX + 40, fY + 86, { align: 'center' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SCALE 1:2.5', fX + 40, fY + 90, { align: 'center' });

  // Dimensions for Front View
  doc.setLineWidth(0.2);
  doc.line(fX, fY - 5, fX + 80, fY - 5);
  doc.line(fX, fY - 8, fX, fY - 2);
  doc.line(fX + 80, fY - 8, fX + 80, fY - 2);
  doc.setFontSize(6);
  doc.text('450.00 ±0.10 mm', fX + 40, fY - 6.5, { align: 'center' });

  doc.line(fX + 40, fY + 37.5, fX + 65, fY + 22);
  doc.text('Ø80 H7', fX + 67, fY + 21);

  // 3. RIGHT SIDE VIEW (Center x: 170, y: 125)
  const rX = 155;
  const rY = 88;
  doc.setLineWidth(0.5);
  doc.rect(rX, rY, 45, 75, 'S');
  doc.rect(rX + 8, rY + 10, 29, 55, 'S');
  drawCenterLine(doc, rX + 22.5, rY - 8, rX + 22.5, rY + 83);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RIGHT SIDE VIEW', rX + 22.5, rY + 86, { align: 'center' });

  // 4. ISOMETRIC VIEW (3D)
  const isoX = 160;
  const isoY = 46;
  doc.setLineWidth(0.55);

  const isoPts = [
    { x: isoX, y: isoY - 12 },
    { x: isoX + 25, y: isoY - 24 },
    { x: isoX + 50, y: isoY - 12 },
    { x: isoX + 50, y: isoY + 15 },
    { x: isoX + 25, y: isoY + 27 },
    { x: isoX, y: isoY + 15 }
  ];

  for (let i = 0; i < isoPts.length; i++) {
    const next = isoPts[(i + 1) % isoPts.length];
    doc.line(isoPts[i].x, isoPts[i].y, next.x, next.y);
  }

  doc.line(isoX + 25, isoY - 24, isoX + 25, isoY + 27);
  doc.line(isoX, isoY - 12, isoX + 25, isoY);
  doc.line(isoX + 50, isoY - 12, isoX + 25, isoY);
  doc.ellipse(isoX + 25, isoY, 10, 5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ISOMETRIC VIEW (3D)', isoX + 25, isoY + 34, { align: 'center' });

  // Balloon Callouts
  drawBalloonCallout(doc, 1, isoX - 8, isoY - 4, isoX + 8, isoY + 4);
  drawBalloonCallout(doc, 2, isoX + 58, isoY - 8, isoX + 38, isoY - 10);
  drawBalloonCallout(doc, 3, isoX + 58, isoY + 16, isoX + 30, isoY + 12);

  // ==========================================
  // SHEET 2: DETAILED SECTION & SPECIFICATIONS
  // ==========================================
  doc.addPage('a3', 'landscape');
  renderSheetFrame(2);

  // 1. Section View A-A Box (Top Left)
  const sX = innerX + 10;
  const sY = innerY + 12;
  const sW = 140;
  const sH = 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION VIEW A-A (CROSS SECTION & INTERNAL TOLERANCES)', sX, sY);

  // Section Box Frame
  doc.setLineWidth(0.4);
  doc.rect(sX, sY + 4, sW, sH, 'S');
  doc.rect(sX + 15, sY + 16, sW - 30, sH - 24, 'S');

  // Crisp Section Hatching Lines (45 degrees, Thin gray/slate lines)
  doc.setLineWidth(0.2);
  doc.setDrawColor(100, 116, 139);
  for (let i = 0; i < sW; i += 7) {
    doc.line(sX + i, sY + 4, sX + Math.min(i + 35, sW), sY + 39);
    doc.line(sX + i, sY + 39, sX + Math.min(i + 35, sW), sY + 4 + sH);
  }

  // Section Dimension
  doc.setDrawColor(15, 23, 42);
  doc.line(sX + 70, sY + 4, sX + 70, sY + 4 + sH);
  drawCenterLine(doc, sX + 70, sY, sX + 70, sY + 8 + sH);

  // 2. GD&T Feature Control Frames (Top Right)
  const gdtX = sX + sW + 15;
  const gdtY = sY + 4;
  const gdtW = 180;
  const gdtH = sH;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GEOMETRIC DIMENSIONING & TOLERANCING (ASME Y14.5-2018)', gdtX, sY);

  // GD&T Table Frame (White)
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.rect(gdtX, gdtY, gdtW, gdtH, 'FD');

  // GD&T Header
  doc.setFillColor(245, 247, 250);
  doc.rect(gdtX, gdtY, gdtW, 7, 'FD');
  doc.setFontSize(6);
  doc.text('FEATURE / DATUM', gdtX + 4, gdtY + 5);
  doc.text('GEOMETRIC CHARACTERISTIC & REQUIREMENT', gdtX + 60, gdtY + 5);
  doc.text('APPLICABLE DATUM', gdtX + 140, gdtY + 5);

  const gdtRows = [
    { feat: 'Housing Bearing Bore', sym: 'Positional Tolerance', tol: 'Ø 0.05 (M)', datum: 'Datum A-B-C' },
    { feat: 'Flange Mounting Face', sym: 'Flatness', tol: '0.03 mm', datum: 'Primary Datum A' },
    { feat: 'Carrier Pin Bore Axes', sym: 'Parallelism', tol: '0.04 mm', datum: 'Datum A' },
    { feat: 'Input Shaft Centerline', sym: 'Total Radial Runout', tol: '0.02 mm', datum: 'Datum A-B' },
    { feat: 'Dowel Locating Holes', sym: 'True Position', tol: 'Ø 0.025 (M)', datum: 'Datum A | B' }
  ];

  doc.setLineWidth(0.25);
  doc.line(gdtX + 55, gdtY, gdtX + 55, gdtY + gdtH);
  doc.line(gdtX + 135, gdtY, gdtX + 135, gdtY + gdtH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  gdtRows.forEach((g, idx) => {
    const gy = gdtY + 14 + idx * 13;
    doc.line(gdtX, gy - 6, gdtX + gdtW, gy - 6);
    doc.setFont('helvetica', 'bold');
    doc.text(g.feat, gdtX + 4, gy);
    doc.setFont('helvetica', 'normal');
    doc.text(`${g.sym}: ${g.tol}`, gdtX + 60, gy);
    doc.text(g.datum, gdtX + 140, gy);
  });

  // 3. Complete Manufacturing Specification Matrix (Middle Table)
  const tabX = innerX + 10;
  const tabY = innerY + 104;
  const tabW = innerW - 20; // 365mm

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLETE MANUFACTURING & MATERIAL SPECIFICATION MATRIX', tabX, tabY - 3);

  const specs = [
    { item: 1, param: 'Base Material Specification', spec: part.material || 'Aluminium 7075-T6 (AMS 4045)', method: 'Spectrometry & Mill Test Certificate Verification' },
    { item: 2, param: 'Calculated Mass & Volume', spec: `${part.weightKg || 28.4} kg (Derived from 3D CAD B-Rep Model)`, method: 'Precision Digital Load-Cell Scale (±0.01 kg)' },
    { item: 3, param: 'Surface Treatment & Coating', spec: 'Type III Hard Anodize (MIL-A-8625), Class 2 Black 50µm', method: 'Eddy Current Coating Thickness Gauge (ASTM B244)' },
    { item: 4, param: 'Thermal & Heat Treatment', spec: 'T6 Solution Heat Treated & Artificially Peak Aged', method: 'Rockwell Hardness Test (150 HRB / ASTM E18)' },
    { item: 5, param: 'Threaded Locking Inserts', spec: 'Helicoil STI M8x1.25 Self-Locking Wire Inserts (304 SS)', method: 'Thread Go / No-Go Plug Gauge (ISO 1502)' },
    { item: 6, param: 'Non-Destructive Testing (NDT)', spec: '100% Ultrasonic Flaw Detection & Fluorescent Penetrant', method: 'ASTM E1417 Level 2 / EN ISO 3452-1' },
    { item: 7, param: 'Hydraulic Cleanliness Class', spec: 'ISO 4406 Cleanliness Code Class 14/12/9 Particle Count', method: 'Gravimetric Membrane Flushing & Laser Particle Counter' }
  ];

  const specH = 7 + specs.length * 8.5; // ~66.5mm

  // Pure White Table Background
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.rect(tabX, tabY, tabW, specH, 'FD');

  // Header Background
  doc.setFillColor(245, 247, 250);
  doc.rect(tabX, tabY, tabW, 7, 'FD');

  // Table Column Lines
  doc.setLineWidth(0.25);
  doc.line(tabX + 15, tabY, tabX + 15, tabY + specH);
  doc.line(tabX + 85, tabY, tabX + 85, tabY + specH);
  doc.line(tabX + 250, tabY, tabX + 250, tabY + specH);
  doc.line(tabX, tabY + 7, tabX + tabW, tabY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('ITEM', tabX + 3, tabY + 4.8);
  doc.text('PARAMETER / REQUIREMENT', tabX + 18, tabY + 4.8);
  doc.text('ENGINEERING SPECIFICATION & MATERIAL STANDARD', tabX + 88, tabY + 4.8);
  doc.text('VERIFICATION & QA TEST METHOD', tabX + 253, tabY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  specs.forEach((sp, idx) => {
    const sy = tabY + 13 + idx * 8.5;
    doc.line(tabX, sy - 5.5, tabX + tabW, sy - 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(sp.item), tabX + 5, sy);
    doc.text(sp.param, tabX + 18, sy);
    doc.setFont('helvetica', 'normal');
    doc.text(sp.spec, tabX + 88, sy);
    doc.text(sp.method, tabX + 253, sy);
  });

  // Convert PDF to Blob
  const blob = doc.output('blob');
  return { blob, filename };
}
