import React from 'react';
import { 
  BarChart3, 
  Layers, 
  GitPullRequest, 
  Box, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  RadialLinearScale,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import type { PartItem, ECR, ECN, StageGate, AuditLog } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface DashboardProps {
  parts: PartItem[];
  ecrs: ECR[];
  ecns: ECN[];
  gates: StageGate[];
  auditLogs: AuditLog[];
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  parts,
  ecrs,
  ecns,
  gates,
  auditLogs,
  onNavigateTab
}) => {
  const { isDark } = useTheme();
  const activeEcns = ecns.filter((e) => e.pipelineStage !== 'Released');
  const activeEcrs = ecrs.filter((e) => e.status !== 'Converted to ECN');
  const totalBomCost = parts.reduce((acc, p) => acc + p.estimatedCost, 0);

  // 1. Monthly ECN Trend Line Chart Data
  const ecnTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Submitted ECRs',
        data: [12, 19, 8, 15, 22, 14, 18],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        tension: 0.3
      },
      {
        label: 'Released ECNs',
        data: [10, 15, 7, 14, 18, 12, 16],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3
      }
    ]
  };

  // 2. Cost Analysis Bar Chart Data
  const costAnalysisData = {
    labels: ['Planetary Gearbox', 'EV Drivetrain', 'Drone Frame'],
    datasets: [
      {
        label: 'Target Cost ($)',
        data: [1250, 2150, 890],
        backgroundColor: '#0ea5e9'
      },
      {
        label: 'Actual Cost ($)',
        data: [1180, 2090, 840],
        backgroundColor: '#10b981'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: isDark ? '#94a3b8' : '#475569', font: { family: 'Inter', size: 11 } } }
    },
    scales: {
      x: { ticks: { color: isDark ? '#64748b' : '#64748b' }, grid: { color: isDark ? '#243149' : '#e2e8f0' } },
      y: { ticks: { color: isDark ? '#64748b' : '#64748b' }, grid: { color: isDark ? '#243149' : '#e2e8f0' } }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center space-x-2 ${
            isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
          }`}>
            <span>Product Lifecycle Management Executive Control Panel</span>
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Real-time analytics across mechanical assemblies, CAD version control, BOM cost drift, and change management.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('cad')}
            className="btn-primary btn-sm inline-flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Box className="w-4 h-4" />
            <span>Launch 3D CAD Studio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('cad')}
          className={`rounded-2xl p-5 border shadow-sm hover:border-cyan-500/50 transition-all cursor-pointer group ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>CAD & Part Items</span>
            <Box className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-3xl font-extrabold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {parts.length} <span className={`text-xs font-normal ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Assemblies</span>
          </div>
          <div className="text-xs text-emerald-500 font-mono mt-2 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{parts.filter((p) => !p.isCheckedOut).length} Vault Available</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('ecn')}
          className={`rounded-2xl p-5 border shadow-sm hover:border-amber-500/50 transition-all cursor-pointer group ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Pending Change Notices</span>
            <GitPullRequest className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-3xl font-extrabold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {activeEcns.length} <span className={`text-xs font-normal ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Active ECNs</span>
          </div>
          <div className="text-xs text-amber-500 font-mono mt-2 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{activeEcrs.length} ECR Requests Pending</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('bom')}
          className={`rounded-2xl p-5 border shadow-sm hover:border-purple-500/50 transition-all cursor-pointer group ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Target BOM Rollup</span>
            <DollarSign className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-3xl font-extrabold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            ${(totalBomCost / 1000).toFixed(2)}k
          </div>
          <div className="text-xs text-emerald-500 font-mono mt-2 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>-3.2% DFM Cost Optimization</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('quality')}
          className={`rounded-2xl p-5 border shadow-sm hover:border-emerald-500/50 transition-all cursor-pointer group ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Quality Score & FPY</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-3xl font-extrabold font-mono ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            98.4%
          </div>
          <div className="text-xs text-cyan-500 font-mono mt-2 flex items-center space-x-1">
            <span>18.4 PPM Defect Rate</span>
          </div>
        </div>
      </div>

      {/* Chart.js Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ECN Trend Line Chart */}
        <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className="text-xs uppercase tracking-wider text-amber-500 font-bold flex items-center space-x-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>Monthly Engineering Change Velocity</span>
          </h3>
          <div className="h-64 w-full">
            <Line data={ecnTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Cost Variance Bar Chart */}
        <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className="text-xs uppercase tracking-wider text-cyan-500 font-bold flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4" />
            <span>Assembly Cost Variance (Target vs Actual)</span>
          </h3>
          <div className="h-64 w-full">
            <Bar data={costAnalysisData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Breakdown + Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Change Notice Pipeline Status (7 Cols) */}
        <div className={`lg:col-span-7 rounded-2xl p-5 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Engineering Change Notice (ECN) Status Pipeline</span>
            </h3>
            <button
              onClick={() => onNavigateTab('ecn')}
              className="text-xs text-cyan-500 hover:underline font-mono flex items-center space-x-1 cursor-pointer font-bold"
            >
              <span>View All ECNs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {ecns.map((ecn) => (
              <div key={ecn.id} className={`p-3.5 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-amber-500">{ecn.id}</span>
                  <span className="badge-status badge-review text-[10px]">
                    {ecn.pipelineStage}
                  </span>
                </div>
                <div className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{ecn.title}</div>
                <div className={`w-full h-2 rounded-full overflow-hidden flex ${
                  isDark ? 'bg-[#111B2E]' : 'bg-[#E2E8F0]'
                }`}>
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500 rounded-full" 
                    style={{ 
                      width: ecn.pipelineStage === 'Draft' ? '20%' : ecn.pipelineStage === 'Design Review' ? '40%' : ecn.pipelineStage === 'Quality Review' ? '70%' : '100%' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Immutable Audit Log Feed (5 Cols) */}
        <div className={`lg:col-span-5 rounded-2xl p-5 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Real-Time Audit Trail Activity</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className={`p-3 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-cyan-500">{log.action}</span>
                  <span className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{log.timestamp}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{log.details}</p>
                <div className={`text-[10px] pt-1 flex items-center justify-between ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}>
                  <span>User: {log.user}</span>
                  <span className="badge-status badge-draft text-[9px]">{log.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

