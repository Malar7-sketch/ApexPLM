import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  ShieldCheck 
} from 'lucide-react';
import type { PartItem } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface PredictiveMaintenanceProps {
  part?: PartItem;
}

export const PredictiveMaintenance: React.FC<PredictiveMaintenanceProps> = ({ part: propPart }) => {
  const { isDark } = useTheme();
  const part = propPart || INITIAL_PARTS[0];
  const [workOrders] = useState([
    { id: 'WO-901', machine: 'Mazak INTEGREX 5-Axis #01', task: 'Replace Spindle Bearing & Re-lubricate', trigger: 'Vibration Anomaly (>0.45g)', RULHours: 42, status: 'Scheduled', priority: 'High' },
    { id: 'WO-902', machine: 'Haas VF-4SS Vertical Mill #02', task: 'Recalibrate Way Lube Pressure Transducer', trigger: 'Routine 500-Hr Preventive Run', RULHours: 280, status: 'In Progress', priority: 'Medium' }
  ]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-rose-500 border ${
            isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
          }`}>
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Predictive Maintenance & Machine Health (PdM)
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Remaining Useful Life (RUL) predictions, automated work order generation based on 100 Hz sensor anomalies, and service logs.
            </p>
          </div>
        </div>
      </div>

      {/* RUL Health KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className={`rounded-2xl p-5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Fleet Machine Health Index</span>
          <div className="text-3xl font-extrabold text-emerald-500 font-mono">96.4%</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>1 Critical Alarm Active</div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Predicted Min RUL (Spindle #01)</span>
          <div className="text-3xl font-extrabold text-rose-500 font-mono">42 Hours</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Maintenance Needed Before Failure</div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`block mb-1 font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Active Automated Work Orders</span>
          <div className="text-3xl font-extrabold text-cyan-500 font-mono">{workOrders.length} Orders</div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Triggered by Sensor Network</div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className={`rounded-2xl overflow-hidden border shadow-sm ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`p-4 border-b font-bold text-sm ${
          isDark ? 'border-[#243149] text-[#F1F5F9]' : 'border-[#E2E8F0] text-[#172033]'
        }`}>
          Automated Preventive Maintenance Work Orders
        </div>
        <div className="plm-table-container">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>WO Code</th>
                <th>Target Machine</th>
                <th>Maintenance Task</th>
                <th>Sensor Trigger</th>
                <th className="text-center">Remaining Useful Life (RUL)</th>
                <th className="text-center">Priority</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id}>
                  <td className="font-bold text-cyan-500 font-mono">{wo.id}</td>
                  <td className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{wo.machine}</td>
                  <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{wo.task}</td>
                  <td className="text-rose-500 font-semibold">{wo.trigger}</td>
                  <td className="text-center font-bold text-amber-500 font-mono">{wo.RULHours} hrs</td>
                  <td className="text-center">
                    <span className={`badge-status text-[10px] ${
                      wo.priority === 'High' ? 'badge-archived' : 'badge-review'
                    }`}>
                      {wo.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

