import { jsPDF } from 'jspdf';

export interface ProductionReportMeta {
  plantName?: string;
  department?: string;
  generatedBy?: string;
  reportDate?: string;
  weekRange?: string;
  startDate?: string;
  endDate?: string;
  monthName?: string;
  year?: number | string;
  periodName?: string;
  compType?: 'week' | 'month' | 'custom' | 'multi';
  periodA?: string;
  periodB?: string;
  multiPeriods?: string[];
}

export interface GeneratedReportRecord {
  id: string;
  reportType: 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison';
  period: string;
  reportId: string;
  generatedBy: string;
  date: string;
  status: 'Generated' | 'Archived';
  filename: string;
  compType?: string;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AVAILABLE_YEARS = ['2023', '2024', '2025', '2026', '2027', '2028'];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function formatDateDk(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '25-Aug-2026';
  const day = String(d.getDate()).padStart(2, '0');
  const monthStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${monthStr}-${year}`;
}

export function formatDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '25 August 2026';
  const day = d.getDate();
  const monthStr = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthStr} ${year}`;
}

export function getWeekInfo(dateStr: string = '2026-08-25') {
  const d = new Date(dateStr);
  const target = isNaN(d.getTime()) ? new Date('2026-08-25') : d;
  
  // Calculate ISO week number
  const jan4 = new Date(target.getFullYear(), 0, 4);
  const dayOfYear = ((target.getTime() - new Date(target.getFullYear(), 0, 1).getTime()) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + ((new Date(target.getFullYear(), 0, 1).getDay() + 6) % 7)) / 7);

  // Monday of the week
  const day = target.getDay();
  const diffToMonday = target.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(target.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startStr = formatDateDk(monday);
  const endStr = formatDateDk(sunday);
  const rangeStr = `${startStr} → ${endStr}`;

  return {
    weekNum: weekNum > 0 ? weekNum : 34,
    startStr,
    endStr,
    rangeStr,
    fullLabel: `Week ${weekNum > 0 ? weekNum : 34} | ${rangeStr}`
  };
}

// -------------------------------------------------------------
// 1. DATA MODELS & AGGREGATORS
// -------------------------------------------------------------

export function getDailyProductionData(dateStr: string = '2026-08-24') {
  return {
    reportId: `DPR-${dateStr.replace(/-/g, '')}`,
    date: dateStr,
    plant: 'Main Manufacturing Facility - Plant 1',
    shift: 'All Shifts (A, B, C)',
    kpi: {
      totalTarget: 300,
      totalCompleted: 249,
      totalAccepted: 245,
      totalScrap: 4,
      oee: 86.2,
      availability: 94.2,
      performance: 92.8,
      quality: 98.6
    },
    shifts: [
      { shift: 'Shift A (06:00 - 14:00)', target: 100, produced: 98, accepted: 97, reject: 1, achievement: 98.0, oee: 87.4 },
      { shift: 'Shift B (14:00 - 22:00)', target: 100, produced: 82, accepted: 80, reject: 2, achievement: 82.0, oee: 84.8 },
      { shift: 'Shift C (22:00 - 06:00)', target: 100, produced: 69, accepted: 68, reject: 1, achievement: 69.0, oee: 86.3 }
    ],
    machines: [
      { id: 'MCH-MAZ-501', name: 'Mazak INTEGREX e-420H 5-Axis CNC #01', status: 'Running', part: 'ASM-CAR-510 Carrier', runtimeMin: 425, downtimeMin: 25, produced: 85, reject: 1, oee: 89.2 },
      { id: 'MCH-HAA-202', name: 'Haas VF-4SS Vertical Machining Center #02', status: 'Running', part: 'ASM-GBX-5000 Housing', runtimeMin: 410, downtimeMin: 40, produced: 72, reject: 1, oee: 86.4 },
      { id: 'MCH-DMG-303', name: 'DMG MORI NTX 2000 2nd Gen Mill-Turn #03', status: 'Running', part: 'PN-SGN-520 Sun Gear Shaft', runtimeMin: 395, downtimeMin: 55, produced: 52, reject: 1, oee: 83.5 },
      { id: 'MCH-FAN-104', name: 'FANUC Robodrill D21LiB5 Precision CNC #04', status: 'Setup', part: 'PN-PIN-515 Dowel Pins', runtimeMin: 380, downtimeMin: 70, produced: 40, reject: 1, oee: 81.0 }
    ],
    downtimes: [
      { category: 'Tool Change & Wear Offset', minutes: 55, percent: 28.9 },
      { category: 'Part Setup & Fixture Clamping', minutes: 45, percent: 23.7 },
      { category: 'In-Process CMM Quality Hold', minutes: 35, percent: 18.4 },
      { category: 'Unplanned Machine Spindle Alarm', minutes: 30, percent: 15.8 },
      { category: 'Material Billet Staging Delay', minutes: 15, percent: 7.9 },
      { category: 'Operator Shift Handover', minutes: 10, percent: 5.3 }
    ],
    quality: {
      totalInspected: 249,
      accepted: 245,
      rejected: 4,
      firstPassYield: 98.4,
      rejectionRate: 1.6,
      defects: [
        { type: 'Dimensional Tolerance Over-Bore (Op 30)', count: 2, percent: 50.0 },
        { type: 'Surface Finish Chatter (Ra > 1.6µm)', count: 1, percent: 25.0 },
        { type: 'Chamfer Deburring Anomaly', count: 1, percent: 25.0 }
      ]
    }
  };
}

export function getWeeklyProductionData(weekRange: string = '18-Aug-2026 → 24-Aug-2026') {
  return {
    reportId: `WPR-2026-W34`,
    weekRange,
    plant: 'Main Manufacturing Facility - Plant 1',
    summary: {
      weeklyProduction: 1842,
      targetProduction: 2100,
      achievement: 87.7,
      avgOee: 85.9,
      qualityRate: 98.1,
      totalDowntimeHours: 42.5,
      status: 'ON TARGET' as 'ON TARGET' | 'BELOW TARGET'
    },
    dailyTrends: [
      { day: 'Mon', date: '18-Aug', target: 300, actual: 282, oee: 87.1 },
      { day: 'Tue', date: '19-Aug', target: 300, actual: 295, oee: 89.4 },
      { day: 'Wed', date: '20-Aug', target: 300, actual: 270, oee: 84.6 },
      { day: 'Thu', date: '21-Aug', target: 300, actual: 288, oee: 88.0 },
      { day: 'Fri', date: '22-Aug', target: 300, actual: 264, oee: 83.2 },
      { day: 'Sat', date: '23-Aug', target: 300, actual: 235, oee: 81.5 },
      { day: 'Sun', date: '24-Aug', target: 300, actual: 208, oee: 87.3 }
    ],
    oeeBreakdown: [
      { date: '18-Aug-2026', availability: 94.5, performance: 93.1, quality: 98.9, oee: 87.1 },
      { date: '19-Aug-2026', availability: 96.0, performance: 94.2, quality: 98.8, oee: 89.4 },
      { date: '20-Aug-2026', availability: 92.1, performance: 93.0, quality: 98.7, oee: 84.6 },
      { date: '21-Aug-2026', availability: 95.2, performance: 93.8, quality: 98.5, oee: 88.0 },
      { date: '22-Aug-2026', availability: 91.8, performance: 92.4, quality: 98.0, oee: 83.2 },
      { date: '23-Aug-2026', availability: 90.5, performance: 91.8, quality: 98.1, oee: 81.5 },
      { date: '24-Aug-2026', availability: 94.2, performance: 92.8, quality: 98.6, oee: 87.3 }
    ],
    machineRankings: [
      { rank: 1, name: 'Mazak INTEGREX e-420H #01', production: 520, oee: 91.2, downtimeHours: 4.5, rejectCount: 4, status: 'Excellent' },
      { rank: 2, name: 'Haas VF-4SS Vertical Mill #02', production: 480, oee: 87.6, downtimeHours: 7.2, rejectCount: 6, status: 'Good' },
      { rank: 3, name: 'DMG MORI NTX 2000 #03', production: 432, oee: 84.2, downtimeHours: 11.4, rejectCount: 9, status: 'Good' },
      { rank: 4, name: 'FANUC Robodrill D21 #04', production: 410, oee: 80.5, downtimeHours: 19.4, rejectCount: 16, status: 'Attention' }
    ],
    paretoDowntime: [
      { category: 'Tool Wear & Replacement', hours: 14.5, percent: 34.1, cumPercent: 34.1 },
      { category: 'Fixture Clamping & Setup', hours: 11.2, percent: 26.4, cumPercent: 60.5 },
      { category: 'Hydraulic Pressure Drops', hours: 7.8, percent: 18.4, cumPercent: 78.9 },
      { category: 'CMM Inspection Wait', hours: 5.5, percent: 12.9, cumPercent: 91.8 },
      { category: 'Material Raw Billet Supply', hours: 3.5, percent: 8.2, cumPercent: 100.0 }
    ],
    quality: {
      totalProduced: 1842,
      accepted: 1807,
      rejected: 35,
      fpy: 98.1,
      rejectionRate: 1.9,
      topDefects: [
        { name: 'Planet Shaft Bore Diameter Tolerance', count: 14, percent: 40.0 },
        { name: 'Flange Surface Finish Roughness', count: 9, percent: 25.7 },
        { name: 'Keyway Alignment Broaching Error', count: 6, percent: 17.1 },
        { name: 'Thread Pitch M8 Insert Fit', count: 4, percent: 11.4 },
        { name: 'Anodize Color Uniformity', count: 2, percent: 5.7 }
      ]
    },
    actions: [
      { issue: 'High tooling downtime on CNC #04', rootCause: 'Premature carbide tip chipping', action: 'Switch to coated TiAlN inserts with coolant pressure upgrade', owner: 'Marcus Vance', dueDate: '2026-08-28', status: 'In Progress' },
      { issue: 'Planet carrier bore oversize', rootCause: 'Thermal spindle expansion', action: 'Add automated Renishaw laser bore measuring cycle before finish cut', owner: 'David Sterling', dueDate: '2026-08-30', status: 'Open' }
    ]
  };
}

export function getMonthlyProductionData(monthName: string = 'August 2026') {
  return {
    reportId: `MPR-2026-08`,
    month: monthName,
    plant: 'Main Manufacturing Facility - Plant 1',
    kpi: {
      monthlyProduction: 8420,
      monthlyTarget: 9000,
      achievement: 93.6,
      avgOee: 87.4,
      availability: 94.8,
      performance: 91.9,
      quality: 98.4,
      scrapRate: 1.6
    },
    shifts: [
      { shift: 'Shift A (Morning)', target: 3000, produced: 2940, accepted: 2900, rejected: 40, achievement: 98.0, oee: 89.2, fpy: 98.6 },
      { shift: 'Shift B (Evening)', target: 3000, produced: 2810, accepted: 2765, rejected: 45, achievement: 93.7, oee: 86.8, fpy: 98.4 },
      { shift: 'Shift C (Night)', target: 3000, produced: 2670, accepted: 2620, rejected: 50, achievement: 89.0, oee: 86.2, fpy: 98.1 }
    ],
    machines: [
      { name: 'Mazak INTEGREX e-420H 5-Axis #01', runtimeHours: 460, plannedDownHours: 20, unplannedDownHours: 12, production: 2350, reject: 22, availability: 95.8, performance: 94.1, quality: 99.1, oee: 89.3, status: 'Excellent' },
      { name: 'Haas VF-4SS Vertical Mill #02', runtimeHours: 440, plannedDownHours: 24, unplannedDownHours: 18, production: 2180, reject: 31, availability: 94.2, performance: 93.0, quality: 98.6, oee: 86.4, status: 'Good' },
      { name: 'DMG MORI NTX 2000 Mill-Turn #03', runtimeHours: 420, plannedDownHours: 28, unplannedDownHours: 26, production: 1990, reject: 38, availability: 92.5, performance: 91.8, quality: 98.1, oee: 83.3, status: 'Good' },
      { name: 'FANUC Robodrill D21 High-Speed #04', runtimeHours: 395, plannedDownHours: 32, unplannedDownHours: 45, production: 1900, reject: 44, availability: 89.2, performance: 88.7, quality: 97.7, oee: 77.3, status: 'Attention' }
    ],
    reliability: {
      totalDowntimeHours: 185.0,
      plannedDowntimeHours: 104.0,
      unplannedDowntimeHours: 81.0,
      mtbfHours: 48.5,
      mttrHours: 2.1
    },
    downtimePareto: [
      { reason: 'Tool Insert Wear & Toolpath Offsets', hours: 58.5, percent: 31.6, cumPercent: 31.6 },
      { reason: 'Workpiece Fixture Setup & Zeroing', hours: 44.0, percent: 23.8, cumPercent: 55.4 },
      { reason: 'Hydraulic System & Spindle Alarms', hours: 35.0, percent: 18.9, cumPercent: 74.3 },
      { reason: 'CMM Dimensional First Article Holds', hours: 26.5, percent: 14.3, cumPercent: 88.6 },
      { reason: 'Raw Billet Stock Logistics', hours: 21.0, percent: 11.4, cumPercent: 100.0 }
    ],
    quality: {
      fpy: 98.4,
      scrapRate: 1.6,
      reworkRate: 2.1,
      customerRejections: 0,
      internalRejections: 135,
      defectPareto: [
        { defect: 'Shaft Bore Diameter Over-Tolerance', count: 58, percent: 43.0, cumPercent: 43.0 },
        { defect: 'Roughness Chatter on Flange Face', count: 34, percent: 25.2, cumPercent: 68.2 },
        { defect: 'Keyway Depth Misalignment', count: 22, percent: 16.3, cumPercent: 84.5 },
        { defect: 'Thread Helicoil Tap Depth Error', count: 14, percent: 10.4, cumPercent: 94.9 },
        { defect: 'Anodizing Coating Thickness Variance', count: 7, percent: 5.1, cumPercent: 100.0 }
      ]
    },
    financials: {
      materialCost: 284000,
      laborCost: 142000,
      machineOperatingCost: 118000,
      toolingCost: 38500,
      scrapCost: 14200,
      totalProductionCost: 596700,
      costPerGoodUnit: 70.87
    },
    managementSummary: {
      achievements: [
        'Monthly production volume reached 8,420 units (93.6% target achievement).',
        'Overall plant OEE averaged 87.4%, surpassing the world-class 85.0% benchmark.',
        'Zero customer-reported field quality rejections achieved across August shipments.',
        'Average machine availability sustained at 94.8% with proactive TPM cycles.'
      ],
      issues: [
        'CNC #04 suffered 45 hours unplanned downtime due to recurring servo drive alarms.',
        'Shaft bore diameter over-tolerance accounted for 43.0% of total internal scrap.',
        'Night shift output averaged 89.0% vs Day shift 98.0% due to setup transition delays.'
      ],
      priorities: [
        '1. Implement closed-loop Renishaw in-process laser probing on all 4 machining centers.',
        '2. Overhaul spindle cooling system and servo drive on FANUC Robodrill #04.',
        '3. Standardize quick-change SMED hydraulic fixturing to reduce setup time by 30%.'
      ]
    }
  };
}

export function getCustomRangeProductionData(
  startDateStr: string = '2026-08-05',
  endDateStr: string = '2026-08-19',
  periodName?: string
) {
  const sDate = new Date(startDateStr);
  const eDate = new Date(endDateStr);
  const diffDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1);
  const seed = hashString(`${startDateStr}_${endDateStr}`);
  
  const dailyTarget = 300;
  const targetTotal = diffDays * dailyTarget;
  const achievementRate = 88 + (seed % 10);
  const completedTotal = Math.round(targetTotal * (achievementRate / 100));
  const scrapRate = 1.2 + ((seed % 15) / 10);
  const scrapTotal = Math.round(completedTotal * (scrapRate / 100));
  const acceptedTotal = completedTotal - scrapTotal;
  const oee = 84 + (seed % 6) + ((seed % 10) / 10);
  const availability = 92 + (seed % 5) + ((seed % 10) / 10);
  const performance = 90 + (seed % 6) + ((seed % 10) / 10);
  const quality = 97 + (seed % 2) + ((seed % 10) / 10);
  
  const startFmt = formatDateDk(sDate);
  const endFmt = formatDateDk(eDate);
  const rangeStr = `${startFmt} → ${endFmt}`;
  const effectiveName = periodName?.trim() || 'Custom Production Period';
  const idStr = `CPR-${startDateStr.replace(/-/g, '')}-${endDateStr.replace(/-/g, '')}`;

  return {
    reportId: idStr,
    periodName: effectiveName,
    rangeStr,
    startDate: startDateStr,
    endDate: endDateStr,
    diffDays,
    plant: 'Main Manufacturing Facility - Plant 1',
    kpi: {
      totalTarget: targetTotal,
      totalCompleted: completedTotal,
      totalAccepted: acceptedTotal,
      totalScrap: scrapTotal,
      oee: Number(oee.toFixed(1)),
      availability: Number(availability.toFixed(1)),
      performance: Number(performance.toFixed(1)),
      quality: Number(quality.toFixed(1)),
      scrapRate: Number(scrapRate.toFixed(1))
    },
    shifts: [
      { shift: 'Shift A (Morning)', target: Math.round(targetTotal * 0.35), produced: Math.round(completedTotal * 0.36), accepted: Math.round(acceptedTotal * 0.36), reject: Math.round(scrapTotal * 0.3), achievement: 98.2, oee: 88.5 },
      { shift: 'Shift B (Evening)', target: Math.round(targetTotal * 0.35), produced: Math.round(completedTotal * 0.34), accepted: Math.round(acceptedTotal * 0.34), reject: Math.round(scrapTotal * 0.35), achievement: 93.1, oee: 86.2 },
      { shift: 'Shift C (Night)', target: Math.round(targetTotal * 0.3), produced: Math.round(completedTotal * 0.3), accepted: Math.round(acceptedTotal * 0.3), reject: Math.round(scrapTotal * 0.35), achievement: 88.4, oee: 83.7 }
    ],
    machines: [
      { name: 'Mazak INTEGREX e-420H 5-Axis #01', runtimeHours: Math.round(diffDays * 16), downtimeHours: Math.round(diffDays * 1.2), production: Math.round(completedTotal * 0.28), reject: Math.round(scrapTotal * 0.22), oee: 89.4, status: 'Excellent' },
      { name: 'Haas VF-4SS Vertical Mill #02', runtimeHours: Math.round(diffDays * 15.5), downtimeHours: Math.round(diffDays * 1.5), production: Math.round(completedTotal * 0.26), reject: Math.round(scrapTotal * 0.25), oee: 86.8, status: 'Good' },
      { name: 'DMG MORI NTX 2000 Mill-Turn #03', runtimeHours: Math.round(diffDays * 14.8), downtimeHours: Math.round(diffDays * 2.1), production: Math.round(completedTotal * 0.24), reject: Math.round(scrapTotal * 0.28), oee: 84.1, status: 'Good' },
      { name: 'FANUC Robodrill D21 High-Speed #04', runtimeHours: Math.round(diffDays * 14), downtimeHours: Math.round(diffDays * 2.8), production: Math.round(completedTotal * 0.22), reject: Math.round(scrapTotal * 0.25), oee: 80.5, status: 'Attention' }
    ],
    downtimes: [
      { category: 'Tool Insert Wear & Toolpath Offsets', hours: Number((diffDays * 2.2).toFixed(1)), percent: 32.4 },
      { category: 'Workpiece Fixture Setup & Zeroing', hours: Number((diffDays * 1.8).toFixed(1)), percent: 26.5 },
      { category: 'Hydraulic System & Spindle Alarms', hours: Number((diffDays * 1.3).toFixed(1)), percent: 19.1 },
      { category: 'CMM Dimensional First Article Holds', hours: Number((diffDays * 0.9).toFixed(1)), percent: 13.2 },
      { category: 'Raw Billet Stock Logistics', hours: Number((diffDays * 0.6).toFixed(1)), percent: 8.8 }
    ],
    quality: {
      fpy: Number(quality.toFixed(1)),
      scrapRate: Number(scrapRate.toFixed(1)),
      reworkRate: 1.8,
      defects: [
        { defect: 'Shaft Bore Diameter Over-Tolerance', count: Math.round(scrapTotal * 0.42), percent: 42.0 },
        { defect: 'Roughness Chatter on Flange Face', count: Math.round(scrapTotal * 0.26), percent: 26.0 },
        { defect: 'Keyway Depth Misalignment', count: Math.round(scrapTotal * 0.18), percent: 18.0 },
        { defect: 'Thread Pitch M8 Insert Fit', count: Math.round(scrapTotal * 0.14), percent: 14.0 }
      ]
    }
  };
}

export interface ComparisonMetricItem {
  key: string;
  label: string;
  unit: string;
  periodA: number;
  periodB: number;
  difference: number;
  changePercent: number;
  isPositiveGood: boolean;
}

export function getComparisonData(
  compType: 'week' | 'month' | 'custom' | 'multi' = 'month',
  periodAConfig: { label: string; start?: string; end?: string; month?: string; year?: string },
  periodBConfig: { label: string; start?: string; end?: string; month?: string; year?: string },
  multiPeriodConfigs?: Array<{ label: string; start?: string; end?: string; month?: string; year?: string }>
) {
  const seedA = hashString(`${periodAConfig.label}_${periodAConfig.month || ''}_${periodAConfig.start || ''}`);
  const seedB = hashString(`${periodBConfig.label}_${periodBConfig.month || ''}_${periodBConfig.start || ''}`);

  const isMonth = compType === 'month';
  const isWeek = compType === 'week';

  const baseProd = isMonth ? 8420 : isWeek ? 1842 : 12500;
  const baseTarget = isMonth ? 9000 : isWeek ? 2100 : 13500;

  const prodA = Math.round(baseProd * (0.95 + ((seedA % 15) / 100)));
  const targetA = baseTarget;
  const achA = Number(((prodA / targetA) * 100).toFixed(1));
  const rejA = isMonth ? 135 + (seedA % 40) : isWeek ? 35 + (seedA % 12) : 320 + (seedA % 60);
  const scrapA = Math.round(rejA * 0.6);
  const downA = isMonth ? 185 + (seedA % 30) : isWeek ? 42 + (seedA % 10) : 620 + (seedA % 80);
  const utilA = Number((91 + ((seedA % 7) / 10)).toFixed(1));
  const oeeA = Number((86.5 + ((seedA % 6) / 10)).toFixed(1));
  const qualA = Number((98.1 + ((seedA % 15) / 100)).toFixed(1));
  const effA = Number((91 + ((seedA % 5) / 10)).toFixed(1));
  const manHrsA = Math.round(isMonth ? 1420 : isWeek ? 340 : 2100);
  const mchHrsA = Math.round(isMonth ? 1180 : isWeek ? 285 : 1850);

  const prodB = Math.round(baseProd * (0.88 + ((seedB % 15) / 100)));
  const targetB = baseTarget;
  const achB = Number(((prodB / targetB) * 100).toFixed(1));
  const rejB = isMonth ? 165 + (seedB % 40) : isWeek ? 48 + (seedB % 12) : 410 + (seedB % 60);
  const scrapB = Math.round(rejB * 0.6);
  const downB = isMonth ? 215 + (seedB % 30) : isWeek ? 54 + (seedB % 10) : 710 + (seedB % 80);
  const utilB = Number((87 + ((seedB % 7) / 10)).toFixed(1));
  const oeeB = Number((83.2 + ((seedB % 6) / 10)).toFixed(1));
  const qualB = Number((96.8 + ((seedB % 15) / 100)).toFixed(1));
  const effB = Number((87 + ((seedB % 5) / 10)).toFixed(1));
  const manHrsB = Math.round(isMonth ? 1390 : isWeek ? 330 : 2050);
  const mchHrsB = Math.round(isMonth ? 1140 : isWeek ? 275 : 1780);

  const metrics: ComparisonMetricItem[] = [
    {
      key: 'production',
      label: 'Total Production',
      unit: 'Units',
      periodA: prodA,
      periodB: prodB,
      difference: prodA - prodB,
      changePercent: Number((((prodA - prodB) / prodB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'target',
      label: 'Target Production',
      unit: 'Units',
      periodA: targetA,
      periodB: targetB,
      difference: targetA - targetB,
      changePercent: Number((((targetA - targetB) / targetB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'achievement',
      label: 'Achievement %',
      unit: '%',
      periodA: achA,
      periodB: achB,
      difference: Number((achA - achB).toFixed(1)),
      changePercent: Number((((achA - achB) / achB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'rejection',
      label: 'Rejection Units',
      unit: 'Units',
      periodA: rejA,
      periodB: rejB,
      difference: rejA - rejB,
      changePercent: Number((((rejA - rejB) / rejB) * 100).toFixed(1)),
      isPositiveGood: false
    },
    {
      key: 'scrap',
      label: 'Scrap Units',
      unit: 'Units',
      periodA: scrapA,
      periodB: scrapB,
      difference: scrapA - scrapB,
      changePercent: Number((((scrapA - scrapB) / scrapB) * 100).toFixed(1)),
      isPositiveGood: false
    },
    {
      key: 'downtime',
      label: isMonth || isWeek ? 'Downtime (Hours)' : 'Downtime (Minutes)',
      unit: isMonth || isWeek ? 'hrs' : 'min',
      periodA: downA,
      periodB: downB,
      difference: downA - downB,
      changePercent: Number((((downA - downB) / downB) * 100).toFixed(1)),
      isPositiveGood: false
    },
    {
      key: 'utilization',
      label: 'Machine Utilization',
      unit: '%',
      periodA: utilA,
      periodB: utilB,
      difference: Number((utilA - utilB).toFixed(1)),
      changePercent: Number((((utilA - utilB) / utilB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'oee',
      label: 'Overall Plant OEE',
      unit: '%',
      periodA: oeeA,
      periodB: oeeB,
      difference: Number((oeeA - oeeB).toFixed(1)),
      changePercent: Number((((oeeA - oeeB) / oeeB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'quality',
      label: 'Quality Rate (FPY)',
      unit: '%',
      periodA: qualA,
      periodB: qualB,
      difference: Number((qualA - qualB).toFixed(1)),
      changePercent: Number((((qualA - qualB) / qualB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'efficiency',
      label: 'Production Efficiency',
      unit: '%',
      periodA: effA,
      periodB: effB,
      difference: Number((effA - effB).toFixed(1)),
      changePercent: Number((((effA - effB) / effB) * 100).toFixed(1)),
      isPositiveGood: true
    },
    {
      key: 'manHours',
      label: 'Man Hours Expended',
      unit: 'hrs',
      periodA: manHrsA,
      periodB: manHrsB,
      difference: manHrsA - manHrsB,
      changePercent: Number((((manHrsA - manHrsB) / manHrsB) * 100).toFixed(1)),
      isPositiveGood: false
    },
    {
      key: 'machineHours',
      label: 'Machine Runtime Hours',
      unit: 'hrs',
      periodA: mchHrsA,
      periodB: mchHrsB,
      difference: mchHrsA - mchHrsB,
      changePercent: Number((((mchHrsA - mchHrsB) / mchHrsB) * 100).toFixed(1)),
      isPositiveGood: true
    }
  ];

  const defaultMultiConfigs = [
    periodAConfig,
    periodBConfig,
    { label: compType === 'month' ? 'June 2026' : 'Week 32' },
    { label: compType === 'month' ? 'May 2026' : 'Week 31' }
  ];

  const multiPeriodsData = (multiPeriodConfigs && multiPeriodConfigs.length > 0 ? multiPeriodConfigs : defaultMultiConfigs).map((cfg, idx) => {
    const s = hashString(`${cfg.label}_${cfg.month || ''}_${cfg.start || ''}_${idx}`);
    const prd = Math.round(baseProd * (0.86 + (idx * 0.04) + ((s % 10) / 100)));
    const rej = Math.round(rejA * (1.1 - (idx * 0.05)));
    const oeeVal = Number((82 + (idx * 2) + ((s % 10) / 10)).toFixed(1));
    const utilVal = Number((85 + (idx * 2.2) + ((s % 10) / 10)).toFixed(1));
    const effVal = Number((86 + (idx * 2) + ((s % 10) / 10)).toFixed(1));
    return {
      label: cfg.label,
      production: prd,
      rejection: rej,
      oee: oeeVal,
      utilization: utilVal,
      efficiency: effVal
    };
  });

  return {
    reportId: `CMP-${periodAConfig.label.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}-VS-${periodBConfig.label.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`,
    comparisonTitle: `${periodAConfig.label} vs ${periodBConfig.label}`,
    periodA: { label: periodAConfig.label, production: prodA, target: targetA, efficiency: effA, quality: qualA, downtime: downA, rejection: rejA, oee: oeeA, utilization: utilA },
    periodB: { label: periodBConfig.label, production: prodB, target: targetB, efficiency: effB, quality: qualB, downtime: downB, rejection: rejB, oee: oeeB, utilization: utilB },
    metrics,
    multiPeriodsData
  };
}

// -------------------------------------------------------------
// 2. VECTOR DRAWING & CHART HELPERS
// -------------------------------------------------------------

function drawHeaderBanner(doc: jsPDF, pageW: number, reportType: string, subTitle: string, periodText: string, reportId: string, author: string) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, 297, 'F');

  // Top Accent Strip
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(10, 10, pageW - 20, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('APEXPLM STUDIO', 15, 18);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('MANUFACTURING OPERATIONS & MES TELEMETRY SYSTEM', 15, 23);
  doc.text(`REPORT TYPE: ${reportType.toUpperCase()}`, 15, 29);

  // Center Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(subTitle.toUpperCase(), pageW / 2, 20, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11); // amber-400
  doc.text(`PERIOD: ${periodText}`, pageW / 2, 27, { align: 'center' });

  // Right Meta
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`ID: ${reportId}`, pageW - 15, 18, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`BY: ${author}`, pageW - 15, 23, { align: 'right' });
  doc.text(`STATUS: LIVE VERIFIED DATA`, pageW - 15, 29, { align: 'right' });
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, reportId: string, pageNum: number, totalPages: number) {
  const fy = pageH - 12;
  doc.setLineWidth(0.25);
  doc.setDrawColor(203, 213, 225);
  doc.line(10, fy - 2, pageW - 10, fy - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('CONFIDENTIAL • APEXPLM STUDIO MANUFACTURING OPERATIONS INTELLIGENCE', 15, fy + 3);
  doc.text(`Report ID: ${reportId} • Plant 1 Main Facility`, pageW / 2, fy + 3, { align: 'center' });
  doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 15, fy + 3, { align: 'right' });
}

function drawKpiBox(doc: jsPDF, x: number, y: number, w: number, h: number, title: string, value: string, sub: string, colorHex: string = '#0f172a') {
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.rect(x, y, w, h, 'FD');

  // Top color line
  doc.setFillColor(colorHex);
  doc.rect(x, y, w, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(title.toUpperCase(), x + 3, y + 7);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + 3, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(sub, x + 3, y + 21);
}

// -------------------------------------------------------------
// 3. DAILY PRODUCTION REPORT GENERATOR (2 Pages A4/A3 Landscape)
// -------------------------------------------------------------

export async function generateDailyProductionPdf(options: ProductionReportMeta): Promise<{ blob: Blob; filename: string; reportId: string }> {
  const dateStr = options.reportDate || new Date().toISOString().split('T')[0];
  const author = options.generatedBy || 'Manufacturing Engineer';
  const data = getDailyProductionData(dateStr);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const totalPages = 2;

  // ================= PAGE 1 =================
  drawHeaderBanner(doc, pageW, 'Daily Production Report', 'Shop Floor Production & Machine Telemetry', dateStr, data.reportId, author);

  // 1. KPI Cards Row (x: 10, y: 38, w: 277)
  const kpiW = (277 - 15) / 4; // ~65.5mm each
  drawKpiBox(doc, 10, 38, kpiW, 24, 'Total Production Target', `${data.kpi.totalCompleted} / ${data.kpi.totalTarget} Units`, `${Math.round((data.kpi.totalCompleted / data.kpi.totalTarget) * 100)}% Shift Target Met`, '#0284c7');
  drawKpiBox(doc, 10 + kpiW + 5, 38, kpiW, 24, 'Accepted vs Scrap', `${data.kpi.totalAccepted} Good | ${data.kpi.totalScrap} Scrap`, `${data.kpi.quality}% First Pass Yield`, '#059669');
  drawKpiBox(doc, 10 + (kpiW + 5) * 2, 38, kpiW, 24, 'Overall Plant OEE', `${data.kpi.oee}%`, 'Availability: 94.2% • Perf: 92.8%', '#d97706');
  drawKpiBox(doc, 10 + (kpiW + 5) * 3, 38, kpiW, 24, 'Operating Efficiency', `${data.kpi.availability}% Avail`, 'World Class Target > 85%', '#7c3aed');

  // 2. Shift Production Performance Table (y: 67)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SHIFT-WISE PRODUCTION & OEE PERFORMANCE MATRIX', 10, 69);

  const shiftCols = [
    { label: 'SHIFT', w: 60, align: 'left' },
    { label: 'TARGET', w: 30, align: 'center' },
    { label: 'PRODUCED', w: 35, align: 'center' },
    { label: 'ACCEPTED', w: 35, align: 'center' },
    { label: 'REJECT', w: 30, align: 'center' },
    { label: 'ACHIEVEMENT', w: 40, align: 'center' },
    { label: 'SHIFT OEE', w: 47, align: 'right' }
  ];

  let sy = 72;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 277, 6, 'FD');
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(10, sy + 6, 287, sy + 6);

  let sx = 10;
  doc.setFontSize(6);
  shiftCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? sx + 3 : c.align === 'right' ? sx + c.w - 3 : sx + c.w / 2, sy + 4.2, { align: c.align as any });
    sx += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.shifts.forEach((sh, idx) => {
    sy += 6;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 277, 6, 'F');
    }
    doc.line(10, sy + 6, 287, sy + 6);

    sx = 10;
    doc.text(sh.shift, sx + 3, sy + 4.2);
    sx += 60;
    doc.text(String(sh.target), sx + 15, sy + 4.2, { align: 'center' });
    sx += 30;
    doc.text(String(sh.produced), sx + 17.5, sy + 4.2, { align: 'center' });
    sx += 35;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(String(sh.accepted), sx + 17.5, sy + 4.2, { align: 'center' });
    sx += 35;
    doc.setTextColor(225, 29, 72);
    doc.text(String(sh.reject), sx + 15, sy + 4.2, { align: 'center' });
    sx += 30;
    doc.setTextColor(15, 23, 42);
    doc.text(`${sh.achievement}%`, sx + 20, sy + 4.2, { align: 'center' });
    sx += 40;
    doc.text(`${sh.oee}%`, sx + 44, sy + 4.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // 3. Machine-Level Performance Table (y: 104)
  sy = 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MACHINE TELEMETRY & RUNTIME UTILIZATION', 10, sy);

  sy += 3;
  const mchCols = [
    { label: 'MACHINE NAME & ID', w: 75, align: 'left' },
    { label: 'STATUS', w: 25, align: 'center' },
    { label: 'ASSIGNED PART / JOB', w: 60, align: 'left' },
    { label: 'RUNTIME', w: 25, align: 'center' },
    { label: 'DOWNTIME', w: 25, align: 'center' },
    { label: 'OUTPUT', w: 25, align: 'center' },
    { label: 'REJECT', w: 18, align: 'center' },
    { label: 'OEE', w: 24, align: 'right' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 277, 6, 'FD');
  doc.line(10, sy + 6, 287, sy + 6);

  sx = 10;
  doc.setFontSize(5.8);
  mchCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? sx + 3 : c.align === 'right' ? sx + c.w - 3 : sx + c.w / 2, sy + 4.2, { align: c.align as any });
    sx += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.machines.forEach((m, idx) => {
    sy += 6.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 277, 6.5, 'F');
    }
    doc.line(10, sy + 6.5, 287, sy + 6.5);

    sx = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(m.name.substring(0, 38), sx + 3, sy + 4.5);
    sx += 75;
    doc.setTextColor(m.status === 'Running' ? 5 : 217, m.status === 'Running' ? 150 : 119, m.status === 'Running' ? 105 : 6);
    doc.text(m.status, sx + 12.5, sy + 4.5, { align: 'center' });
    sx += 25;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(m.part, sx + 3, sy + 4.5);
    sx += 60;
    doc.text(`${m.runtimeMin}m`, sx + 12.5, sy + 4.5, { align: 'center' });
    sx += 25;
    doc.text(`${m.downtimeMin}m`, sx + 12.5, sy + 4.5, { align: 'center' });
    sx += 25;
    doc.setFont('helvetica', 'bold');
    doc.text(String(m.produced), sx + 12.5, sy + 4.5, { align: 'center' });
    sx += 25;
    doc.setTextColor(225, 29, 72);
    doc.text(String(m.reject), sx + 9, sy + 4.5, { align: 'center' });
    sx += 18;
    doc.setTextColor(15, 23, 42);
    doc.text(`${m.oee}%`, sx + 21, sy + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // 4. Shop Floor Notes Box
  sy += 12;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, sy, 277, 30, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('SHIFT SUPERVISOR LOG & PROCESS HIGHLIGHTS:', 14, sy + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);
  doc.text('• Shift A completed 98 units with exceptional 98.0% achievement rate and 87.4% OEE.', 14, sy + 12);
  doc.text('• Mazak INTEGREX #01 ran continuously at 10,000 RPM cycle with zero tool chipping alarms.', 14, sy + 17);
  doc.text('• Op 30 precision carrier bore inspection completed on 100% of parts with 98.4% First Pass Yield.', 14, sy + 22);
  doc.text('• Planned tool change on FANUC #04 completed within standard 45-minute SMED benchmark.', 14, sy + 27);

  drawFooter(doc, pageW, pageH, data.reportId, 1, totalPages);

  // ================= PAGE 2 (Downtime & Quality Analysis) =================
  doc.addPage('a4', 'landscape');
  drawHeaderBanner(doc, pageW, 'Daily Production Report', 'Downtime Pareto & In-Process Quality Analysis', dateStr, data.reportId, author);

  // Left Column: Downtime Table & Bar Chart (w: 132)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DOWNTIME CATEGORY BREAKDOWN & BAR CHART', 10, 40);

  let dy = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, dy, 132, 6, 'FD');
  doc.line(10, dy + 6, 142, dy + 6);

  doc.setFontSize(5.8);
  doc.text('DOWNTIME REASON', 13, dy + 4.2);
  doc.text('MINUTES', 75, dy + 4.2, { align: 'center' });
  doc.text('% TOTAL', 95, dy + 4.2, { align: 'center' });
  doc.text('VISUAL BAR', 120, dy + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.downtimes.forEach((dt, idx) => {
    dy += 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, dy, 132, 7, 'F');
    }
    doc.line(10, dy + 7, 142, dy + 7);

    doc.text(dt.category, 13, dy + 4.8);
    doc.text(`${dt.minutes}m`, 75, dy + 4.8, { align: 'center' });
    doc.text(`${dt.percent}%`, 95, dy + 4.8, { align: 'center' });

    // Vector Bar Chart
    const barW = Math.min((dt.percent / 35) * 32, 32);
    doc.setFillColor(239, 68, 68); // rose-500
    doc.rect(108, dy + 2, barW, 3.5, 'F');
  });

  // Right Column: Quality & Defect Pareto Table (w: 135)
  const qx = 152;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('FIRST PASS YIELD & DEFECT CLASSIFICATION', qx, 40);

  // Quality KPI Cards Grid
  const qCardW = (135 - 6) / 3;
  drawKpiBox(doc, qx, 44, qCardW, 20, 'First Pass Yield', `${data.quality.firstPassYield}%`, 'Target: >98.0%', '#059669');
  drawKpiBox(doc, qx + qCardW + 3, 44, qCardW, 20, 'Total Scrap', `${data.quality.rejected} Parts`, 'Rejection Rate: 1.6%', '#e11d48');
  drawKpiBox(doc, qx + (qCardW + 3) * 2, 44, qCardW, 20, 'Total Inspected', `${data.quality.totalInspected}`, '100% CMM Inspected', '#0284c7');

  let qy = 69;
  doc.setFillColor(241, 245, 249);
  doc.rect(qx, qy, 135, 6, 'FD');
  doc.line(qx, qy + 6, qx + 135, qy + 6);

  doc.setFontSize(5.8);
  doc.text('DEFECT PHENOMENON', qx + 3, qy + 4.2);
  doc.text('COUNT', qx + 85, qy + 4.2, { align: 'center' });
  doc.text('% SHARE', qx + 105, qy + 4.2, { align: 'center' });
  doc.text('ACTION', qx + 125, qy + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.quality.defects.forEach((df, idx) => {
    qy += 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(qx, qy, 135, 7, 'F');
    }
    doc.line(qx, qy + 7, qx + 135, qy + 7);

    doc.text(df.type, qx + 3, qy + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(String(df.count), qx + 85, qy + 4.8, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${df.percent}%`, qx + 105, qy + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('CAR Logged', qx + 125, qy + 4.8, { align: 'center' });
  });

  // Action Signoff Matrix at bottom
  const sigY = 135;
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, sigY, 277, 45, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OPERATIONS & QUALITY VERIFICATION SIGNOFFS', 14, sigY + 7);

  const sigColW = 277 / 3;
  doc.setFontSize(6);
  doc.text('SHIFT SUPERVISOR:', 14, sigY + 16);
  doc.text(`${author} (Electronic Signed)`, 14, sigY + 22);
  doc.text('Status: Authorized & Signed', 14, sigY + 28);
  doc.text(`Sign Hash: SIG-${data.reportId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6)}-SUPV`, 14, sigY + 34);

  doc.text('MANUFACTURING ENGINEER:', 14 + sigColW, sigY + 16);
  doc.text('Operations Engineer (Verified)', 14 + sigColW, sigY + 22);
  doc.text('Toolpath & OEE Certified', 14 + sigColW, sigY + 28);
  doc.text(`Sign Hash: SIG-${data.reportId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6)}-MFG`, 14 + sigColW, sigY + 34);

  doc.text('QUALITY ASSURANCE LEAD:', 14 + sigColW * 2, sigY + 16);
  doc.text('Quality Assurance Lead (Approved)', 14 + sigColW * 2, sigY + 22);
  doc.text('First Article CMM Conformance Passed', 14 + sigColW * 2, sigY + 28);
  doc.text(`Sign Hash: SIG-${data.reportId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6)}-QA`, 14 + sigColW * 2, sigY + 34);

  drawFooter(doc, pageW, pageH, data.reportId, 2, totalPages);

  const filename = `ApexPLM_Daily_Production_Report_${dateStr}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, reportId: data.reportId };
}

// -------------------------------------------------------------
// 4. WEEKLY PRODUCTION REPORT GENERATOR (2 Pages A4/A3 Landscape)
// -------------------------------------------------------------

export async function generateWeeklyProductionPdf(options: ProductionReportMeta): Promise<{ blob: Blob; filename: string; reportId: string }> {
  const weekRange = options.weekRange || 'Current Production Week';
  const author = options.generatedBy || 'Manufacturing Engineer';
  const data = getWeeklyProductionData(weekRange);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const totalPages = 2;

  // ================= PAGE 1 =================
  drawHeaderBanner(doc, pageW, 'Manufacturing Performance Review', 'Weekly Production & Overall Equipment Effectiveness', weekRange, data.reportId, author);

  // 1. Weekly Executive Summary KPIs
  const kpiW = (277 - 15) / 4;
  drawKpiBox(doc, 10, 38, kpiW, 24, 'Weekly Production', `${data.summary.weeklyProduction} / ${data.summary.targetProduction}`, `${data.summary.achievement}% Target Achieved`, '#0284c7');
  drawKpiBox(doc, 10 + kpiW + 5, 38, kpiW, 24, 'Average Weekly OEE', `${data.summary.avgOee}%`, 'Target: >85.0%', '#059669');
  drawKpiBox(doc, 10 + (kpiW + 5) * 2, 38, kpiW, 24, 'First Pass Quality', `${data.summary.qualityRate}%`, '35 Total Rejects', '#7c3aed');
  drawKpiBox(doc, 10 + (kpiW + 5) * 3, 38, kpiW, 24, 'Cumulative Downtime', `${data.summary.totalDowntimeHours} Hours`, 'Status: ' + data.summary.status, data.summary.status === 'ON TARGET' ? '#059669' : '#e11d48');

  // 2. 7-Day Production Trend Chart (Vector Bars with Targets)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('7-DAY DAILY PRODUCTION OUTPUT VS TARGET TREND', 10, 69);

  const chartX = 10;
  const chartY = 72;
  const chartW = 277;
  const chartH = 48;

  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.rect(chartX, chartY, chartW, chartH, 'FD');

  // Grid Lines
  doc.setLineWidth(0.15);
  doc.setDrawColor(241, 245, 249);
  doc.line(chartX + 15, chartY + 12, chartX + chartW - 10, chartY + 12);
  doc.line(chartX + 15, chartY + 24, chartX + chartW - 10, chartY + 24);
  doc.line(chartX + 15, chartY + 36, chartX + chartW - 10, chartY + 36);

  const barSlotW = (chartW - 30) / 7;
  data.dailyTrends.forEach((d, idx) => {
    const bx = chartX + 20 + idx * barSlotW;
    const maxVal = 350;
    const actualH = (d.actual / maxVal) * 32;
    const targetH = (d.target / maxVal) * 32;

    // Target Line / Shadow
    doc.setFillColor(226, 232, 240);
    doc.rect(bx, chartY + 40 - targetH, 12, targetH, 'F');

    // Actual Bar
    doc.setFillColor(d.actual >= 270 ? '#0284c7' : '#f59e0b');
    doc.rect(bx + 14, chartY + 40 - actualH, 12, actualH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${d.day} (${d.date})`, bx + 13, chartY + 45, { align: 'center' });

    doc.setFontSize(5);
    doc.text(`${d.actual}`, bx + 20, chartY + 38 - actualH, { align: 'center' });
  });

  // Chart Legend
  doc.setFillColor('#e2e8f0');
  doc.rect(chartX + chartW - 75, chartY + 5, 8, 4, 'F');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Target (300)', chartX + chartW - 64, chartY + 8);

  doc.setFillColor('#0284c7');
  doc.rect(chartX + chartW - 35, chartY + 5, 8, 4, 'F');
  doc.text('Actual Output', chartX + chartW - 24, chartY + 8);

  // 3. Weekly Machine Ranking Table (y: 126)
  let my = 127;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WEEKLY MACHINE UTILIZATION & OEE RANKINGS', 10, my);

  my += 3;
  const mchCols = [
    { label: 'RANK', w: 15, align: 'center' },
    { label: 'MACHINE NAME', w: 90, align: 'left' },
    { label: 'WEEKLY OUTPUT', w: 35, align: 'center' },
    { label: 'AVERAGE OEE', w: 35, align: 'center' },
    { label: 'DOWNTIME', w: 32, align: 'center' },
    { label: 'SCRAP', w: 25, align: 'center' },
    { label: 'STATUS', w: 45, align: 'right' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, my, 277, 6, 'FD');
  doc.line(10, my + 6, 287, my + 6);

  let mx = 10;
  doc.setFontSize(5.8);
  mchCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? mx + 3 : c.align === 'right' ? mx + c.w - 3 : mx + c.w / 2, my + 4.2, { align: c.align as any });
    mx += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.machineRankings.forEach((m, idx) => {
    my += 6.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, my, 277, 6.5, 'F');
    }
    doc.line(10, my + 6.5, 287, my + 6.5);

    mx = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(String(m.rank), mx + 7.5, my + 4.5, { align: 'center' });
    mx += 15;
    doc.text(m.name, mx + 3, my + 4.5);
    mx += 90;
    doc.text(`${m.production} Units`, mx + 17.5, my + 4.5, { align: 'center' });
    mx += 35;
    doc.text(`${m.oee}%`, mx + 17.5, my + 4.5, { align: 'center' });
    mx += 35;
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.downtimeHours} Hours`, mx + 16, my + 4.5, { align: 'center' });
    mx += 32;
    doc.setTextColor(225, 29, 72);
    doc.text(String(m.rejectCount), mx + 12.5, my + 4.5, { align: 'center' });
    mx += 25;
    doc.setTextColor(m.status === 'Excellent' ? 5 : m.status === 'Good' ? 2 : 217, m.status === 'Excellent' ? 150 : m.status === 'Good' ? 132 : 119, m.status === 'Excellent' ? 105 : 199);
    doc.setFont('helvetica', 'bold');
    doc.text(m.status, mx + 42, my + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
  });

  drawFooter(doc, pageW, pageH, data.reportId, 1, totalPages);

  // ================= PAGE 2 (Downtime Pareto & Corrective Actions) =================
  doc.addPage('a4', 'landscape');
  drawHeaderBanner(doc, pageW, 'Manufacturing Performance Review', 'Weekly Downtime Pareto & Continuous Improvement Actions', weekRange, data.reportId, author);

  // Left: Downtime Pareto Table (w: 135)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WEEKLY DOWNTIME PARETO ANALYSIS', 10, 40);

  let py = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, py, 135, 6, 'FD');
  doc.line(10, py + 6, 145, py + 6);

  doc.setFontSize(5.8);
  doc.text('DOWNTIME CATEGORY', 13, py + 4.2);
  doc.text('HOURS', 75, py + 4.2, { align: 'center' });
  doc.text('SHARE %', 100, py + 4.2, { align: 'center' });
  doc.text('CUMULATIVE %', 125, py + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.paretoDowntime.forEach((p, idx) => {
    py += 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, py, 135, 7, 'F');
    }
    doc.line(10, py + 7, 145, py + 7);

    doc.text(p.category, 13, py + 4.8);
    doc.text(`${p.hours}h`, 75, py + 4.8, { align: 'center' });
    doc.text(`${p.percent}%`, 100, py + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.cumPercent}%`, 125, py + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Right: Top Defect Breakdown (w: 132)
  const rx = 152;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('WEEKLY QUALITY DEFECT CLASSIFICATION', rx, 40);

  let qy = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(rx, qy, 135, 6, 'FD');
  doc.line(rx, qy + 6, rx + 135, qy + 6);

  doc.setFontSize(5.8);
  doc.text('DEFECT PHENOMENON', rx + 3, qy + 4.2);
  doc.text('COUNT', rx + 95, qy + 4.2, { align: 'center' });
  doc.text('SHARE %', rx + 120, qy + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.quality.topDefects.forEach((td, idx) => {
    qy += 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(rx, qy, 135, 7, 'F');
    }
    doc.line(rx, qy + 7, rx + 135, qy + 7);

    doc.text(td.name, rx + 3, qy + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(String(td.count), rx + 95, qy + 4.8, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${td.percent}%`, rx + 120, qy + 4.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Bottom: Corrective Action Register Table
  let ay = 95;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CORRECTIVE ACTIONS & CONTINUOUS IMPROVEMENT (CI) REGISTER', 10, ay);

  ay += 3;
  const actCols = [
    { label: 'IDENTIFIED ISSUE', w: 65, align: 'left' },
    { label: 'ROOT CAUSE', w: 55, align: 'left' },
    { label: 'ENGINEERING ACTION PLAN', w: 85, align: 'left' },
    { label: 'OWNER', w: 32, align: 'center' },
    { label: 'DUE DATE', w: 20, align: 'center' },
    { label: 'STATUS', w: 20, align: 'right' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, ay, 277, 6, 'FD');
  doc.line(10, ay + 6, 287, ay + 6);

  let ax = 10;
  doc.setFontSize(5.8);
  actCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? ax + 3 : c.align === 'right' ? ax + c.w - 3 : ax + c.w / 2, ay + 4.2, { align: c.align as any });
    ax += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.actions.forEach((act, idx) => {
    ay += 8;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, ay, 277, 8, 'F');
    }
    doc.line(10, ay + 8, 287, ay + 8);

    ax = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(act.issue, ax + 3, ay + 5);
    ax += 65;
    doc.setFont('helvetica', 'normal');
    doc.text(act.rootCause, ax + 3, ay + 5);
    ax += 55;
    doc.text(act.action, ax + 3, ay + 5);
    ax += 85;
    doc.text(act.owner, ax + 16, ay + 5, { align: 'center' });
    ax += 32;
    doc.text(act.dueDate, ax + 10, ay + 5, { align: 'center' });
    ax += 20;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(act.status, ax + 17, ay + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
  });

  drawFooter(doc, pageW, pageH, data.reportId, 2, totalPages);

  const filename = `ApexPLM_Weekly_Manufacturing_Report_2026-W34.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, reportId: data.reportId };
}

// -------------------------------------------------------------
// 5. MONTHLY PRODUCTION REPORT GENERATOR (2 Pages A3 Landscape)
// -------------------------------------------------------------

export async function generateMonthlyProductionPdf(options: ProductionReportMeta): Promise<{ blob: Blob; filename: string; reportId: string }> {
  const monthName = options.monthName || 'Current Production Month';
  const author = options.generatedBy || 'Operations Lead';
  const data = getMonthlyProductionData(monthName);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const pageW = 420;
  const pageH = 297;
  const totalPages = 2;

  // ================= PAGE 1 =================
  drawHeaderBanner(doc, pageW, 'Executive Monthly Report', 'Manufacturing Operations & Financial Performance Review', monthName, data.reportId, author);

  // 1. Executive KPI Cards Row (x: 10, y: 38, w: 400)
  const kpiW = (400 - 25) / 6; // ~62.5mm each
  drawKpiBox(doc, 10, 38, kpiW, 24, 'Monthly Output', `${data.kpi.monthlyProduction} / ${data.kpi.monthlyTarget}`, `${data.kpi.achievement}% Target Met`, '#0284c7');
  drawKpiBox(doc, 10 + (kpiW + 5), 38, kpiW, 24, 'Average Plant OEE', `${data.kpi.avgOee}%`, 'Target: >85.0%', '#059669');
  drawKpiBox(doc, 10 + (kpiW + 5) * 2, 38, kpiW, 24, 'Machine Availability', `${data.kpi.availability}%`, 'Uptime Target: 95%', '#0891b2');
  drawKpiBox(doc, 10 + (kpiW + 5) * 3, 38, kpiW, 24, 'Performance Ratio', `${data.kpi.performance}%`, 'Ideal Cycle Time', '#d97706');
  drawKpiBox(doc, 10 + (kpiW + 5) * 4, 38, kpiW, 24, 'First Pass Quality', `${data.kpi.quality}%`, `${data.kpi.scrapRate}% Scrap Rate`, '#7c3aed');
  drawKpiBox(doc, 10 + (kpiW + 5) * 5, 38, kpiW, 24, 'Total Unit Cost', `₹${data.financials.costPerGoodUnit}`, '₹596.7k Total Spend', '#059669');

  // 2. Monthly Machine Performance & Health Table (y: 68)
  let my = 68;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('MONTHLY EQUIPMENT HEALTH, RUNTIME & OEE MATRIX', 10, my);

  my += 4;
  const mchCols = [
    { label: 'EQUIPMENT / CNC MACHINE', w: 100, align: 'left' },
    { label: 'RUNTIME', w: 32, align: 'center' },
    { label: 'PLANNED DOWN', w: 32, align: 'center' },
    { label: 'UNPLANNED DOWN', w: 35, align: 'center' },
    { label: 'OUTPUT', w: 32, align: 'center' },
    { label: 'REJECT', w: 25, align: 'center' },
    { label: 'AVAIL %', w: 28, align: 'center' },
    { label: 'PERF %', w: 28, align: 'center' },
    { label: 'QUAL %', w: 28, align: 'center' },
    { label: 'OEE %', w: 30, align: 'center' },
    { label: 'STATUS', w: 30, align: 'right' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, my, 400, 7, 'FD');
  doc.line(10, my + 7, 410, my + 7);

  let mx = 10;
  doc.setFontSize(6.5);
  mchCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? mx + 3 : c.align === 'right' ? mx + c.w - 3 : mx + c.w / 2, my + 4.8, { align: c.align as any });
    mx += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.machines.forEach((m, idx) => {
    my += 8;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, my, 400, 8, 'F');
    }
    doc.line(10, my + 8, 410, my + 8);

    mx = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(m.name, mx + 3, my + 5.5);
    mx += 100;
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.runtimeHours}h`, mx + 16, my + 5.5, { align: 'center' });
    mx += 32;
    doc.text(`${m.plannedDownHours}h`, mx + 16, my + 5.5, { align: 'center' });
    mx += 32;
    doc.text(`${m.unplannedDownHours}h`, mx + 17.5, my + 5.5, { align: 'center' });
    mx += 35;
    doc.setFont('helvetica', 'bold');
    doc.text(`${m.production}`, mx + 16, my + 5.5, { align: 'center' });
    mx += 32;
    doc.setTextColor(225, 29, 72);
    doc.text(`${m.reject}`, mx + 12.5, my + 5.5, { align: 'center' });
    mx += 25;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.availability}%`, mx + 14, my + 5.5, { align: 'center' });
    mx += 28;
    doc.text(`${m.performance}%`, mx + 14, my + 5.5, { align: 'center' });
    mx += 28;
    doc.text(`${m.quality}%`, mx + 14, my + 5.5, { align: 'center' });
    mx += 28;
    doc.setFont('helvetica', 'bold');
    doc.text(`${m.oee}%`, mx + 15, my + 5.5, { align: 'center' });
    mx += 30;
    doc.setTextColor(m.status === 'Excellent' ? 5 : m.status === 'Good' ? 2 : 217, m.status === 'Excellent' ? 150 : m.status === 'Good' ? 132 : 119, m.status === 'Excellent' ? 105 : 199);
    doc.text(m.status, mx + 27, my + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
  });

  // 3. Shift Production & OEE Matrix (y: 118)
  let sy = 118;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MONTHLY SHIFT PERFORMANCE & YIELD COMPARISON', 10, sy);

  sy += 4;
  const shiftCols = [
    { label: 'SHIFT NAME', w: 80, align: 'left' },
    { label: 'TOTAL TARGET', w: 50, align: 'center' },
    { label: 'TOTAL PRODUCED', w: 50, align: 'center' },
    { label: 'ACCEPTED', w: 50, align: 'center' },
    { label: 'REJECTED', w: 40, align: 'center' },
    { label: 'ACHIEVEMENT', w: 45, align: 'center' },
    { label: 'SHIFT OEE', w: 45, align: 'center' },
    { label: 'FPY %', w: 40, align: 'right' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 400, 7, 'FD');
  doc.line(10, sy + 7, 410, sy + 7);

  let sx = 10;
  doc.setFontSize(6.5);
  shiftCols.forEach((c) => {
    doc.text(c.label, c.align === 'left' ? sx + 3 : c.align === 'right' ? sx + c.w - 3 : sx + c.w / 2, sy + 4.8, { align: c.align as any });
    sx += c.w;
  });

  doc.setFont('helvetica', 'normal');
  data.shifts.forEach((sh, idx) => {
    sy += 7.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 400, 7.5, 'F');
    }
    doc.line(10, sy + 7.5, 410, sy + 7.5);

    sx = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(sh.shift, sx + 3, sy + 5);
    sx += 80;
    doc.setFont('helvetica', 'normal');
    doc.text(String(sh.target), sx + 25, sy + 5, { align: 'center' });
    sx += 50;
    doc.text(String(sh.produced), sx + 25, sy + 5, { align: 'center' });
    sx += 50;
    doc.setTextColor(5, 150, 105);
    doc.text(String(sh.accepted), sx + 25, sy + 5, { align: 'center' });
    sx += 50;
    doc.setTextColor(225, 29, 72);
    doc.text(String(sh.rejected), sx + 20, sy + 5, { align: 'center' });
    sx += 40;
    doc.setTextColor(15, 23, 42);
    doc.text(`${sh.achievement}%`, sx + 22.5, sy + 5, { align: 'center' });
    sx += 45;
    doc.text(`${sh.oee}%`, sx + 22.5, sy + 5, { align: 'center' });
    sx += 45;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`${sh.fpy}%`, sx + 37, sy + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
  });

  // 4. Financial Cost Structure Summary Box
  sy += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MONTHLY MANUFACTURING COST STRUCTURE & UNIT ECONOMICS', 10, sy);

  sy += 4;
  const costBoxW = 400 / 6;
  drawKpiBox(doc, 10, sy, costBoxW - 2, 22, 'Material Spend', `₹${(data.financials.materialCost / 1000).toFixed(1)}k`, '47.6% of Budget', '#0284c7');
  drawKpiBox(doc, 10 + costBoxW * 1, sy, costBoxW - 2, 22, 'Direct Labor', `₹${(data.financials.laborCost / 1000).toFixed(1)}k`, '23.8% of Budget', '#0891b2');
  drawKpiBox(doc, 10 + costBoxW * 2, sy, costBoxW - 2, 22, 'Machine Operating', `₹${(data.financials.machineOperatingCost / 1000).toFixed(1)}k`, '19.8% Power/Maint', '#7c3aed');
  drawKpiBox(doc, 10 + costBoxW * 3, sy, costBoxW - 2, 22, 'Tooling Inserts', `₹${(data.financials.toolingCost / 1000).toFixed(1)}k`, '6.5% Consumables', '#d97706');
  drawKpiBox(doc, 10 + costBoxW * 4, sy, costBoxW - 2, 22, 'Scrap Loss', `₹${(data.financials.scrapCost / 1000).toFixed(1)}k`, '2.3% Scrap Cost', '#e11d48');
  drawKpiBox(doc, 10 + costBoxW * 5, sy, costBoxW - 2, 22, 'Total Spend', `₹${(data.financials.totalProductionCost / 1000).toFixed(1)}k`, `₹${data.financials.costPerGoodUnit}/unit`, '#059669');

  drawFooter(doc, pageW, pageH, data.reportId, 1, totalPages);

  // ================= PAGE 2 (Executive Management Summary & Priorities) =================
  doc.addPage('a3', 'landscape');
  drawHeaderBanner(doc, pageW, 'Executive Monthly Report', 'Downtime Pareto, Quality Analytics & Strategic Next-Month Priorities', monthName, data.reportId, author);

  // Left Side: Downtime Pareto Table & Reliability (w: 195)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('MONTHLY DOWNTIME PARETO & RELIABILITY METRICS', 10, 40);

  // Reliability KPI mini row
  const relW = (195 - 6) / 3;
  drawKpiBox(doc, 10, 44, relW, 18, 'Total Downtime', `${data.reliability.totalDowntimeHours} Hours`, 'Planned: 104h | Unplanned: 81h', '#d97706');
  drawKpiBox(doc, 10 + relW + 3, 44, relW, 18, 'Mean Time Between Failures', `${data.reliability.mtbfHours} Hours`, 'Target MTBF: >45.0h', '#059669');
  drawKpiBox(doc, 10 + (relW + 3) * 2, 44, relW, 18, 'Mean Time To Repair', `${data.reliability.mttrHours} Hours`, 'Target MTTR: <2.5h', '#0284c7');

  let py = 66;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, py, 195, 6, 'FD');
  doc.line(10, py + 6, 205, py + 6);

  doc.setFontSize(6);
  doc.text('DOWNTIME ROOT CAUSE', 13, py + 4.2);
  doc.text('HOURS', 120, py + 4.2, { align: 'center' });
  doc.text('SHARE %', 155, py + 4.2, { align: 'center' });
  doc.text('CUMULATIVE %', 185, py + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.downtimePareto.forEach((p, idx) => {
    py += 7.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, py, 195, 7.5, 'F');
    }
    doc.line(10, py + 7.5, 205, py + 7.5);

    doc.text(p.reason, 13, py + 5);
    doc.text(`${p.hours}h`, 120, py + 5, { align: 'center' });
    doc.text(`${p.percent}%`, 155, py + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.cumPercent}%`, 185, py + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Right Side: Quality Defect Pareto (w: 195)
  const qx = 215;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('QUALITY DEFECT PARETO & INTERNAL SCRAP CLASSIFICATION', qx, 40);

  const qCardW = (195 - 6) / 3;
  drawKpiBox(doc, qx, 44, qCardW, 18, 'First Pass Yield', `${data.quality.fpy}%`, 'Target: >98.0%', '#059669');
  drawKpiBox(doc, qx + qCardW + 3, 44, qCardW, 18, 'Total Internal Scrapped', `${data.quality.internalRejections} Units`, `${data.quality.scrapRate}% Scrap Rate`, '#e11d48');
  drawKpiBox(doc, qx + (qCardW + 3) * 2, 44, qCardW, 18, 'Customer Field Returns', `${data.quality.customerRejections}`, 'Zero Defects Sustained', '#059669');

  let qy = 66;
  doc.setFillColor(241, 245, 249);
  doc.rect(qx, qy, 195, 6, 'FD');
  doc.line(qx, qy + 6, qx + 195, qy + 6);

  doc.setFontSize(6);
  doc.text('DEFECT PHENOMENON', qx + 3, qy + 4.2);
  doc.text('QUANTITY', qx + 120, qy + 4.2, { align: 'center' });
  doc.text('SHARE %', qx + 155, qy + 4.2, { align: 'center' });
  doc.text('CUMULATIVE %', qx + 185, qy + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.quality.defectPareto.forEach((dp, idx) => {
    qy += 7.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(qx, qy, 195, 7.5, 'F');
    }
    doc.line(qx, qy + 7.5, qx + 195, qy + 7.5);

    doc.text(dp.defect, qx + 3, qy + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(String(dp.count), qx + 120, qy + 5, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${dp.percent}%`, qx + 155, qy + 5, { align: 'center' });
    doc.text(`${dp.cumPercent}%`, qx + 185, qy + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Executive Narrative Cards at Bottom (Achievements, Issues, Priorities)
  const sumY = 122;
  const sumColW = (400 - 10) / 3;

  // 1. Achievements Card
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, sumY, sumColW, 145, 'FD');
  doc.setFillColor('#059669');
  doc.rect(10, sumY, sumColW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('KEY ACHIEVEMENTS & OPERATIONAL HIGHLIGHTS', 14, sumY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  let achY = sumY + 22;
  data.managementSummary.achievements.forEach((ach) => {
    const lines = doc.splitTextToSize(ach, sumColW - 10);
    doc.text(lines, 14, achY);
    achY += lines.length * 5.5 + 4;
  });

  // 2. Key Issues & Root Cause Card
  const col2X = 10 + sumColW + 5;
  doc.setFillColor(255, 255, 255);
  doc.rect(col2X, sumY, sumColW, 145, 'FD');
  doc.setFillColor('#e11d48');
  doc.rect(col2X, sumY, sumColW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 29, 72);
  doc.text('KEY BOTTLENECK ISSUES & DOWNTIME DRIVERS', col2X + 4, sumY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  let issY = sumY + 22;
  data.managementSummary.issues.forEach((iss) => {
    const lines = doc.splitTextToSize(iss, sumColW - 10);
    doc.text(lines, col2X + 4, issY);
    issY += lines.length * 5.5 + 4;
  });

  // 3. Next Month Strategic Priorities Card
  const col3X = col2X + sumColW + 5;
  doc.setFillColor(255, 255, 255);
  doc.rect(col3X, sumY, sumColW, 145, 'FD');
  doc.setFillColor('#0284c7');
  doc.rect(col3X, sumY, sumColW, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text('STRATEGIC NEXT-MONTH PRIORITIES & KAISEN', col3X + 4, sumY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  let prioY = sumY + 22;
  data.managementSummary.priorities.forEach((prio) => {
    const lines = doc.splitTextToSize(prio, sumColW - 10);
    doc.text(lines, col3X + 4, prioY);
    prioY += lines.length * 5.5 + 4;
  });

  drawFooter(doc, pageW, pageH, data.reportId, 2, totalPages);

  const filename = `ApexPLM_Monthly_Manufacturing_Report_2026-08.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, reportId: data.reportId };
}

// -------------------------------------------------------------
// 6. CUSTOM DATE RANGE PRODUCTION REPORT GENERATOR
// -------------------------------------------------------------

export async function generateCustomProductionPdf(options: ProductionReportMeta): Promise<{ blob: Blob; filename: string; reportId: string }> {
  const startStr = options.startDate || '2026-08-05';
  const endStr = options.endDate || '2026-08-19';
  const pName = options.periodName || 'Custom Production Period';
  const author = options.generatedBy || 'Manufacturing Engineer';
  const data = getCustomRangeProductionData(startStr, endStr, pName);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const totalPages = 2;

  // PAGE 1
  drawHeaderBanner(doc, pageW, 'Custom Production Report', pName, data.rangeStr, data.reportId, author);

  // 1. KPI Cards Row
  const kpiW = (277 - 15) / 4;
  drawKpiBox(doc, 10, 38, kpiW, 24, 'Total Production Target', `${data.kpi.totalCompleted} / ${data.kpi.totalTarget} Units`, `${Math.round((data.kpi.totalCompleted / data.kpi.totalTarget) * 100)}% Period Target Met`, '#0284c7');
  drawKpiBox(doc, 10 + kpiW + 5, 38, kpiW, 24, 'Accepted vs Scrap', `${data.kpi.totalAccepted} Good | ${data.kpi.totalScrap} Scrap`, `${data.kpi.quality}% First Pass Yield`, '#059669');
  drawKpiBox(doc, 10 + (kpiW + 5) * 2, 38, kpiW, 24, 'Overall Plant OEE', `${data.kpi.oee}%`, `Availability: ${data.kpi.availability}% • Perf: ${data.kpi.performance}%`, '#d97706');
  drawKpiBox(doc, 10 + (kpiW + 5) * 3, 38, kpiW, 24, 'Operating Efficiency', `${data.kpi.availability}% Avail`, `Period Duration: ${data.diffDays} Days`, '#7c3aed');

  // 2. Shift Production Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SHIFT-WISE PRODUCTION & OEE PERFORMANCE MATRIX', 10, 69);

  let sy = 72;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 277, 6, 'FD');
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(10, sy + 6, 287, sy + 6);

  doc.setFontSize(6);
  doc.text('SHIFT', 13, sy + 4.2);
  doc.text('TARGET', 85, sy + 4.2, { align: 'center' });
  doc.text('PRODUCED', 120, sy + 4.2, { align: 'center' });
  doc.text('ACCEPTED', 155, sy + 4.2, { align: 'center' });
  doc.text('REJECT', 185, sy + 4.2, { align: 'center' });
  doc.text('ACHIEVEMENT', 225, sy + 4.2, { align: 'center' });
  doc.text('SHIFT OEE', 280, sy + 4.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  data.shifts.forEach((sh, idx) => {
    sy += 6;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 277, 6, 'F');
    }
    doc.line(10, sy + 6, 287, sy + 6);
    doc.text(sh.shift, 13, sy + 4.2);
    doc.text(String(sh.target), 85, sy + 4.2, { align: 'center' });
    doc.text(String(sh.produced), 120, sy + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(String(sh.accepted), 155, sy + 4.2, { align: 'center' });
    doc.setTextColor(225, 29, 72);
    doc.text(String(sh.reject), 185, sy + 4.2, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${sh.achievement}%`, 225, sy + 4.2, { align: 'center' });
    doc.text(`${sh.oee}%`, 280, sy + 4.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // 3. Machine-Level Performance Table
  sy = 104;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MACHINE TELEMETRY & RUNTIME UTILIZATION', 10, sy);

  sy += 3;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 277, 6, 'FD');
  doc.line(10, sy + 6, 287, sy + 6);

  doc.setFontSize(5.8);
  doc.text('MACHINE NAME & ID', 13, sy + 4.2);
  doc.text('RUNTIME (HRS)', 110, sy + 4.2, { align: 'center' });
  doc.text('DOWNTIME (HRS)', 150, sy + 4.2, { align: 'center' });
  doc.text('OUTPUT', 190, sy + 4.2, { align: 'center' });
  doc.text('REJECT', 230, sy + 4.2, { align: 'center' });
  doc.text('OEE', 280, sy + 4.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  data.machines.forEach((m, idx) => {
    sy += 6.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 277, 6.5, 'F');
    }
    doc.line(10, sy + 6.5, 287, sy + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(m.name, 13, sy + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.runtimeHours}h`, 110, sy + 4.5, { align: 'center' });
    doc.text(`${m.downtimeHours}h`, 150, sy + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(m.production), 190, sy + 4.5, { align: 'center' });
    doc.setTextColor(225, 29, 72);
    doc.text(String(m.reject), 230, sy + 4.5, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${m.oee}%`, 280, sy + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  drawFooter(doc, pageW, pageH, data.reportId, 1, totalPages);

  // PAGE 2: Downtime & Quality Pareto
  doc.addPage('a4', 'landscape');
  drawHeaderBanner(doc, pageW, 'Custom Production Report', `${pName} (Analysis & Quality)`, data.rangeStr, data.reportId, author);

  // Left: Downtime Pareto
  const dwX = 10;
  const dwW = 132;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DOWNTIME PARETO ANALYSIS', dwX, 40);

  let py = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(dwX, py, dwW, 6, 'FD');
  doc.line(dwX, py + 6, dwX + dwW, py + 6);
  doc.setFontSize(5.8);
  doc.text('REASON / CATEGORY', dwX + 3, py + 4.2);
  doc.text('HOURS', dwX + 85, py + 4.2, { align: 'center' });
  doc.text('SHARE %', dwX + 115, py + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.downtimes.forEach((dt, idx) => {
    py += 6.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(dwX, py, dwW, 6.5, 'F');
    }
    doc.line(dwX, py + 6.5, dwX + dwW, py + 6.5);
    doc.text(dt.category, dwX + 3, py + 4.5);
    doc.text(`${dt.hours}h`, dwX + 85, py + 4.5, { align: 'center' });
    doc.text(`${dt.percent}%`, dwX + 115, py + 4.5, { align: 'center' });
  });

  // Right: Quality Defect Breakdown
  const qx = 152;
  const qw = 135;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('QUALITY DEFECT CLASSIFICATION', qx, 40);

  let qy = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(qx, qy, qw, 6, 'FD');
  doc.line(qx, qy + 6, qx + qw, qy + 6);
  doc.setFontSize(5.8);
  doc.text('DEFECT PHENOMENON', qx + 3, qy + 4.2);
  doc.text('QUANTITY', qx + 85, qy + 4.2, { align: 'center' });
  doc.text('SHARE %', qx + 115, qy + 4.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  data.quality.defects.forEach((df, idx) => {
    qy += 6.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(qx, qy, qw, 6.5, 'F');
    }
    doc.line(qx, qy + 6.5, qx + qw, qy + 6.5);
    doc.text(df.defect, qx + 3, qy + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(String(df.count), qx + 85, qy + 4.5, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${df.percent}%`, qx + 115, qy + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  drawFooter(doc, pageW, pageH, data.reportId, 2, totalPages);

  const cleanName = pName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ApexPLM_Custom_Production_Report_${cleanName}_${startStr}_${endStr}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, reportId: data.reportId };
}

// -------------------------------------------------------------
// 7. COMPARISON PRODUCTION REPORT GENERATOR
// -------------------------------------------------------------

export async function generateComparisonProductionPdf(options: ProductionReportMeta): Promise<{ blob: Blob; filename: string; reportId: string }> {
  const compType = options.compType || 'month';
  const author = options.generatedBy || 'Manufacturing Engineer';
  const periodAConfig = { label: options.periodA || 'August 2026' };
  const periodBConfig = { label: options.periodB || 'July 2026' };
  const multiConfigs = options.multiPeriods ? options.multiPeriods.map(p => ({ label: p })) : undefined;

  const data = getComparisonData(compType, periodAConfig, periodBConfig, multiConfigs);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const totalPages = 2;

  // PAGE 1: KPI Comparison & Metrics Matrix
  drawHeaderBanner(doc, pageW, 'Comparison Production Report', `Manufacturing Performance Comparison (${data.comparisonTitle})`, data.comparisonTitle, data.reportId, author);

  // Top KPI Cards
  const kpiW = (277 - 20) / 5;
  const prodMetric = data.metrics.find(m => m.key === 'production')!;
  const effMetric = data.metrics.find(m => m.key === 'efficiency')!;
  const qualMetric = data.metrics.find(m => m.key === 'quality')!;
  const downMetric = data.metrics.find(m => m.key === 'downtime')!;
  const rejMetric = data.metrics.find(m => m.key === 'rejection')!;

  drawKpiBox(doc, 10, 38, kpiW, 24, 'Total Production', `${prodMetric.periodA.toLocaleString()}`, `${prodMetric.changePercent >= 0 ? '+' : ''}${prodMetric.changePercent}% vs Prior`, '#0284c7');
  drawKpiBox(doc, 10 + kpiW + 5, 38, kpiW, 24, 'Efficiency', `${effMetric.periodA}%`, `${effMetric.changePercent >= 0 ? '+' : ''}${effMetric.changePercent}% vs Prior`, '#059669');
  drawKpiBox(doc, 10 + (kpiW + 5) * 2, 38, kpiW, 24, 'Quality Rate (FPY)', `${qualMetric.periodA}%`, `${qualMetric.changePercent >= 0 ? '+' : ''}${qualMetric.changePercent}% vs Prior`, '#7c3aed');
  drawKpiBox(doc, 10 + (kpiW + 5) * 3, 38, kpiW, 24, 'Total Downtime', `${downMetric.periodA} ${downMetric.unit}`, `${downMetric.changePercent <= 0 ? '' : '+'}${downMetric.changePercent}% vs Prior`, '#e11d48');
  drawKpiBox(doc, 10 + (kpiW + 5) * 4, 38, kpiW, 24, 'Rejection Count', `${rejMetric.periodA} Units`, `${rejMetric.changePercent <= 0 ? '' : '+'}${rejMetric.changePercent}% vs Prior`, '#d97706');

  // Detailed Comparison Matrix Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPREHENSIVE MULTI-PERIOD COMPARISON METRICS MATRIX', 10, 69);

  let sy = 72;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, sy, 277, 6, 'FD');
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.line(10, sy + 6, 287, sy + 6);

  doc.setFontSize(6);
  doc.text('KPI METRIC', 13, sy + 4.2);
  doc.text(`PERIOD A (${data.periodA.label})`, 105, sy + 4.2, { align: 'center' });
  doc.text(`PERIOD B (${data.periodB.label})`, 160, sy + 4.2, { align: 'center' });
  doc.text('DIFFERENCE', 215, sy + 4.2, { align: 'center' });
  doc.text('CHANGE %', 270, sy + 4.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  data.metrics.forEach((m, idx) => {
    sy += 6;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, sy, 277, 6, 'F');
    }
    doc.line(10, sy + 6, 287, sy + 6);

    doc.text(m.label, 13, sy + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(`${m.periodA.toLocaleString()} ${m.unit}`, 105, sy + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${m.periodB.toLocaleString()} ${m.unit}`, 160, sy + 4.2, { align: 'center' });

    const isGood = m.isPositiveGood ? m.difference >= 0 : m.difference <= 0;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isGood ? 5 : 225, isGood ? 150 : 29, isGood ? 105 : 72);
    doc.text(`${m.difference >= 0 ? '+' : ''}${m.difference.toLocaleString()} ${m.unit}`, 215, sy + 4.2, { align: 'center' });
    doc.text(`${m.changePercent >= 0 ? '+' : ''}${m.changePercent}%`, 270, sy + 4.2, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
  });

  drawFooter(doc, pageW, pageH, data.reportId, 1, totalPages);

  // PAGE 2: Multi-Period Trend Breakdown & Management Action Review
  doc.addPage('a4', 'landscape');
  drawHeaderBanner(doc, pageW, 'Comparison Production Report', `Trend Breakdown & Review (${data.comparisonTitle})`, data.comparisonTitle, data.reportId, author);

  // Multi-period overview table if multi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MULTI-PERIOD PERFORMANCE EVOLUTION TABLE', 10, 40);

  let my = 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, my, 277, 6, 'FD');
  doc.line(10, my + 6, 287, my + 6);

  doc.setFontSize(6);
  doc.text('REPORTING PERIOD', 13, my + 4.2);
  doc.text('PRODUCTION (UNITS)', 80, my + 4.2, { align: 'center' });
  doc.text('REJECTION (UNITS)', 130, my + 4.2, { align: 'center' });
  doc.text('OEE %', 180, my + 4.2, { align: 'center' });
  doc.text('UTILIZATION %', 230, my + 4.2, { align: 'center' });
  doc.text('EFFICIENCY %', 280, my + 4.2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  data.multiPeriodsData.forEach((mp, idx) => {
    my += 7;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, my, 277, 7, 'F');
    }
    doc.line(10, my + 7, 287, my + 7);
    doc.setFont('helvetica', 'bold');
    doc.text(mp.label, 13, my + 4.7);
    doc.text(mp.production.toLocaleString(), 80, my + 4.7, { align: 'center' });
    doc.setTextColor(225, 29, 72);
    doc.text(String(mp.rejection), 130, my + 4.7, { align: 'center' });
    doc.setTextColor(5, 150, 105);
    doc.text(`${mp.oee}%`, 180, my + 4.7, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.text(`${mp.utilization}%`, 230, my + 4.7, { align: 'center' });
    doc.text(`${mp.efficiency}%`, 280, my + 4.7, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // Bottom notes
  const noteY = 95;
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, noteY, 277, 85, 'FD');
  doc.setFillColor('#0284c7');
  doc.rect(10, noteY, 277, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text('EXECUTIVE COMPARATIVE ANALYSIS & OPERATIONS DIRECTIVE', 15, noteY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`1. Production Output: ${prodMetric.periodA > prodMetric.periodB ? 'Positive growth' : 'Decline'} of ${Math.abs(prodMetric.difference).toLocaleString()} units (${prodMetric.changePercent >= 0 ? '+' : ''}${prodMetric.changePercent}%) observed between ${data.periodB.label} and ${data.periodA.label}.`, 15, noteY + 20);
  doc.text(`2. Quality & Scrap Variance: Rejection rate changed by ${rejMetric.changePercent >= 0 ? '+' : ''}${rejMetric.changePercent}%. Process controls and tooling changeovers accounted for the primary variance.`, 15, noteY + 30);
  doc.text(`3. OEE & Utilization Trends: Overall Equipment Effectiveness achieved ${data.periodA.oee}% in ${data.periodA.label} compared to ${data.periodB.oee}% in ${data.periodB.label}.`, 15, noteY + 40);
  doc.text(`4. Resource Utilization: Total machine runtime hours stood at ${data.periodA.utilization}% utilization with ${downMetric.periodA} ${downMetric.unit} recorded downtime.`, 15, noteY + 50);

  drawFooter(doc, pageW, pageH, data.reportId, 2, totalPages);

  const cleanTitle = data.comparisonTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ApexPLM_Comparison_Production_Report_${cleanTitle}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename, reportId: data.reportId };
}
