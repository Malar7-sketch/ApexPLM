import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Layers, 
  BarChart2, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign,
  Maximize2,
  TrendingUp,
  GitCompare
} from 'lucide-react';
import { 
  generateDailyProductionPdf, 
  generateWeeklyProductionPdf, 
  generateMonthlyProductionPdf,
  generateCustomProductionPdf,
  generateComparisonProductionPdf,
  getDailyProductionData,
  getWeeklyProductionData,
  getMonthlyProductionData,
  getCustomRangeProductionData,
  getComparisonData
} from '../utils/productionReportPdf';
import { useTheme } from '../context/ThemeContext';

interface ProductionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison';
  selectedDate: string;
  weekRange: string;
  selectedMonth: string;
  startDate?: string;
  endDate?: string;
  periodName?: string;
  compType?: 'week' | 'month' | 'custom' | 'multi';
  periodA?: string;
  periodB?: string;
  multiPeriods?: string[];
  currentUser?: { name: string; email?: string } | null;
  onDownloaded?: (reportType: 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison', period: string, reportId: string, filename: string) => void;
}

export const ProductionReportModal: React.FC<ProductionReportModalProps> = ({
  isOpen,
  onClose,
  reportType: initialReportType,
  selectedDate,
  weekRange,
  selectedMonth,
  startDate = '2026-08-05',
  endDate = '2026-08-19',
  periodName = 'Custom Production Period',
  compType = 'month',
  periodA = 'August 2026',
  periodB = 'July 2026',
  multiPeriods,
  currentUser,
  onDownloaded
}) => {
  const { isDark } = useTheme();
  const [activeType, setActiveType] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'Comparison'>(initialReportType);
  const [activePage, setActivePage] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const author = currentUser?.name || 'Manufacturing Engineer';

  const dailyData = getDailyProductionData(selectedDate);
  const weeklyData = getWeeklyProductionData(weekRange);
  const monthlyData = getMonthlyProductionData(selectedMonth);
  const customData = getCustomRangeProductionData(startDate, endDate, periodName);
  const comparisonData = getComparisonData(
    compType,
    { label: periodA },
    { label: periodB },
    multiPeriods ? multiPeriods.map(p => ({ label: p })) : undefined
  );

  const getActivePeriodString = () => {
    switch (activeType) {
      case 'Daily': return selectedDate;
      case 'Weekly': return weekRange;
      case 'Monthly': return selectedMonth;
      case 'Custom': return `${periodName || 'Custom'} (${startDate} → ${endDate})`;
      case 'Comparison': return comparisonData.comparisonTitle;
    }
  };

  const getActiveReportId = () => {
    switch (activeType) {
      case 'Daily': return dailyData.reportId;
      case 'Weekly': return weeklyData.reportId;
      case 'Monthly': return monthlyData.reportId;
      case 'Custom': return customData.reportId;
      case 'Comparison': return comparisonData.reportId;
    }
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      let res;

      if (activeType === 'Daily') {
        res = await generateDailyProductionPdf({ reportDate: selectedDate, generatedBy: author });
      } else if (activeType === 'Weekly') {
        res = await generateWeeklyProductionPdf({ weekRange, generatedBy: author });
      } else if (activeType === 'Monthly') {
        res = await generateMonthlyProductionPdf({ monthName: selectedMonth, generatedBy: author });
      } else if (activeType === 'Custom') {
        res = await generateCustomProductionPdf({ startDate, endDate, periodName, generatedBy: author });
      } else {
        res = await generateComparisonProductionPdf({ compType, periodA, periodB, multiPeriods, generatedBy: author });
      }

      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);

      if (onDownloaded) {
        onDownloaded(
          activeType,
          getActivePeriodString(),
          res.reportId,
          res.filename
        );
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="plm-modal-backdrop">
      <div className={`rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        
        {/* Top Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-2xl text-cyan-500 border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`text-lg font-bold flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <span>Production Report Interactive Preview</span>
                <span className="badge-status badge-active text-xs">
                  {activeType.toUpperCase()} REPORT
                </span>
              </h3>
              <p className={`text-xs font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {getActivePeriodString()} • ID: {getActiveReportId()}
              </p>
            </div>
          </div>

          {/* Controls: Type Tabs + Action Buttons */}
          <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
            <div className={`p-1 rounded-xl border flex items-center space-x-1 mr-2 ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <button
                onClick={() => { setActiveType('Daily'); setActivePage(1); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeType === 'Daily' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => { setActiveType('Weekly'); setActivePage(1); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeType === 'Weekly' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => { setActiveType('Monthly'); setActivePage(1); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeType === 'Monthly' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => { setActiveType('Custom'); setActivePage(1); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeType === 'Custom' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Custom
              </button>
              <button
                onClick={() => { setActiveType('Comparison'); setActivePage(1); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeType === 'Comparison' ? 'btn-primary btn-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Comparison
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-secondary hover:text-primary p-2 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Paper Area (Engineering Print Sheet) */}
        <div className={`flex-1 overflow-y-auto p-6 flex flex-col items-center ${
          isDark ? 'bg-[#0B1220]' : 'bg-[#F4F6F8]'
        }`}>
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 max-w-5xl w-full border border-slate-300 font-sans min-h-[620px] transition-all">
            
            {/* Header of Paper */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <div className="text-xl font-black tracking-tight text-slate-950">APEXPLM STUDIO</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Manufacturing Operations & MES Telemetry System</div>
                <div className="text-sm font-black text-cyan-800 mt-1 uppercase">
                  {activeType === 'Daily' 
                    ? 'DAILY SHOP FLOOR PRODUCTION REPORT' 
                    : activeType === 'Weekly' 
                    ? 'MANUFACTURING PERFORMANCE REVIEW' 
                    : activeType === 'Monthly'
                    ? 'MANUFACTURING OPERATIONS EXECUTIVE REPORT'
                    : activeType === 'Custom'
                    ? `CUSTOM PRODUCTION REPORT — ${customData.periodName.toUpperCase()}`
                    : `MANUFACTURING COMPARISON REPORT — ${comparisonData.comparisonTitle.toUpperCase()}`}
                </div>
              </div>
              <div className="text-right font-mono text-xs space-y-0.5">
                <div className="font-bold text-slate-950">
                  ID: {getActiveReportId()}
                </div>
                <div className="text-[11px] text-slate-600">
                  Period: {getActivePeriodString()}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded inline-block">
                  LIVE PRODUCTION DATA
                </div>
              </div>
            </div>

            {/* DAILY REPORT CONTENT */}
            {activeType === 'Daily' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Target / Completed</div>
                    <div className="text-xl font-extrabold text-slate-900">{dailyData.kpi.totalCompleted} / {dailyData.kpi.totalTarget}</div>
                    <div className="text-[10px] text-cyan-700 font-semibold">{Math.round((dailyData.kpi.totalCompleted / dailyData.kpi.totalTarget) * 100)}% Target Achieved</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Accepted vs Scrap</div>
                    <div className="text-xl font-extrabold text-emerald-700">{dailyData.kpi.totalAccepted} <span className="text-sm font-normal text-rose-600">({dailyData.kpi.totalScrap} scrap)</span></div>
                    <div className="text-[10px] text-slate-600">{dailyData.kpi.quality}% First Pass Yield</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Overall OEE</div>
                    <div className="text-xl font-extrabold text-amber-700">{dailyData.kpi.oee}%</div>
                    <div className="text-[10px] text-slate-600">Avail {dailyData.kpi.availability}% • Perf {dailyData.kpi.performance}%</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Machine Availability</div>
                    <div className="text-xl font-extrabold text-purple-700">{dailyData.kpi.availability}%</div>
                    <div className="text-[10px] text-slate-600">Planned Uptime Ratio</div>
                  </div>
                </div>

                {/* Shift Table */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono">Shift Production Performance</h4>
                  <table className="w-full text-left border-collapse font-mono text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Shift</th>
                        <th className="p-2 text-center">Target</th>
                        <th className="p-2 text-center">Produced</th>
                        <th className="p-2 text-center">Accepted</th>
                        <th className="p-2 text-center">Reject</th>
                        <th className="p-2 text-center">Achievement</th>
                        <th className="p-2 text-right">OEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.shifts.map((sh, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-semibold">{sh.shift}</td>
                          <td className="p-2 text-center">{sh.target}</td>
                          <td className="p-2 text-center font-bold">{sh.produced}</td>
                          <td className="p-2 text-center text-emerald-700 font-bold">{sh.accepted}</td>
                          <td className="p-2 text-center text-rose-600 font-bold">{sh.reject}</td>
                          <td className="p-2 text-center">{sh.achievement}%</td>
                          <td className="p-2 text-right font-bold text-cyan-800">{sh.oee}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WEEKLY REPORT CONTENT */}
            {activeType === 'Weekly' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Weekly Production</div>
                    <div className="text-xl font-extrabold text-slate-900">{weeklyData.summary.weeklyProduction} / {weeklyData.summary.targetProduction}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{weeklyData.summary.achievement}% Achievement</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Average Weekly OEE</div>
                    <div className="text-xl font-extrabold text-amber-700">{weeklyData.summary.avgOee}%</div>
                    <div className="text-[10px] text-slate-600">Benchmark: &gt;85%</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Quality FPY</div>
                    <div className="text-xl font-extrabold text-emerald-700">{weeklyData.summary.qualityRate}%</div>
                    <div className="text-[10px] text-slate-600">{weeklyData.quality.rejected} Total Rejections</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Downtime</div>
                    <div className="text-xl font-extrabold text-rose-700">{weeklyData.summary.totalDowntimeHours} hrs</div>
                    <div className="text-[10px] text-slate-600">Across 4 CNC Cells</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono">Daily Production & OEE Trends</h4>
                  <table className="w-full text-left border-collapse font-mono text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Day & Date</th>
                        <th className="p-2 text-center">Daily Target</th>
                        <th className="p-2 text-center">Actual Output</th>
                        <th className="p-2 text-center">Achievement</th>
                        <th className="p-2 text-right">OEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.dailyTrends.map((d, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-semibold">{d.day} ({d.date})</td>
                          <td className="p-2 text-center">{d.target}</td>
                          <td className="p-2 text-center font-bold">{d.actual}</td>
                          <td className="p-2 text-center">{Math.round((d.actual / d.target) * 100)}%</td>
                          <td className="p-2 text-right font-bold text-cyan-800">{d.oee}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MONTHLY REPORT CONTENT */}
            {activeType === 'Monthly' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Monthly Output</div>
                    <div className="text-xl font-extrabold text-slate-900">{monthlyData.kpi.monthlyProduction} / {monthlyData.kpi.monthlyTarget}</div>
                    <div className="text-[10px] text-cyan-700 font-semibold">{monthlyData.kpi.achievement}% Output Target</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Plantwide OEE</div>
                    <div className="text-xl font-extrabold text-emerald-700">{monthlyData.kpi.avgOee}%</div>
                    <div className="text-[10px] text-slate-600">Avail {monthlyData.kpi.availability}% • Perf {monthlyData.kpi.performance}%</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Quality & Scrap Rate</div>
                    <div className="text-xl font-extrabold text-purple-700">{monthlyData.kpi.quality}%</div>
                    <div className="text-[10px] text-rose-600 font-bold">{monthlyData.kpi.scrapRate}% Scrap Rate</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Downtime Hours</div>
                    <div className="text-xl font-extrabold text-rose-700">{monthlyData.reliability.totalDowntimeHours} hrs</div>
                    <div className="text-[10px] text-slate-600">MTBF: {monthlyData.reliability.mtbfHours}h • MTTR: {monthlyData.reliability.mttrHours}h</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono">Shift Output Summary</h4>
                  <table className="w-full text-left border-collapse font-mono text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Shift</th>
                        <th className="p-2 text-center">Target</th>
                        <th className="p-2 text-center">Produced</th>
                        <th className="p-2 text-center">Accepted</th>
                        <th className="p-2 text-center">Rejected</th>
                        <th className="p-2 text-right">OEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.shifts.map((sh, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-semibold">{sh.shift}</td>
                          <td className="p-2 text-center">{sh.target}</td>
                          <td className="p-2 text-center font-bold">{sh.produced}</td>
                          <td className="p-2 text-center text-emerald-700 font-bold">{sh.accepted}</td>
                          <td className="p-2 text-center text-rose-600 font-bold">{sh.rejected}</td>
                          <td className="p-2 text-right font-bold text-cyan-800">{sh.oee}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CUSTOM RANGE REPORT CONTENT */}
            {activeType === 'Custom' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Period Production</div>
                    <div className="text-xl font-extrabold text-slate-900">{customData.kpi.totalCompleted.toLocaleString()} / {customData.kpi.totalTarget.toLocaleString()}</div>
                    <div className="text-[10px] text-cyan-700 font-semibold">{Math.round((customData.kpi.totalCompleted / customData.kpi.totalTarget) * 100)}% Period Target Met</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Accepted vs Scrap</div>
                    <div className="text-xl font-extrabold text-emerald-700">{customData.kpi.totalAccepted.toLocaleString()} <span className="text-sm font-normal text-rose-600">({customData.kpi.totalScrap} scrap)</span></div>
                    <div className="text-[10px] text-slate-600">{customData.kpi.quality}% First Pass Yield</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Overall OEE</div>
                    <div className="text-xl font-extrabold text-amber-700">{customData.kpi.oee}%</div>
                    <div className="text-[10px] text-slate-600">Avail {customData.kpi.availability}% • Perf {customData.kpi.performance}%</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Period Duration</div>
                    <div className="text-xl font-extrabold text-purple-700">{customData.diffDays} Days</div>
                    <div className="text-[10px] text-slate-600">{customData.rangeStr}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono">Custom Period Shift Breakdown</h4>
                  <table className="w-full text-left border-collapse font-mono text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2">Shift</th>
                        <th className="p-2 text-center">Target</th>
                        <th className="p-2 text-center">Produced</th>
                        <th className="p-2 text-center">Accepted</th>
                        <th className="p-2 text-center">Reject</th>
                        <th className="p-2 text-right">OEE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customData.shifts.map((sh, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 font-semibold">{sh.shift}</td>
                          <td className="p-2 text-center">{sh.target.toLocaleString()}</td>
                          <td className="p-2 text-center font-bold">{sh.produced.toLocaleString()}</td>
                          <td className="p-2 text-center text-emerald-700 font-bold">{sh.accepted.toLocaleString()}</td>
                          <td className="p-2 text-center text-rose-600 font-bold">{sh.reject.toLocaleString()}</td>
                          <td className="p-2 text-right font-bold text-cyan-800">{sh.oee}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COMPARISON REPORT CONTENT */}
            {activeType === 'Comparison' && (
              <div className="space-y-6">
                
                {/* 5 KPI Comparison Cards */}
                <div className="grid grid-cols-5 gap-2.5 font-mono">
                  {comparisonData.metrics.slice(0, 5).map((m) => {
                    const isGood = m.isPositiveGood ? m.difference >= 0 : m.difference <= 0;
                    return (
                      <div key={m.key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase truncate">{m.label}</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{m.periodA.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{m.unit}</span></div>
                        <div className={`text-[11px] font-bold mt-0.5 ${isGood ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {m.changePercent >= 0 ? '+' : ''}{m.changePercent}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 12-Metric Comprehensive Comparison Table */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono flex items-center justify-between">
                    <span>Comprehensive Performance Comparison Matrix</span>
                    <span className="text-[10px] text-slate-500">{comparisonData.comparisonTitle}</span>
                  </h4>
                  
                  <table className="w-full text-left border-collapse font-mono text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px]">
                      <tr>
                        <th className="p-2">KPI Metric</th>
                        <th className="p-2 text-center">Period A ({comparisonData.periodA.label})</th>
                        <th className="p-2 text-center">Period B ({comparisonData.periodB.label})</th>
                        <th className="p-2 text-center">Difference</th>
                        <th className="p-2 text-right">Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.metrics.map((m, idx) => {
                        const isGood = m.isPositiveGood ? m.difference >= 0 : m.difference <= 0;
                        return (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="p-2 font-semibold text-slate-900">{m.label}</td>
                            <td className="p-2 text-center font-bold text-slate-900">{m.periodA.toLocaleString()} {m.unit}</td>
                            <td className="p-2 text-center text-slate-600">{m.periodB.toLocaleString()} {m.unit}</td>
                            <td className={`p-2 text-center font-bold ${isGood ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {m.difference >= 0 ? '+' : ''}{m.difference.toLocaleString()} {m.unit}
                            </td>
                            <td className={`p-2 text-right font-black ${isGood ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {m.changePercent >= 0 ? '+' : ''}{m.changePercent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Multi-period Trend Summary */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase mb-2 font-mono">Multi-Period Performance Evolution</h4>
                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    {comparisonData.multiPeriodsData.map((mp, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">{mp.label}</div>
                        <div className="text-sm font-black text-slate-900">{mp.production.toLocaleString()} Units</div>
                        <div className="text-[10px] text-slate-600">OEE: <b className="text-emerald-700">{mp.oee}%</b> • Rej: <b className="text-rose-600">{mp.rejection}</b></div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Footer of Paper */}
            <div className="border-t-2 border-slate-900 pt-4 mt-8 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <div>CONFIDENTIAL • APEXPLM STUDIO MANUFACTURING OPERATIONS INTELLIGENCE</div>
              <div>Report ID: {getActiveReportId()} • Page 1 of 2</div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
