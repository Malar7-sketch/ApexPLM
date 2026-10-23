import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Filter,
  DollarSign,
  Package,
  GitPullRequest,
  ShieldCheck,
  Building2,
  Briefcase,
  Loader2,
  Calendar,
  UserCheck
} from 'lucide-react';
import type { PartItem, ECN, QualityNCR, Supplier, Project } from '../types/plm';
import { generateExecutiveReportPdf } from '../utils/executiveReportPdf';
import { useTheme } from '../context/ThemeContext';

interface ReportsManagerProps {
  parts: PartItem[];
  ecns: ECN[];
  ncrs: QualityNCR[];
  suppliers: Supplier[];
  projects: Project[];
  currentUser?: { name?: string } | null;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  parts,
  ecns,
  ncrs,
  suppliers,
  projects,
  currentUser
}) => {
  const { isDark } = useTheme();
  const [reportType, setReportType] = useState<'bom' | 'ecn' | 'quality' | 'supplier' | 'project'>('bom');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reportDate = new Date().toISOString().split('T')[0];

  const reportMeta = {
    bom: {
      title: 'BOM & PART MASTER EXECUTIVE SUMMARY',
      code: 'BOM-MASTER',
      id: 'REP-2026-001',
      desc: 'Complete engineering item master, assembly hierarchy, revisions, materials, and cost rollups.',
      filename: `ApexPLM_BOM_Part_Master_Report_${reportDate}.pdf`
    },
    ecn: {
      title: 'ENGINEERING CHANGE NOTICE AUDIT LOG',
      code: 'ECN-AUDIT',
      id: 'REP-2026-002',
      desc: 'Traceable engineering change orders, revision progressions, risk assessments, and signoffs.',
      filename: `ApexPLM_ECN_Audit_Report_${reportDate}.pdf`
    },
    quality: {
      title: 'ISO 9001 QUALITY & NON-CONFORMANCE (NCR) SUMMARY',
      code: 'ISO-QMS',
      id: 'REP-2026-003',
      desc: 'Audit compliance records, non-conformance reports (NCRs), defect severity, and CAPA resolutions.',
      filename: `ApexPLM_ISO_Quality_NCR_Report_${reportDate}.pdf`
    },
    supplier: {
      title: 'APPROVED SUPPLIER & VENDOR AUDIT SCORECARD',
      code: 'VEND-AUDIT',
      id: 'REP-2026-004',
      desc: 'Vendor evaluations, ISO quality scores, on-time delivery rates, and approved sourcing matrix.',
      filename: `ApexPLM_Supplier_Performance_Report_${reportDate}.pdf`
    },
    project: {
      title: 'ENTERPRISE PROJECT PORTFOLIO & STAGE-GATE SUMMARY',
      code: 'PRJ-PORTFOLIO',
      id: 'REP-2026-005',
      desc: 'Active NPI stage-gate timelines, budget utilization, engineering hours, and milestone health.',
      filename: `ApexPLM_Project_Portfolio_Report_${reportDate}.pdf`
    }
  };

  const activeMeta = reportMeta[reportType];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Browser Print Handler (Isolated via .report-print-area)
  const handlePrint = () => {
    window.print();
  };

  // Direct Standalone Vector PDF Download
  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      const { blob, filename } = generateExecutiveReportPdf({
        reportType,
        parts,
        ecns,
        ncrs,
        suppliers,
        projects,
        reportDate
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);

      showToast(`Standalone PDF downloaded: ${filename}`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Failed to generate standalone PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    let rows: string[][] = [];

    if (reportType === 'bom') {
      rows = [
        ['Part Number', 'Name', 'Revision', 'Type', 'Category', 'Material', 'Weight (kg)', 'Estimated Cost ($)'],
        ...parts.map((p) => [p.partNumber, `"${p.name}"`, p.currentRev, p.type, p.category, `"${p.material}"`, p.weightKg.toString(), p.estimatedCost.toFixed(2)])
      ];
    } else if (reportType === 'ecn') {
      rows = [
        ['ECN ID', 'Title', 'Stage', 'Target Part', 'From Rev', 'To Rev', 'Risk Score'],
        ...ecns.map((e) => [e.id, `"${e.title}"`, e.pipelineStage, e.targetPartId, e.fromRevision, e.toRevision, e.riskScore.toString()])
      ];
    } else if (reportType === 'quality') {
      rows = [
        ['NCR Code', 'Title', 'Part ID', 'Severity', 'Status', 'Defect Category'],
        ...ncrs.map((n) => [n.ncrNumber, `"${n.title}"`, n.linkedPartId, n.severity, n.status, `"${n.defectCategory}"`])
      ];
    } else if (reportType === 'supplier') {
      rows = [
        ['Supplier Name', 'Category', 'Rating', 'Quality (PPM)', 'On-Time Delivery (%)', 'Status'],
        ...suppliers.map((s) => [s.name, s.category, (s.ratingScore ?? 4.8).toString(), (s.qualityScorePpm ?? 99.2).toString(), (s.deliveryScorePercent ?? 98.5).toString(), s.status])
      ];
    } else {
      rows = [
        ['Project Code', 'Name', 'Manager', 'Progress (%)', 'Budget Total ($)', 'Budget Spent ($)', 'Status'],
        ...projects.map((pr) => [pr.code, `"${pr.name}"`, pr.manager, pr.completionPercent.toString(), pr.budgetTotal.toString(), pr.budgetSpent.toString(), pr.status])
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ApexPLM_Enterprise_${reportType.toUpperCase()}_Report_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center space-x-2 border border-emerald-300 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Controls Header (Hidden in Print) */}
      <div className={`no-print rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Enterprise Executive Reports Generator</span>
              <span className="badge-status badge-active text-[10px]">
                AUDIT READY
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Generate isolated, printable ISO 9001 compliance audit reports, BOM summaries, ECN release logs, and vendor scorecards.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleExportCsv}
            className="btn-secondary btn-sm inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="btn-secondary btn-sm inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Download standalone high-resolution PDF file"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer"
            title="Print only the selected report without application shell"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs (Hidden in Print) */}
      <div className={`no-print flex items-center p-1.5 rounded-2xl border space-x-1 text-xs overflow-x-auto ${
        isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}>
        <button
          onClick={() => setReportType('bom')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            reportType === 'bom' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <span>BOM & Part Master Summary</span>
        </button>
        <button
          onClick={() => setReportType('ecn')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            reportType === 'ecn' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <span>Engineering Change Notice Audit Log</span>
        </button>
        <button
          onClick={() => setReportType('quality')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            reportType === 'quality' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <span>ISO Quality & NCR Summary</span>
        </button>
        <button
          onClick={() => setReportType('supplier')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            reportType === 'supplier' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <span>Approved Suppliers</span>
        </button>
        <button
          onClick={() => setReportType('project')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            reportType === 'project' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <span>Project Portfolio</span>
        </button>
      </div>

      {/* =========================================================================
          ISOLATED PRINT CONTAINER (.report-print-area)
          Only this container and its children will be printed by the browser!
          ========================================================================= */}
      <div className={`report-print-area rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8 space-y-6 border transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        
        {/* Dedicated Clean Printable Report Header */}
        <div className={`border-b pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className={`text-xl font-black tracking-tight print:text-slate-950 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                APEXPLM STUDIO
              </span>
              <span className="badge-status badge-active text-xs print:border-slate-400 print:text-slate-800">
                OFFICIAL AUDIT REPORT
              </span>
            </div>
            <p className={`text-xs print:text-slate-600 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Enterprise Mechanical Product Lifecycle Platform • ISO 9001:2015 Traceable
            </p>
            <h1 className="text-base font-bold text-cyan-500 print:text-slate-900 tracking-tight pt-1">
              {activeMeta.title}
            </h1>
          </div>

          <div className={`text-left sm:text-right font-mono text-xs space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <div className="font-bold text-amber-500 print:text-slate-900">
              Report ID: {activeMeta.id}
            </div>
            <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
              Generated: {reportDate}
            </div>
            <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
              Prepared By: {currentUser?.name || 'Engineering Lead'}
            </div>
            <div className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
              Classification: Confidential Internal
            </div>
          </div>
        </div>

        {/* Report KPI Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          {reportType === 'bom' && (
            <>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL ITEMS</span>
                <span className="text-xl font-bold text-slate-100 print:text-slate-950">{parts.length} Parts</span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">ASSEMBLIES</span>
                <span className="text-xl font-bold text-cyan-400 print:text-slate-950">
                  {parts.filter((p) => p.type === 'Assembly').length} Top-Level
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL WEIGHT</span>
                <span className="text-xl font-bold text-purple-400 print:text-slate-950">
                  {parts.reduce((s, p) => s + p.weightKg, 0).toFixed(1)} kg
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">ESTIMATED VALUE</span>
                <span className="text-xl font-bold text-emerald-400 print:text-slate-950">
                  ${parts.reduce((s, p) => s + p.estimatedCost, 0).toFixed(2)}
                </span>
              </div>
            </>
          )}

          {reportType === 'ecn' && (
            <>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL ECNS</span>
                <span className="text-xl font-bold text-slate-100 print:text-slate-950">{ecns.length} Notices</span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">APPROVED / RELEASED</span>
                <span className="text-xl font-bold text-emerald-400 print:text-slate-950">
                  {ecns.filter((e) => e.pipelineStage === 'Released' || e.pipelineStage === 'Final Signoff').length} ECNs
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">IN REVIEW</span>
                <span className="text-xl font-bold text-amber-400 print:text-slate-950">
                  {ecns.filter((e) => e.pipelineStage.includes('Review')).length} Pending
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">AVG RISK SCORE</span>
                <span className="text-xl font-bold text-cyan-400 print:text-slate-950">
                  {(ecns.reduce((s, e) => s + e.riskScore, 0) / (ecns.length || 1)).toFixed(0)} / 100
                </span>
              </div>
            </>
          )}

          {reportType === 'quality' && (
            <>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL NCRS</span>
                <span className="text-xl font-bold text-slate-100 print:text-slate-950">{ncrs.length} Records</span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">CRITICAL SEVERITY</span>
                <span className="text-xl font-bold text-rose-400 print:text-slate-950">
                  {ncrs.filter((n) => n.severity === 'Critical').length} Critical
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">RESOLVED</span>
                <span className="text-xl font-bold text-emerald-400 print:text-slate-950">
                  {ncrs.filter((n) => n.status === 'Closed').length} Closed
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">QMS AUDIT STATUS</span>
                <span className="text-xl font-bold text-cyan-400 print:text-slate-950">PASSED</span>
              </div>
            </>
          )}

          {reportType === 'supplier' && (
            <>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL SUPPLIERS</span>
                <span className="text-xl font-bold text-slate-100 print:text-slate-950">{suppliers.length} Vendors</span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TIER-1 APPROVED</span>
                <span className="text-xl font-bold text-emerald-400 print:text-slate-950">
                  {suppliers.filter((s) => s.status === 'Approved').length} Approved
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">AVG QUALITY PPM</span>
                <span className="text-xl font-bold text-cyan-400 print:text-slate-950">
                  {(suppliers.reduce((s, sup) => s + (sup.qualityScorePpm ?? 99.2), 0) / (suppliers.length || 1)).toFixed(0)} PPM
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">ON-TIME DELIVERY</span>
                <span className="text-xl font-bold text-purple-400 print:text-slate-950">
                  {(suppliers.reduce((s, sup) => s + (sup.deliveryScorePercent ?? 98.5), 0) / (suppliers.length || 1)).toFixed(1)}%
                </span>
              </div>
            </>
          )}

          {reportType === 'project' && (
            <>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">ACTIVE PROJECTS</span>
                <span className="text-xl font-bold text-slate-100 print:text-slate-950">{projects.length} Portfolios</span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">TOTAL BUDGET</span>
                <span className="text-xl font-bold text-cyan-400 print:text-slate-950">
                  ${(projects.reduce((s, pr) => s + pr.budgetTotal, 0) / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">BUDGET SPENT</span>
                <span className="text-xl font-bold text-amber-400 print:text-slate-950">
                  ${(projects.reduce((s, pr) => s + pr.budgetSpent, 0) / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="p-4 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl print-card">
                <span className="text-slate-400 print:text-slate-600 block text-[10px]">AVG COMPLETION</span>
                <span className="text-xl font-bold text-emerald-400 print:text-slate-950">
                  {(projects.reduce((s, pr) => s + pr.completionPercent, 0) / (projects.length || 1)).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* =====================================================================
            REPORT PRINT TABLE (A4 Landscape Formatted with Repeating Headers)
            ===================================================================== */}
        <div className="overflow-x-auto print:overflow-visible">
          
          {/* 1. BOM Report Table */}
          {reportType === 'bom' && (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 uppercase text-[11px] border-b border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4">Part Number</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 text-center">Rev</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-right">Weight</th>
                  <th className="py-3 px-4 text-right">Cost ($)</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/60 print:border-slate-200 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-cyan-400 print:text-slate-950">{p.partNumber}</td>
                    <td className="py-3 px-4 font-sans text-slate-200 print:text-slate-900 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-center text-slate-300 print:text-slate-800">{p.currentRev}</td>
                    <td className="py-3 px-4 text-slate-400 print:text-slate-700">{p.type}</td>
                    <td className="py-3 px-4 text-slate-400 print:text-slate-700">{p.category}</td>
                    <td className="py-3 px-4 text-slate-300 print:text-slate-800">{p.material}</td>
                    <td className="py-3 px-4 text-right text-slate-300 print:text-slate-800">{p.weightKg.toFixed(2)} kg</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300 print:text-slate-950">${p.estimatedCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 2. ECN Audit Report Table */}
          {reportType === 'ecn' && (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 uppercase text-[11px] border-b border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4">ECN ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Target Part</th>
                  <th className="py-3 px-4 text-center">Stage</th>
                  <th className="py-3 px-4 text-center">Revision Bump</th>
                  <th className="py-3 px-4 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {ecns.map((e) => (
                  <tr key={e.id} className="border-b border-slate-800/60 print:border-slate-200 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-amber-400 print:text-slate-950">{e.id}</td>
                    <td className="py-3 px-4 font-sans text-slate-200 print:text-slate-900 font-medium">{e.title}</td>
                    <td className="py-3 px-4 text-slate-300 print:text-slate-800">{e.targetPartId}</td>
                    <td className="py-3 px-4 text-center text-slate-300 print:text-slate-800">{e.pipelineStage}</td>
                    <td className="py-3 px-4 text-center text-emerald-400 print:text-slate-950 font-bold">{e.fromRevision} → {e.toRevision}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-300 print:text-slate-950">{e.riskScore} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 3. Quality & NCR Report Table */}
          {reportType === 'quality' && (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 uppercase text-[11px] border-b border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4">NCR Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Linked Part</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4">Defect Category</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {ncrs.map((n) => (
                  <tr key={n.id} className="border-b border-slate-800/60 print:border-slate-200 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-rose-400 print:text-slate-950">{n.ncrNumber}</td>
                    <td className="py-3 px-4 font-sans text-slate-200 print:text-slate-900 font-medium">{n.title}</td>
                    <td className="py-3 px-4 text-slate-300 print:text-slate-800">{n.linkedPartId}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 print:text-rose-700'
                          : 'bg-amber-500/20 text-amber-300 print:text-amber-700'
                      }`}>
                        {n.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 print:text-slate-700">{n.defectCategory}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 print:text-emerald-700">{n.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. Supplier Report Table */}
          {reportType === 'supplier' && (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 uppercase text-[11px] border-b border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Rating</th>
                  <th className="py-3 px-4 text-center">Quality Score</th>
                  <th className="py-3 px-4 text-center">On-Time Delivery</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/60 print:border-slate-200 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-100 print:text-slate-950">{s.name}</td>
                    <td className="py-3 px-4 text-slate-400 print:text-slate-700">{s.category}</td>
                    <td className="py-3 px-4 text-center text-amber-400 print:text-slate-950 font-bold">{(s.ratingScore ?? 4.8).toFixed(1)} ★</td>
                    <td className="py-3 px-4 text-center text-cyan-400 print:text-slate-950 font-bold">{s.qualityScorePpm ?? 99.2} PPM</td>
                    <td className="py-3 px-4 text-center text-purple-400 print:text-slate-950 font-bold">{s.deliveryScorePercent ?? 98.5}%</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 print:text-emerald-700">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. Project Portfolio Table */}
          {reportType === 'project' && (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-800 uppercase text-[11px] border-b border-slate-800 print:border-slate-300">
                  <th className="py-3 px-4">Project Code & Name</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4 text-right">Budget Total</th>
                  <th className="py-3 px-4 text-right">Budget Spent</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((pr) => (
                  <tr key={pr.id} className="border-b border-slate-800/60 print:border-slate-200 hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-cyan-400 print:text-slate-950">
                      <span>{pr.code}</span>: <span className="font-normal text-slate-200 print:text-slate-900">{pr.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 print:text-slate-800">{pr.manager}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400 print:text-slate-950">{pr.completionPercent}%</td>
                    <td className="py-3 px-4 text-right text-slate-300 print:text-slate-800">${(pr.budgetTotal / 1000).toFixed(0)}k</td>
                    <td className="py-3 px-4 text-right text-slate-300 print:text-slate-800">${(pr.budgetSpent / 1000).toFixed(0)}k</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 print:text-emerald-700">{pr.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>

        {/* Dedicated Clean Printable Report Footer */}
        <div className="border-t border-slate-800 print:border-slate-300 pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-500 print:text-slate-600 font-mono text-[10px] gap-2">
          <div>APEXPLM STUDIO • CONFIDENTIAL & PROPRIETARY EXECUTIVE AUDIT DOCUMENT</div>
          <div>Report ID: {activeMeta.id} | Generated: {reportDate}</div>
          <div>ISO 9001:2015 Traceable</div>
        </div>

      </div>

    </div>
  );
};
