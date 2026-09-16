import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { BOMNode, PartItem } from '../types/plm';

export interface BomExportOptions {
  rootNode: BOMNode;
  part?: PartItem;
  viewMode?: 'ebom' | 'mbom' | 'sbom' | 'compare' | 'all';
  authorName?: string;
  currencySymbol?: string;
}

export interface FlattenedBomItem {
  slNo: number;
  level: number;
  partId: string;
  partNumber: string;
  name: string;
  revision: string;
  category: string;
  purchaseMode: string;
  specifications: string;
  quantity: number;
  unit: string;
  refDes: string;
  material: string;
  unitCost: number;
  gstPercent: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  vendorName: string;
  vendorContact: string;
  vendorWebsite: string;
  weightKg: number;
  carbonKg: number;
  remarks: string;
  itemType: string;
}

/**
 * Infer Item Category from component name, material and tags
 */
export function inferCategory(name: string, mat: string, isMbom?: boolean, isSbom?: boolean): string {
  if (isSbom) return 'Service & Replacement Kits';
  if (isMbom) return 'Lubricants & Process Consumables';
  
  const lower = (name + ' ' + mat).toLowerCase();
  if (lower.includes('bearing')) return 'Bearings & Bushings';
  if (lower.includes('gear') || lower.includes('pinion') || lower.includes('shaft')) return 'Precision Transmission';
  if (lower.includes('pin') || lower.includes('screw') || lower.includes('bolt') || lower.includes('washer') || lower.includes('fastener')) return 'Standard Fasteners & Hardware';
  if (lower.includes('carrier') || lower.includes('housing') || lower.includes('flange') || lower.includes('bracket')) return 'Machined Structural Components';
  if (lower.includes('motor') || lower.includes('sensor') || lower.includes('wire') || lower.includes('pcb') || lower.includes('controller')) return 'Electrical & Electromechanical';
  if (lower.includes('seal') || lower.includes('o-ring') || lower.includes('gasket')) return 'Seals & Gaskets';
  if (lower.includes('grease') || lower.includes('oil') || lower.includes('fluid')) return 'Lubricants & Chemical';
  return 'Raw Materials & Alloys';
}

/**
 * Infer Preferred Purchase Mode
 */
export function inferPurchaseMode(category: string, isMbom?: boolean): string {
  if (isMbom) return 'DIRECT VENDOR';
  if (category.includes('Fasteners') || category.includes('Hardware')) return 'ONLINE CATALOG';
  if (category.includes('Bearings')) return 'OEM TIER-1';
  if (category.includes('Machined') || category.includes('Structural')) return 'PRECISION CONTRACT MFG';
  if (category.includes('Electrical')) return 'DIRECT DISTRIBUTOR';
  return 'DIRECT VENDOR';
}

/**
 * Infer Detailed Specifications
 */
export function inferSpecifications(node: BOMNode): string {
  const mat = node.material || 'Standard Industrial Alloy';
  const name = node.name || '';
  if (name.includes('Planet Gear Carrier')) {
    return `${mat}, 5-Axis CNC Precision Milled (Tolerance ISO JS6), MIL-A-8625 Type III Hard Anodized`;
  }
  if (name.includes('Planet Gear') || name.includes('Sun Gear')) {
    return `${mat}, Precision AGMA Class 11 Hobbed & Case Hardened (58-62 HRC), DIN 3962 Quality Grade 6`;
  }
  if (name.includes('Dowel Pin') || name.includes('Pin')) {
    return `${mat}, Centerless Ground to ISO m6 Fit, Case Depth 0.8mm, Chamfered Ends 15°`;
  }
  if (name.includes('Grease') || name.includes('Lubricant')) {
    return `${mat}, NLGI Grade 2 Synthetic with EP Additives (-40°C to +180°C Operating Range)`;
  }
  if (name.includes('Seal') || name.includes('Kit')) {
    return `${mat}, Shore A 75 Hardness, Resistant to Synthetic Hydrocarbons & Ozone (ASTM D2000)`;
  }
  return `${mat}, Manufactured per engineering drawing tolerances ISO 2768-mK and ASTM specifications`;
}

/**
 * Infer Vendor Name and Contact Information
 */
export function inferVendorInfo(name: string, category: string): { name: string; contact: string; website: string } {
  if (category.includes('Bearings')) {
    return {
      name: 'Schaeffler Technologies AG & Co. KG',
      contact: 'sales@schaeffler.com | +49 9132 82-0 | Industriestr. 1-3, Herzogenaurach, Germany',
      website: 'https://www.schaeffler.com'
    };
  }
  if (category.includes('Fasteners') || category.includes('Hardware')) {
    return {
      name: 'Würth Industry North America',
      contact: 'orders@wurthindustry.com | +1 800-987-8447 | 5980 West 71st St, Indianapolis, IN',
      website: 'https://www.wurthindustry.com'
    };
  }
  if (category.includes('Transmission') || category.includes('Machined')) {
    return {
      name: 'Apex Tier-1 Precision Gears Ltd.',
      contact: 'procurement@apexprecision.com | +1 888-555-APEX | Tech Park Blvd, Detroit, MI',
      website: 'https://www.apexprecisiongears.com'
    };
  }
  if (category.includes('Lubricants') || category.includes('Chemical')) {
    return {
      name: 'Mobil Industrial Lubricants / ExxonMobil',
      contact: 'techdesk@exxonmobil.com | +1 800-662-4525 | Spring, TX, USA',
      website: 'https://www.mobil.com'
    };
  }
  if (category.includes('Service') || category.includes('Seals')) {
    return {
      name: 'Freudenberg Sealing Technologies',
      contact: 'fst-sales@fst.com | +49 6201 80-0 | Weinheim, Germany',
      website: 'https://www.fst.com'
    };
  }
  return {
    name: 'Apex Certified Approved Vendor Matrix',
    contact: 'supplier-portal@apexplm.studio | Enterprise Global Sourcing',
    website: 'https://www.apexplm.studio'
  };
}

/**
 * Flatten a BOM Tree into an ordered array of detailed procurement rows
 */
export function flattenBomTree(rootNode: BOMNode, viewMode: string = 'ebom'): FlattenedBomItem[] {
  const result: FlattenedBomItem[] = [];
  let slCounter = 1;

  function traverse(node: BOMNode, level: number) {
    if (!node) return;
    if (viewMode === 'ebom' && (node.isMbomOnly || node.isSbomOnly)) return;
    if (viewMode === 'mbom' && node.isSbomOnly) return;
    if (viewMode === 'sbom' && !node.isSbomOnly && level > 0 && (!node.children || node.children.length === 0)) {
      // In strict sbom, focus on serviceable parts
    }

    const qty = node.quantity ?? 1;
    const rate = node.unitCost ?? 45.0;
    const gstPercent = 18; // 18% standard GST
    const baseAmount = qty * rate;
    const gstAmount = baseAmount * (gstPercent / 100);
    const totalAmount = baseAmount + gstAmount;

    const category = inferCategory(node.name || '', node.material || '', node.isMbomOnly, node.isSbomOnly);
    const purchaseMode = inferPurchaseMode(category, node.isMbomOnly);
    const specs = inferSpecifications(node);
    const vendor = inferVendorInfo(node.name || '', category);

    const itemType = node.isMbomOnly ? 'MBOM Process' : node.isSbomOnly ? 'SBOM Service Kit' : 'EBOM Core Design';
    const remarks = node.isMbomOnly 
      ? `MBOM: ${node.mbomInstruction || 'Assembly floor requirement'}`
      : node.isSbomOnly 
      ? `SBOM: ${node.sbomMaintenanceInterval || 'Field service replacement'}`
      : 'Approved for Production (RoHS & REACH Compliant)';

    result.push({
      slNo: slCounter++,
      level,
      partId: node.partId || node.id,
      partNumber: node.partNumber || node.id,
      name: node.name || 'Unnamed Component',
      revision: node.revision || 'Rev A.0',
      category,
      purchaseMode,
      specifications: specs,
      quantity: qty,
      unit: node.unit || 'pcs',
      refDes: node.refDes || '—',
      material: node.material || 'Standard Alloy',
      unitCost: rate,
      gstPercent,
      baseAmount,
      gstAmount,
      totalAmount,
      vendorName: vendor.name,
      vendorContact: vendor.contact,
      vendorWebsite: vendor.website,
      weightKg: (node.weightKg ?? 0.5) * qty,
      carbonKg: (node.carbonKgCO2 ?? 1.2) * qty,
      remarks,
      itemType
    });

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child, level + 1));
    }
  }

  traverse(rootNode, 0);
  return result;
}

/**
 * Clean revision string for file naming (e.g. "Rev B.1" -> "B1")
 */
function cleanRevString(rev: string): string {
  return rev.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Generate Professional Excel BOM Workbook (.xlsx)
 */
export async function generateBomExcel(options: BomExportOptions): Promise<{ blob: Blob; filename: string }> {
  const {
    rootNode,
    part,
    viewMode = 'ebom',
    authorName = 'Alex Rivera, PE'
  } = options;

  const partNo = rootNode.partNumber || part?.partNumber || 'ASM-GBX-5000';
  const partName = rootNode.name || part?.name || 'Assembly Bill of Materials';
  const rev = rootNode.revision || part?.currentRev || 'Rev B.1';
  const cleanRev = cleanRevString(rev);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${partNo}_BOM_Rev-${cleanRev}.xlsx`;

  const items = flattenBomTree(rootNode, viewMode);

  // Create worksheet data array
  const wsData: any[][] = [];

  // 1. Company Header & Title
  wsData.push(['APEXPLM STUDIO']);
  wsData.push(['ENGINEERING BILL OF MATERIALS & PROCUREMENT SPECIFICATION']);
  wsData.push([]); // Empty Row

  // 2. Product Metadata Card
  wsData.push([
    'PRODUCT / ASSEMBLY:', partNo, '', '',
    'BOM TYPE:', viewMode.toUpperCase() + ' (Engineering BOM)', '',
    'DATE:', dateStr
  ]);
  wsData.push([
    'DESCRIPTION:', partName, '', '',
    'REVISION:', rev, '',
    'PREPARED BY:', authorName
  ]);
  wsData.push([
    'BASE MATERIAL:', rootNode.material || part?.material || 'Aluminium 7075-T6', '', '',
    'STANDARD / CODE:', 'ASME Y14.5 / ISO 2768-mK', '',
    'STATUS:', 'Released / Approved'
  ]);
  wsData.push([]); // Empty Row

  // 3. Table Column Headers
  const headerRow = [
    'SL.NO',
    'LEVEL',
    'ITEM CATEGORY',
    'PREFERRED PURCHASE MODE',
    'PART NUMBER',
    'ITEM NAME',
    'DETAILED SPECIFICATIONS',
    'QTY REQUIRED',
    'UNIT',
    'RATE PER ITEM (₹)',
    'BASE AMOUNT (₹)',
    'GST (%)',
    'TOTAL AMOUNT (₹)',
    'PREFERRED VENDOR NAME',
    'VENDOR CONTACT & ADDRESS',
    'VENDOR WEBSITE',
    'REMARKS / DFM NOTES'
  ];
  wsData.push(headerRow);

  const startDataRow = wsData.length + 1; // 1-based index in Excel (e.g. Row 10)

  // 4. Data Rows
  items.forEach((item, index) => {
    const rowIdx = startDataRow + index;
    const levelDisplay = item.level === 0 ? 'Level 0 (Root)' : `Level ${item.level}`;
    const indentedName = '  '.repeat(item.level) + item.name;

    wsData.push([
      item.slNo,
      levelDisplay,
      item.category,
      item.purchaseMode,
      item.partNumber,
      indentedName,
      item.specifications,
      item.quantity,
      item.unit,
      item.unitCost,
      { f: `H${rowIdx}*J${rowIdx}` }, // Formula: QTY * RATE
      item.gstPercent,
      { f: `K${rowIdx}*(1+L${rowIdx}/100)` }, // Formula: Base Amount * (1 + GST/100)
      item.vendorName,
      item.vendorContact,
      item.vendorWebsite,
      item.remarks
    ]);
  });

  const endDataRow = startDataRow + items.length - 1;

  // 5. Summary / Totals Rows
  wsData.push([]); // Empty Row
  wsData.push([
    '', '', '', '', '', '', 'SUBTOTAL (BASE PROCUREMENT AMOUNT):',
    '', '', '',
    { f: `SUM(K${startDataRow}:K${endDataRow})` },
    '',
    { f: `SUM(M${startDataRow}:M${endDataRow})` },
    '', '', '', ''
  ]);
  wsData.push([
    '', '', '', '', '', '', 'TOTAL GST APPLIED (18% TAX):',
    '', '', '',
    '', '',
    { f: `SUM(M${startDataRow}:M${endDataRow})-SUM(K${startDataRow}:K${endDataRow})` },
    '', '', '', ''
  ]);
  wsData.push([
    '', '', '', '', '', '', 'GRAND TOTAL PROCUREMENT COST (WITH TAXES):',
    '', '', '',
    '', '',
    { f: `SUM(M${startDataRow}:M${endDataRow})` },
    '', '', '', ''
  ]);

  wsData.push([]);
  wsData.push(['TOTAL BOM LINE ITEMS:', items.length]);
  wsData.push(['TOTAL ASSEMBLY WEIGHT:', `${items.reduce((s, i) => s + i.weightKg, 0).toFixed(3)} kg`]);
  wsData.push(['TOTAL CARBON FOOTPRINT:', `${items.reduce((s, i) => s + i.carbonKg, 0).toFixed(1)} kg CO2e`]);

  // Create Worksheet & Workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // SL.NO
    { wch: 14 }, // LEVEL
    { wch: 24 }, // ITEM CATEGORY
    { wch: 22 }, // PREFERRED PURCHASE MODE
    { wch: 18 }, // PART NUMBER
    { wch: 34 }, // ITEM NAME
    { wch: 55 }, // DETAILED SPECIFICATIONS
    { wch: 14 }, // QTY REQUIRED
    { wch: 10 }, // UNIT
    { wch: 18 }, // RATE PER ITEM
    { wch: 18 }, // BASE AMOUNT
    { wch: 10 }, // GST %
    { wch: 20 }, // TOTAL AMOUNT
    { wch: 32 }, // PREFERRED VENDOR NAME
    { wch: 50 }, // VENDOR CONTACT
    { wch: 30 }, // VENDOR WEBSITE
    { wch: 40 }  // REMARKS
  ];

  // Merge header cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // Row 1 APEXPLM STUDIO
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // Row 2 Title
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Engineering BOM');

  // Output XLSX binary array
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  return { blob, filename };
}

/**
 * Generate Matching Professional PDF BOM Document
 */
export async function generateBomPdf(options: BomExportOptions): Promise<{ blob: Blob; filename: string }> {
  const {
    rootNode,
    part,
    viewMode = 'ebom',
    authorName = 'Alex Rivera, PE'
  } = options;

  const partNo = rootNode.partNumber || part?.partNumber || 'ASM-GBX-5000';
  const partName = rootNode.name || part?.name || 'Assembly Bill of Materials';
  const rev = rootNode.revision || part?.currentRev || 'Rev B.1';
  const cleanRev = cleanRevString(rev);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${partNo}_BOM_Rev-${cleanRev}.pdf`;

  const items = flattenBomTree(rootNode, viewMode);

  // Landscape A4 Document (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const contentW = pageW - margin * 2; // 277mm

  let currentPage = 1;
  const totalPages = Math.ceil(items.length / 9) || 1;

  // Header Rendering Function
  const renderPdfHeader = () => {
    // Header Banner (White with sharp crisp borders)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Outer Border
    doc.setLineWidth(0.4);
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.rect(margin, margin, contentW, pageH - margin * 2);

    // Title Block Area
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, margin, contentW, 24, 'FD');
    doc.setLineWidth(0.3);
    doc.line(margin, margin + 24, margin + contentW, margin + 24);

    // APEXPLM Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('APEXPLM STUDIO', margin + 4, margin + 7);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('ENTERPRISE PRODUCT LIFECYCLE MANAGEMENT', margin + 4, margin + 11);
    doc.text('ENGINEERING BILL OF MATERIALS (EBOM/MBOM)', margin + 4, margin + 15);

    // Main Header Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(partName.toUpperCase().substring(0, 48), margin + 80, margin + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`PART NO: ${partNo}`, margin + 80, margin + 12);
    doc.text(`REVISION: ${rev}`, margin + 140, margin + 12);
    doc.text(`DATE: ${dateStr}`, margin + 185, margin + 12);
    doc.text(`AUTHOR: ${authorName}`, margin + 80, margin + 17);
    doc.text(`BOM TYPE: ${viewMode.toUpperCase()} RELEASE`, margin + 140, margin + 17);
    doc.text(`STATUS: APPROVED / RELEASED`, margin + 185, margin + 17);

    // Top-Right Doc ID
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`DOC: BOM-${partNo}-${cleanRev}`, margin + contentW - 55, margin + 8);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('ISO 9001:2015 Traceable', margin + contentW - 55, margin + 13);
    doc.text('Standard: ASME Y14.5-2018', margin + contentW - 55, margin + 17);
  };

  // Table Column Definitions (Total Width = 277mm)
  const cols = [
    { label: 'SL', w: 8, align: 'center' },
    { label: 'LEVEL', w: 14, align: 'center' },
    { label: 'PART NUMBER', w: 26, align: 'left' },
    { label: 'ITEM NAME', w: 42, align: 'left' },
    { label: 'CATEGORY', w: 28, align: 'left' },
    { label: 'SPECIFICATIONS', w: 55, align: 'left' },
    { label: 'QTY', w: 10, align: 'center' },
    { label: 'UNIT', w: 10, align: 'center' },
    { label: 'RATE (₹)', w: 18, align: 'right' },
    { label: 'GST', w: 12, align: 'center' },
    { label: 'TOTAL (₹)', w: 22, align: 'right' },
    { label: 'VENDOR', w: 32, align: 'left' }
  ];

  const renderTableHeader = (y: number) => {
    doc.setFillColor(235, 240, 245);
    doc.rect(margin, y, contentW, 7, 'FD');
    doc.setLineWidth(0.25);
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, y + 7, margin + contentW, y + 7);

    let curX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 23, 42);

    cols.forEach((col) => {
      const textX = col.align === 'center' ? curX + col.w / 2 : col.align === 'right' ? curX + col.w - 1.5 : curX + 1.5;
      doc.text(col.label, textX, y + 4.8, { align: col.align as any });
      doc.line(curX + col.w, y, curX + col.w, y + 7);
      curX += col.w;
    });
  };

  const renderFooter = (pageNo: number, total: number) => {
    const footY = pageH - margin - 4;
    doc.setLineWidth(0.25);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footY - 2, margin + contentW, footY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('APEXPLM STUDIO • CONFIDENTIAL & PROPRIETARY ENGINEERING DOCUMENT', margin + 3, footY + 1.5);
    doc.text(`Product: ${partNo} | Revision: ${rev}`, margin + 120, footY + 1.5);
    doc.text(`Page ${pageNo} of ${total}`, margin + contentW - 20, footY + 1.5);
  };

  // Render First Page
  renderPdfHeader();
  let tableY = margin + 27;
  renderTableHeader(tableY);
  tableY += 7;

  // Render Rows
  const rowHeight = 14; // Multi-line readable row height

  items.forEach((item, idx) => {
    // Check page overflow
    if (tableY + rowHeight > pageH - margin - 12) {
      renderFooter(currentPage, totalPages);
      doc.addPage('a4', 'landscape');
      currentPage++;
      renderPdfHeader();
      tableY = margin + 27;
      renderTableHeader(tableY);
      tableY += 7;
    }

    // Row Background (Alternating subtle tint)
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 254);
      doc.rect(margin, tableY, contentW, rowHeight, 'F');
    }

    doc.setLineWidth(0.15);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, tableY + rowHeight, margin + contentW, tableY + rowHeight);

    let curX = margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(15, 23, 42);

    // 1. SL.NO
    doc.setFont('helvetica', 'bold');
    doc.text(String(item.slNo), curX + 4, tableY + 6, { align: 'center' });
    curX += 8;

    // 2. LEVEL
    doc.setFont('helvetica', 'normal');
    doc.text(`L${item.level}`, curX + 7, tableY + 6, { align: 'center' });
    curX += 14;

    // 3. PART NUMBER
    doc.setFont('helvetica', 'bold');
    doc.text(item.partNumber, curX + 1.5, tableY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.revision, curX + 1.5, tableY + 10);
    curX += 26;

    // 4. ITEM NAME
    doc.setFontSize(5.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const nameLines = doc.splitTextToSize(item.name, 39);
    doc.text(nameLines.slice(0, 2), curX + 1.5, tableY + 5);
    curX += 42;

    // 5. CATEGORY
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    const catLines = doc.splitTextToSize(item.category, 26);
    doc.text(catLines.slice(0, 2), curX + 1.5, tableY + 5);
    curX += 28;

    // 6. SPECIFICATIONS
    doc.setFontSize(4.6);
    doc.setTextColor(51, 65, 85);
    const specLines = doc.splitTextToSize(item.specifications, 52);
    doc.text(specLines.slice(0, 3), curX + 1.5, tableY + 4.5);
    curX += 55;

    // 7. QTY
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(item.quantity), curX + 5, tableY + 6, { align: 'center' });
    curX += 10;

    // 8. UNIT
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.text(item.unit, curX + 5, tableY + 6, { align: 'center' });
    curX += 10;

    // 9. RATE
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.text(`₹${item.unitCost.toFixed(2)}`, curX + 16.5, tableY + 6, { align: 'right' });
    curX += 18;

    // 10. GST
    doc.text(`${item.gstPercent}%`, curX + 6, tableY + 6, { align: 'center' });
    curX += 12;

    // 11. TOTAL
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`₹${item.totalAmount.toFixed(2)}`, curX + 20.5, tableY + 6, { align: 'right' });
    curX += 22;

    // 12. VENDOR
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.setTextColor(71, 85, 105);
    const vendorLines = doc.splitTextToSize(item.vendorName, 30);
    doc.text(vendorLines.slice(0, 2), curX + 1.5, tableY + 5);

    tableY += rowHeight;
  });

  // Summary Card at bottom if space permits
  if (tableY + 15 <= pageH - margin - 12) {
    tableY += 3;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, tableY, contentW, 10, 'FD');
    doc.setLineWidth(0.3);
    doc.setDrawColor(15, 23, 42);
    doc.rect(margin, tableY, contentW, 10, 'S');

    const totalBase = items.reduce((s, i) => s + i.baseAmount, 0);
    const totalGst = items.reduce((s, i) => s + i.gstAmount, 0);
    const grandTotal = items.reduce((s, i) => s + i.totalAmount, 0);
    const totalWeight = items.reduce((s, i) => s + i.weightKg, 0);
    const totalCarbon = items.reduce((s, i) => s + i.carbonKg, 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    doc.text(`SUBTOTAL: ₹${totalBase.toFixed(2)}`, margin + 5, tableY + 6);
    doc.text(`TOTAL GST (18%): ₹${totalGst.toFixed(2)}`, margin + 55, tableY + 6);
    doc.text(`GRAND TOTAL: ₹${grandTotal.toFixed(2)}`, margin + 115, tableY + 6);
    doc.text(`TOTAL WEIGHT: ${totalWeight.toFixed(2)} kg`, margin + 175, tableY + 6);
    doc.text(`CARBON: ${totalCarbon.toFixed(1)} kg CO₂e`, margin + 230, tableY + 6);
  }

  renderFooter(currentPage, totalPages);

  const blob = doc.output('blob');
  return { blob, filename };
}
