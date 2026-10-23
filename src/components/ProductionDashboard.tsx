import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Gauge, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  BarChart2, 
  Layers,
  FileText,
  Download,
  Eye,
  Calendar,
  History,
  FileSpreadsheet,
  CheckCircle,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Package,
  RotateCcw,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Sliders,
  CalendarDays,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  generateDailyProductionPdf, 
  generateWeeklyProductionPdf, 
  generateMonthlyProductionPdf,
  generateCustomProductionPdf,
  generateComparisonProductionPdf,
  getComparisonData,
  getWeekInfo,
  formatDateDk,
  formatDateFull,
  MONTH_NAMES,
  AVAILABLE_YEARS,
  type GeneratedReportRecord
} from '../utils/productionReportPdf';
import { ProductionReportModal } from './ProductionReportModal';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductionDashboardProps {
  currentUser?: { name: string; email?: string; systemRole?: string } | null;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

const INITIAL_REPORT_HISTORY: GeneratedReportRecord[] = [];

export const ProductionDashboardInternal: React.FC<ProductionDashboardProps> = ({ currentUser, logAction }) => {
  const { isDark } = useTheme();
  const [oee, setOee] = useState({
    availability: 94.2,
    performance: 92.8,
    quality: 98.6,
    overall: 86.2
  });


  const [productionCount, setProductionCount] = useState({
    completedToday: 249,
    rejectedToday: 4,
    shiftTarget: 300
  });

  // 1. REPORT TYPE STATE
  const [selectedReportType, setSelectedReportType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison'>('Daily');

  // 2. DAILY REPORT STATE (Any calendar date)
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-25');

  // 3. WEEKLY REPORT STATE (Option A: Week Auto-Selector or Option B: Custom Week range)
  const [weeklyMode, setWeeklyMode] = useState<'auto' | 'custom'>('auto');
  const [weekAnchorDate, setWeekAnchorDate] = useState<string>('2026-08-25');
  const [customWeekStart, setCustomWeekStart] = useState<string>('2026-08-18');
  const [customWeekEnd, setCustomWeekEnd] = useState<string>('2026-08-24');

  // 4. MONTHLY REPORT STATE (Dynamic Month + Year Selector)
  const [selectedMonth, setSelectedMonth] = useState<string>('August');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // 5. CUSTOM DATE RANGE STATE (From Date, To Date, Optional Period Name)
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-05');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-19');
  const [customPeriodName, setCustomPeriodName] = useState<string>('August Ramp-Up');

  // 6. COMPARISON REPORT STATE (Week vs Week, Month vs Month, Custom vs Custom, Multi-Period)
  const [comparisonMode, setComparisonMode] = useState<'month' | 'week' | 'custom' | 'multi'>('month');
  
  // Month vs Month Config
  const [compMonthA, setCompMonthA] = useState<string>('August');
  const [compYearA, setCompYearA] = useState<string>('2026');
  const [compMonthB, setCompMonthB] = useState<string>('July');
  const [compYearB, setCompYearB] = useState<string>('2026');

  // Week vs Week Config
  const [compWeekA, setCompWeekA] = useState<string>('Week 34 | 18-Aug-2026 → 24-Aug-2026');
  const [compWeekB, setCompWeekB] = useState<string>('Week 33 | 11-Aug-2026 → 17-Aug-2026');

  // Custom vs Custom Config
  const [compCustStartA, setCompCustStartA] = useState<string>('2026-08-01');
  const [compCustEndA, setCompCustEndA] = useState<string>('2026-08-15');
  const [compCustNameA, setCompCustNameA] = useState<string>('August Phase 1');
  const [compCustStartB, setCompCustStartB] = useState<string>('2026-08-16');
  const [compCustEndB, setCompCustEndB] = useState<string>('2026-08-31');
  const [compCustNameB, setCompCustNameB] = useState<string>('August Phase 2');

  // Multi-Period Config (up to 4)
  const [multiPeriodList, setMultiPeriodList] = useState<string[]>([
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026'
  ]);

  // Preview & Loading States
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; subText?: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Report History State (with localStorage persistence)
  const [reportHistory, setReportHistory] = useState<GeneratedReportRecord[]>(() => {
    const saved = localStorage.getItem('apex_plm_production_reports_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved report history:', e);
      }
    }
    return INITIAL_REPORT_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('apex_plm_production_reports_v2', JSON.stringify(reportHistory));
  }, [reportHistory]);

  const showToast = (text: string, subText?: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, subText, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setProductionCount((prev) => ({
        ...prev,
        completedToday: prev.completedToday + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // DERIVED PERIOD STRINGS & LABELS
  const currentWeekInfo = useMemo(() => {
    if (weeklyMode === 'auto') {
      return getWeekInfo(weekAnchorDate);
    } else {
      const sFmt = formatDateDk(customWeekStart);
      const eFmt = formatDateDk(customWeekEnd);
      return {
        weekNum: 0,
        startStr: sFmt,
        endStr: eFmt,
        rangeStr: `${sFmt} → ${eFmt}`,
        fullLabel: `Custom Week | ${sFmt} → ${eFmt}`
      };
    }
  }, [weeklyMode, weekAnchorDate, customWeekStart, customWeekEnd]);

  const effectiveMonthString = `${selectedMonth} ${selectedYear}`;
  const effectiveCustomPeriodString = `${customPeriodName?.trim() || 'Custom Production Period'} | ${formatDateDk(customStartDate)} → ${formatDateDk(customEndDate)}`;

  // DERIVED COMPARISON PERIOD CONFIGS
  const comparisonPeriods = useMemo(() => {
    if (comparisonMode === 'month') {
      return {
        labelA: `${compMonthA} ${compYearA}`,
        labelB: `${compMonthB} ${compYearB}`,
        title: `${compMonthA} ${compYearA} vs ${compMonthB} ${compYearB}`
      };
    } else if (comparisonMode === 'week') {
      return {
        labelA: compWeekA,
        labelB: compWeekB,
        title: `${compWeekA.split('|')[0].trim()} vs ${compWeekB.split('|')[0].trim()}`
      };
    } else if (comparisonMode === 'custom') {
      const nameA = compCustNameA || `${formatDateDk(compCustStartA)} → ${formatDateDk(compCustEndA)}`;
      const nameB = compCustNameB || `${formatDateDk(compCustStartB)} → ${formatDateDk(compCustEndB)}`;
      return {
        labelA: nameA,
        labelB: nameB,
        title: `${nameA} vs ${nameB}`
      };
    } else {
      return {
        labelA: multiPeriodList[0] || 'Period 1',
        labelB: multiPeriodList[1] || 'Period 2',
        title: `Multi-Period (${multiPeriodList.length} Periods)`
      };
    }
  }, [
    comparisonMode,
    compMonthA, compYearA, compMonthB, compYearB,
    compWeekA, compWeekB,
    compCustStartA, compCustEndA, compCustNameA,
    compCustStartB, compCustEndB, compCustNameB,
    multiPeriodList
  ]);

  // VALIDATION LOGIC
  const validationError = useMemo(() => {
    if (selectedReportType === 'Custom') {
      if (!customStartDate || !customEndDate) return 'Please select both Start Date and End Date.';
      if (new Date(customStartDate) > new Date(customEndDate)) return 'End date cannot be earlier than start date.';
    } else if (selectedReportType === 'Weekly' && weeklyMode === 'custom') {
      if (!customWeekStart || !customWeekEnd) return 'Please specify week start and end dates.';
      if (new Date(customWeekStart) > new Date(customWeekEnd)) return 'Week end date cannot be earlier than week start date.';
    } else if (selectedReportType === 'Comparison') {
      if (comparisonMode === 'month' && compMonthA === compMonthB && compYearA === compYearB) {
        return 'Comparison Period A and Period B cannot be identical.';
      }
      if (comparisonMode === 'week' && compWeekA === compWeekB) {
        return 'Comparison Week A and Week B cannot be identical.';
      }
      if (comparisonMode === 'custom') {
        if (new Date(compCustStartA) > new Date(compCustEndA)) return 'Period A end date cannot be before start date.';
        if (new Date(compCustStartB) > new Date(compCustEndB)) return 'Period B end date cannot be before start date.';
        if (compCustStartA === compCustStartB && compCustEndA === compCustEndB) {
          return 'Period A and Period B dates cannot be identical.';
        }
      }
    }
    return null;
  }, [
    selectedReportType,
    customStartDate, customEndDate,
    weeklyMode, customWeekStart, customWeekEnd,
    comparisonMode,
    compMonthA, compYearA, compMonthB, compYearB,
    compWeekA, compWeekB,
    compCustStartA, compCustEndA,
    compCustStartB, compCustEndB
  ]);

  // COMPARISON DATA FOR DASHBOARD
  const comparisonData = useMemo(() => {
    return getComparisonData(
      comparisonMode,
      { label: comparisonPeriods.labelA },
      { label: comparisonPeriods.labelB },
      comparisonMode === 'multi' ? multiPeriodList.map(l => ({ label: l })) : undefined
    );
  }, [comparisonMode, comparisonPeriods, multiPeriodList]);

  // DIRECT PDF GENERATION HANDLER
  const handleGeneratePdf = async (type: 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison' = selectedReportType) => {
    if (validationError) {
      showToast('Validation Error', validationError, 'error');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      showToast(`Generating ${type} Production Report...`, 'Aggregating MES and machine telemetry data', 'info');

      let res;
      const author = currentUser?.name || 'Manufacturing Engineer';
      let periodLabel = '';

      if (type === 'Daily') {
        periodLabel = formatDateDk(selectedDate);
        res = await generateDailyProductionPdf({ reportDate: selectedDate, generatedBy: author });
      } else if (type === 'Weekly') {
        periodLabel = currentWeekInfo.fullLabel;
        res = await generateWeeklyProductionPdf({ weekRange: currentWeekInfo.fullLabel, generatedBy: author });
      } else if (type === 'Monthly') {
        periodLabel = effectiveMonthString;
        res = await generateMonthlyProductionPdf({ monthName: effectiveMonthString, generatedBy: author });
      } else if (type === 'Custom') {
        periodLabel = effectiveCustomPeriodString;
        res = await generateCustomProductionPdf({ 
          startDate: customStartDate, 
          endDate: customEndDate, 
          periodName: customPeriodName, 
          generatedBy: author 
        });
      } else {
        periodLabel = comparisonData.comparisonTitle;
        res = await generateComparisonProductionPdf({ 
          compType: comparisonMode, 
          periodA: comparisonPeriods.labelA, 
          periodB: comparisonPeriods.labelB, 
          multiPeriods: comparisonMode === 'multi' ? multiPeriodList : undefined,
          generatedBy: author 
        });
      }

      // Trigger Browser Download
      const url = URL.createObjectURL(res.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);

      // Add to History Record
      const newRecord: GeneratedReportRecord = {
        id: `REP-${Date.now()}`,
        reportType: type,
        period: periodLabel,
        reportId: res.reportId,
        generatedBy: author,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Generated',
        filename: res.filename,
        compType: type === 'Comparison' ? comparisonMode : undefined
      };

      setReportHistory((prev) => [newRecord, ...prev.filter((r) => r.reportId !== res.reportId)]);
      showToast(`${type} Report Downloaded Successfully`, res.filename, 'success');

      if (logAction) {
        logAction(
          `Generated ${type} Production PDF`,
          'MANUFACTURING',
          res.reportId,
          `Downloaded report: ${res.filename}`
        );
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast('Generation Failed', 'Could not compile manufacturing report PDF.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl font-mono text-xs shadow-2xl flex items-start space-x-3 animate-in slide-in-from-top-4 border ${
          toastMessage.type === 'error'
            ? 'bg-rose-500 text-slate-950 border-rose-400 font-bold'
            : toastMessage.type === 'info'
            ? 'bg-slate-900 text-cyan-300 border-cyan-500/40'
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 border-emerald-300 font-bold'
        }`}>
          {toastMessage.type === 'info' ? (
            <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin text-cyan-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-black text-sm">{toastMessage.text}</div>
            {toastMessage.subText && <div className="text-xs font-medium opacity-90">{toastMessage.subText}</div>}
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between flex-wrap gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Gauge className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2.5 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Live Shop Floor Production & OEE Telemetry</span>
              <span className="badge-status badge-active text-[10px] animate-pulse">
                REAL-TIME MES
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Overall Equipment Effectiveness (OEE), machine availability, shift targets, customizable reporting periods, and comparative analytics.
            </p>
          </div>
        </div>
      </div>

      {/* OEE Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans text-xs">
        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Overall OEE Score</span>
          <div className="text-3xl font-bold text-emerald-500 font-mono">{oee.overall}%</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>World-Class Target: &gt;85%</div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Machine Availability</span>
          <div className="text-3xl font-bold text-cyan-500 font-mono">{oee.availability}%</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Planned Uptime Ratio</div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Performance Efficiency</span>
          <div className="text-3xl font-bold text-amber-500 font-mono">{oee.performance}%</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Ideal Cycle Time Ratio</div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-xs font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Quality Rate</span>
          <div className="text-3xl font-bold text-purple-500 font-mono">{oee.quality}%</div>
          <div className="text-[11px] text-emerald-500 mt-1 font-semibold">First Pass Yield</div>
        </div>
      </div>

      {/* MANUFACTURING PRODUCTION REPORTING CONTROL CENTER */}
      <div className={`rounded-2xl p-6 border shadow-sm space-y-6 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        
        {/* Top Bar: Title + 5 Top-Level Report Type Tabs */}
        <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl text-cyan-500 border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <span>Production Reports Engine</span>
                <span className="badge-status badge-active text-[10px]">
                  APEXPLM STUDIO
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                User-customizable reporting engine with dynamic date pickers, multi-year selectors, custom periods, and comparison analytics.
              </p>
            </div>
          </div>

          {/* 5 Report Type Tabs */}
          <div className={`flex items-center p-1.5 rounded-xl border space-x-1 text-xs overflow-x-auto max-w-full ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setSelectedReportType('Daily')}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedReportType === 'Daily'
                  ? 'btn-primary btn-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Report</span>
            </button>

            <button
              onClick={() => setSelectedReportType('Weekly')}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedReportType === 'Weekly'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weekly Report</span>
            </button>

            <button
              onClick={() => setSelectedReportType('Monthly')}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedReportType === 'Monthly'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Monthly Report</span>
            </button>

            <button
              onClick={() => setSelectedReportType('Custom')}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedReportType === 'Custom'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Custom Report</span>
            </button>

            <button
              onClick={() => setSelectedReportType('Comparison')}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedReportType === 'Comparison'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparison Report</span>
            </button>
          </div>
        </div>

        {/* Dynamic Period Configuration Controls per Report Type */}
        <div className={`rounded-xl p-5 space-y-4 text-xs border ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          
          {/* DAILY REPORT DATE PICKER */}
          {selectedReportType === 'Daily' && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className={`font-semibold block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Select Production Date (Any Calendar Date):</span>
                <div className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <Calendar className="w-4 h-4 text-cyan-500" />
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent font-bold focus:outline-none cursor-pointer text-cyan-500"
                  />
                  <span className={`text-[11px] border-l pl-3 ${
                    isDark ? 'border-[#243149] text-[#64748B]' : 'border-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {formatDateDk(selectedDate)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[11px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Active Target Title:</span>
                <span className="text-sm font-bold text-cyan-500 font-mono">
                  Daily Production Report — {formatDateFull(selectedDate)}
                </span>
              </div>
            </div>
          )}

          {/* WEEKLY REPORT CONTROLS (Option A: Week Auto-Selector | Option B: Custom Week Range) */}
          {selectedReportType === 'Weekly' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Weekly Configuration Mode:</span>
                  <button
                    onClick={() => setWeeklyMode('auto')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      weeklyMode === 'auto' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Option A: Week Auto-Calculator
                  </button>
                  <button
                    onClick={() => setWeeklyMode('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      weeklyMode === 'custom' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Option B: Custom Week Dates
                  </button>
                </div>
                <span className="text-xs font-bold text-emerald-500 font-mono">
                  {currentWeekInfo.fullLabel}
                </span>
              </div>

              {weeklyMode === 'auto' ? (
                <div className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border flex-wrap gap-2 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Pick any date in target week:</span>
                  <input
                    type="date"
                    value={weekAnchorDate}
                    onChange={(e) => setWeekAnchorDate(e.target.value)}
                    className="bg-transparent text-emerald-500 font-bold focus:outline-none cursor-pointer"
                  />
                  <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>→ Computes Week {currentWeekInfo.weekNum} ({currentWeekInfo.rangeStr})</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Start Date:</span>
                    <input
                      type="date"
                      value={customWeekStart}
                      onChange={(e) => setCustomWeekStart(e.target.value)}
                      className="bg-transparent text-emerald-500 font-bold focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>End Date:</span>
                    <input
                      type="date"
                      value={customWeekEnd}
                      onChange={(e) => setCustomWeekEnd(e.target.value)}
                      className="bg-transparent text-emerald-500 font-bold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MONTHLY REPORT CONTROLS (Dynamic Month + Year Selector Jan-Dec) */}
          {selectedReportType === 'Monthly' && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="plm-select py-1 text-xs text-purple-500 font-bold"
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="plm-select py-1 text-xs text-purple-500 font-bold"
                  >
                    {AVAILABLE_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[11px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Active Target Title:</span>
                <span className="text-sm font-bold text-purple-500 font-mono">
                  Monthly Production Report — {effectiveMonthString}
                </span>
              </div>
            </div>
          )}

          {/* CUSTOM DATE RANGE CONTROLS (From Date, To Date, Optional Period Name) */}
          {selectedReportType === 'Custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>From Date:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-amber-500 font-bold focus:outline-none cursor-pointer w-full"
                  />
                </div>

                <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>To Date:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-amber-500 font-bold focus:outline-none cursor-pointer w-full"
                  />
                </div>

                <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Period Name:</span>
                  <input
                    type="text"
                    value={customPeriodName}
                    onChange={(e) => setCustomPeriodName(e.target.value)}
                    placeholder="e.g. August Ramp-Up"
                    className="bg-transparent text-amber-500 font-bold focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
                  Formatted Header: <b className="text-amber-500">{effectiveCustomPeriodString}</b>
                </span>
                <span className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                  Duration: {Math.max(1, Math.round((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / 86400000) + 1)} Days
                </span>
              </div>
            </div>
          )}

          {/* COMPARISON REPORT CONTROLS */}
          {selectedReportType === 'Comparison' && (
            <div className="space-y-4">
              <div className={`flex items-center justify-between flex-wrap gap-2 border-b pb-3 ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Comparison Mode:</span>
                  <select
                    value={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.value as any)}
                    className="plm-select py-1.5 text-xs text-rose-500 font-bold"
                  >
                    <option value="month">Month vs Month</option>
                    <option value="week">Week vs Week</option>
                    <option value="custom">Custom vs Custom Period</option>
                    <option value="multi">Multi-Period (Up to 4 Periods)</option>
                  </select>
                </div>
                <span className="text-xs font-bold text-rose-500 font-mono">
                  {comparisonPeriods.title}
                </span>
              </div>

              {/* Month vs Month Selectors */}
              {comparisonMode === 'month' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-cyan-500 font-bold block text-[11px]">PERIOD A (Primary / Baseline):</span>
                    <div className="flex items-center space-x-2">
                      <select
                        value={compMonthA}
                        onChange={(e) => setCompMonthA(e.target.value)}
                        className="plm-select py-1.5 text-xs text-cyan-500 font-bold flex-1"
                      >
                        {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={compYearA}
                        onChange={(e) => setCompYearA(e.target.value)}
                        className="plm-select py-1.5 text-xs text-cyan-500 font-bold"
                      >
                        {AVAILABLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-purple-500 font-bold block text-[11px]">PERIOD B (Comparison Benchmark):</span>
                    <div className="flex items-center space-x-2">
                      <select
                        value={compMonthB}
                        onChange={(e) => setCompMonthB(e.target.value)}
                        className="plm-select py-1.5 text-xs text-purple-500 font-bold flex-1"
                      >
                        {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={compYearB}
                        onChange={(e) => setCompYearB(e.target.value)}
                        className="plm-select py-1.5 text-xs text-purple-500 font-bold"
                      >
                        {AVAILABLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Week vs Week Selectors */}
              {comparisonMode === 'week' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-cyan-500 font-bold block text-[11px]">WEEK PERIOD A (Current):</span>
                    <select
                      value={compWeekA}
                      onChange={(e) => setCompWeekA(e.target.value)}
                      className="plm-select py-1.5 text-xs text-cyan-500 font-bold w-full"
                    >
                      <option value="Week 34 | 18-Aug-2026 → 24-Aug-2026">Week 34 | 18-Aug-2026 → 24-Aug-2026</option>
                      <option value="Week 33 | 11-Aug-2026 → 17-Aug-2026">Week 33 | 11-Aug-2026 → 17-Aug-2026</option>
                      <option value="Week 32 | 04-Aug-2026 → 10-Aug-2026">Week 32 | 04-Aug-2026 → 10-Aug-2026</option>
                      <option value="Week 31 | 28-Jul-2026 → 03-Aug-2026">Week 31 | 28-Jul-2026 → 03-Aug-2026</option>
                    </select>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-purple-500 font-bold block text-[11px]">WEEK PERIOD B (Prior / Benchmark):</span>
                    <select
                      value={compWeekB}
                      onChange={(e) => setCompWeekB(e.target.value)}
                      className="plm-select py-1.5 text-xs text-purple-500 font-bold w-full"
                    >
                      <option value="Week 33 | 11-Aug-2026 → 17-Aug-2026">Week 33 | 11-Aug-2026 → 17-Aug-2026</option>
                      <option value="Week 32 | 04-Aug-2026 → 10-Aug-2026">Week 32 | 04-Aug-2026 → 10-Aug-2026</option>
                      <option value="Week 31 | 28-Jul-2026 → 03-Aug-2026">Week 31 | 28-Jul-2026 → 03-Aug-2026</option>
                      <option value="Week 34 | 18-Aug-2026 → 24-Aug-2026">Week 34 | 18-Aug-2026 → 24-Aug-2026</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Custom vs Custom Selectors */}
              {comparisonMode === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-cyan-500 font-bold block text-[11px]">CUSTOM PERIOD A:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={compCustStartA}
                        onChange={(e) => setCompCustStartA(e.target.value)}
                        className="plm-input py-1.5 text-xs text-cyan-500"
                      />
                      <input
                        type="date"
                        value={compCustEndA}
                        onChange={(e) => setCompCustEndA(e.target.value)}
                        className="plm-input py-1.5 text-xs text-cyan-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={compCustNameA}
                      onChange={(e) => setCompCustNameA(e.target.value)}
                      placeholder="Period A Name"
                      className="plm-input py-1.5 text-xs text-cyan-500 w-full"
                    />
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <span className="text-purple-500 font-bold block text-[11px]">CUSTOM PERIOD B:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={compCustStartB}
                        onChange={(e) => setCompCustStartB(e.target.value)}
                        className="plm-input py-1.5 text-xs text-purple-500"
                      />
                      <input
                        type="date"
                        value={compCustEndB}
                        onChange={(e) => setCompCustEndB(e.target.value)}
                        className="plm-input py-1.5 text-xs text-purple-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={compCustNameB}
                      onChange={(e) => setCompCustNameB(e.target.value)}
                      placeholder="Period B Name"
                      className="plm-input py-1.5 text-xs text-purple-500 w-full"
                    />
                  </div>
                </div>
              )}

              {/* Multi-Period Selectors */}
              {comparisonMode === 'multi' && (
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}>
                  <span className="text-rose-500 font-bold block text-[11px]">MULTI-PERIOD BREAKDOWN (UP TO 4 PRODUCTION EPOCHS):</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {multiPeriodList.map((p, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const updated = [...multiPeriodList];
                          updated[idx] = e.target.value;
                          setMultiPeriodList(updated);
                        }}
                        className="plm-input py-1.5 text-xs font-bold"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Warning Alert */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

        </div>

        {/* Action Controls & Format Summary */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-t ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="space-y-1">
            <div className="text-xs font-sans flex items-center space-x-2">
              <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Selected Document Output:</span>
              <span className="text-amber-500 font-bold">
                {selectedReportType === 'Daily' && 'Daily Shop Floor Production Report (A4/A3 Vector PDF)'}
                {selectedReportType === 'Weekly' && 'Weekly Manufacturing Performance Review (A4/A3 Vector PDF)'}
                {selectedReportType === 'Monthly' && 'Monthly Operations Executive Report (A3 Vector PDF)'}
                {selectedReportType === 'Custom' && 'Custom Date Range Production Report (A4/A3 Vector PDF)'}
                {selectedReportType === 'Comparison' && 'Manufacturing Comparison Matrix Report (A4/A3 Vector PDF)'}
              </span>
            </div>
            <div className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Vector high-precision tables, KPI metrics, shift telemetry, and engineering signoffs.
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={Boolean(validationError)}
              className="btn-secondary btn-sm flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => handleGeneratePdf(selectedReportType)}
              disabled={isGeneratingPdf || Boolean(validationError)}
              className="btn-primary btn-sm flex items-center space-x-2"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COMPARISON ANALYTICS PANEL (Only visible when Comparison Report is active) */}
        {selectedReportType === 'Comparison' && (
          <div className={`space-y-6 pt-4 border-t ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            
            {/* Top KPI Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {comparisonData.metrics.slice(0, 5).map((m) => {
                const isGood = m.isPositiveGood ? m.difference >= 0 : m.difference <= 0;
                return (
                  <div key={m.key} className={`p-4 rounded-xl border space-y-1.5 shadow-sm ${
                    isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <span className={`text-[10px] uppercase font-bold block truncate ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{m.label}</span>
                    <div className={`text-xl font-bold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                      {m.periodA.toLocaleString()} <span className={`text-xs font-normal ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{m.unit}</span>
                    </div>
                    <div className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                      isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
                    }`}>
                      <span className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>vs {m.periodB.toLocaleString()}</span>
                      <span className={`font-bold flex items-center ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {m.changePercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        {m.changePercent >= 0 ? '+' : ''}{m.changePercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comprehensive Comparison Table */}
            <div className="plm-table-container">
              <div className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`font-bold text-sm flex items-center space-x-2 ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <Sliders className="w-4 h-4 text-cyan-500" />
                  <span>Comprehensive Production Metrics Comparison Table</span>
                </div>
                <span className={`text-xs font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{comparisonData.comparisonTitle}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="plm-table text-xs">
                  <thead>
                    <tr>
                      <th>KPI Metric</th>
                      <th className="text-center">Period A ({comparisonData.periodA.label})</th>
                      <th className="text-center">Period B ({comparisonData.periodB.label})</th>
                      <th className="text-center">Absolute Difference</th>
                      <th className="text-right">Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.metrics.map((m, idx) => {
                      const isGood = m.isPositiveGood ? m.difference >= 0 : m.difference <= 0;
                      return (
                        <tr key={idx}>
                          <td className="font-bold">{m.label}</td>
                          <td className="text-center font-bold text-cyan-500 font-mono">{m.periodA.toLocaleString()} {m.unit}</td>
                          <td className={`text-center font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{m.periodB.toLocaleString()} {m.unit}</td>
                          <td className={`text-center font-bold font-mono ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {m.difference >= 0 ? '+' : ''}{m.difference.toLocaleString()} {m.unit}
                          </td>
                          <td className={`text-right font-bold font-mono ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {m.changePercent >= 0 ? '+' : ''}{m.changePercent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4 Interactive Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Chart 1: Production Comparison */}
              <div className={`p-4 rounded-xl border space-y-2 shadow-sm ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`text-xs font-bold flex items-center justify-between ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <span>1. Production Output Comparison (Units)</span>
                  <span className="text-[10px] text-cyan-500 font-mono">Volume Variance</span>
                </div>
                <div className="h-52">
                  <Bar
                    data={{
                      labels: comparisonData.multiPeriodsData.map(p => p.label),
                      datasets: [
                        {
                          label: 'Total Production Units',
                          data: comparisonData.multiPeriodsData.map(p => p.production),
                          backgroundColor: 'rgba(6, 182, 212, 0.7)',
                          borderColor: '#06b6d4',
                          borderWidth: 1,
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } },
                        y: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Chart 2: Efficiency & OEE Trend */}
              <div className={`p-4 rounded-xl border space-y-2 shadow-sm ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`text-xs font-bold flex items-center justify-between ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <span>2. Efficiency & OEE Trendline (%)</span>
                  <span className="text-[10px] text-emerald-500 font-mono">Performance & Quality</span>
                </div>
                <div className="h-52">
                  <Line
                    data={{
                      labels: comparisonData.multiPeriodsData.map(p => p.label),
                      datasets: [
                        {
                          label: 'OEE Score %',
                          data: comparisonData.multiPeriodsData.map(p => p.oee),
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.3,
                          fill: true
                        },
                        {
                          label: 'Efficiency %',
                          data: comparisonData.multiPeriodsData.map(p => p.efficiency),
                          borderColor: '#8b5cf6',
                          backgroundColor: 'transparent',
                          borderDash: [4, 4],
                          tension: 0.3
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } } } },
                      scales: {
                        x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } },
                        y: { min: 70, max: 100, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Chart 3: Rejection Comparison */}
              <div className={`p-4 rounded-xl border space-y-2 shadow-sm ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`text-xs font-bold flex items-center justify-between ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <span>3. Rejection & Scrap Comparison (Units)</span>
                  <span className="text-[10px] text-rose-500 font-mono">Quality Variance</span>
                </div>
                <div className="h-52">
                  <Bar
                    data={{
                      labels: comparisonData.multiPeriodsData.map(p => p.label),
                      datasets: [
                        {
                          label: 'Rejected Units',
                          data: comparisonData.multiPeriodsData.map(p => p.rejection),
                          backgroundColor: 'rgba(244, 63, 94, 0.7)',
                          borderColor: '#f43f5e',
                          borderWidth: 1,
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } },
                        y: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Chart 4: Machine Utilization */}
              <div className={`p-4 rounded-xl border space-y-2 shadow-sm ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className={`text-xs font-bold flex items-center justify-between ${
                  isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
                }`}>
                  <span>4. Machine Utilization Comparison (%)</span>
                  <span className="text-[10px] text-purple-500 font-mono">Capacity Optimization</span>
                </div>
                <div className="h-52">
                  <Bar
                    data={{
                      labels: comparisonData.multiPeriodsData.map(p => p.label),
                      datasets: [
                        {
                          label: 'Utilization %',
                          data: comparisonData.multiPeriodsData.map(p => p.utilization),
                          backgroundColor: 'rgba(168, 85, 247, 0.7)',
                          borderColor: '#a855f7',
                          borderWidth: 1,
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } },
                        y: { min: 60, max: 100, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }, grid: { color: isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.8)' } }
                      }
                    }}
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Upgraded Report History Table */}
        <div className={`border-t pt-5 space-y-3 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 text-xs font-bold ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <History className="w-4 h-4 text-purple-500" />
              <span>Generated Production Reports Archive</span>
            </div>
            <span className={`text-[11px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              {reportHistory.length} Reports Archived
            </span>
          </div>

          <div className="plm-table-container">
            <div className="overflow-x-auto">
              <table className="plm-table text-xs">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Report Type</th>
                    <th>Period</th>
                    <th>Report ID</th>
                    <th>Generated By</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                        No manufacturing reports generated yet. Click Generate Report above to export production records.
                      </td>
                    </tr>
                  ) : (
                    reportHistory.map((rep) => (
                    <tr key={rep.id}>
                      <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{rep.date}</td>
                      <td>
                        <span className="badge-status badge-active">
                          {rep.reportType}
                        </span>
                      </td>
                      <td className="font-semibold max-w-xs truncate">{rep.period}</td>
                      <td className="text-amber-500 font-bold font-mono">{rep.reportId}</td>
                      <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{rep.generatedBy}</td>
                      <td className="text-center">
                        <span className="text-emerald-500 font-bold flex items-center justify-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{rep.status}</span>
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleGeneratePdf(rep.reportType)}
                          className="btn-secondary btn-sm inline-flex items-center space-x-1"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Shift Target Progress & Machine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-xs">
        <div className={`lg:col-span-6 p-6 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold border-b pb-3 flex items-center justify-between ${
            isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
          }`}>
            <span>Shift Production Target</span>
            <span className="text-xs font-mono text-cyan-500">Shift A, B, C Consolidated</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span>Completed Units: {productionCount.completedToday} / {productionCount.shiftTarget}</span>
              <span className="text-cyan-500 font-mono">{Math.round((productionCount.completedToday / productionCount.shiftTarget) * 100)}%</span>
            </div>

            <div className={`w-full h-3 rounded-full overflow-hidden ${
              isDark ? 'bg-[#0D1628]' : 'bg-[#E2E8F0]'
            }`}>
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${(productionCount.completedToday / productionCount.shiftTarget) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Accepted Parts</span>
              <span className="text-xl font-bold text-emerald-500 font-mono">{productionCount.completedToday - productionCount.rejectedToday}</span>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Scrap / Rejected Parts</span>
              <span className="text-xl font-bold text-rose-500 font-mono">{productionCount.rejectedToday}</span>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-6 p-6 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold border-b pb-3 flex items-center justify-between ${
            isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
          }`}>
            <span>Active CNC Machines Status</span>
            <span className="text-xs font-mono text-emerald-500">4 Machines Linked</span>
          </h3>

          <div className="space-y-2.5">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div>
                <span className={`font-bold block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Mazak INTEGREX 5-Axis #01</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Running Op 10 Planet Carrier (ASM-CAR-510)</span>
              </div>
              <span className="badge-status badge-active text-[10px] font-mono">
                ACTIVE 10,000 RPM
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div>
                <span className={`font-bold block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Haas VF-4SS Vertical Mill #02</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Running Op 20 Housing Pocketing (ASM-GBX-5000)</span>
              </div>
              <span className="badge-status badge-active text-[10px] font-mono">
                ACTIVE 12,000 RPM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Report Preview Modal */}
      <ProductionReportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reportType={selectedReportType}
        selectedDate={selectedDate}
        weekRange={currentWeekInfo.fullLabel}
        selectedMonth={effectiveMonthString}
        startDate={customStartDate}
        endDate={customEndDate}
        periodName={customPeriodName}
        compType={comparisonMode}
        periodA={comparisonPeriods.labelA}
        periodB={comparisonPeriods.labelB}
        multiPeriods={comparisonMode === 'multi' ? multiPeriodList : undefined}
        currentUser={currentUser}
        onDownloaded={(type, period, reportId, filename) => {
          const newRecord: GeneratedReportRecord = {
            id: `REP-${Date.now()}`,
            reportType: type,
            period,
            reportId,
            generatedBy: currentUser?.name || 'Manufacturing Engineer',
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'Generated',
            filename
          };
          setReportHistory((prev) => [newRecord, ...prev.filter((r) => r.reportId !== reportId)]);
        }}
      />

    </div>
  );
};

// Error Boundary for Production Dashboard
class ProductionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Production Dashboard Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <Gauge className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Manufacturing Production Dashboard Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while rendering manufacturing metrics and reports.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload Manufacturing Dashboard</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = (props) => (
  <ProductionErrorBoundary>
    <ProductionDashboardInternal {...props} />
  </ProductionErrorBoundary>
);

export default ProductionDashboard;

