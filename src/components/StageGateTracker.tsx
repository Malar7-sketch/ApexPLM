import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  UserCheck, 
  Layers, 
  Award,
  Zap
} from 'lucide-react';
import type { StageGate, UserPersona } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface StageGateTrackerProps {
  gates?: StageGate[];
  currentPersona?: UserPersona;
  onToggleChecklistItem?: (gateId: number, taskId: string) => void;
}

export const StageGateTrackerInternal: React.FC<StageGateTrackerProps> = ({
  gates = [],
  currentPersona = 'admin',
  onToggleChecklistItem = () => {}
}) => {
  const { isDark } = useTheme();

  const activeGate = gates.find(g => g.status === 'In Progress') || gates.find(g => g.status === 'Upcoming');
  const activePhaseText = gates.length === 0
    ? 'No Active Stage Gates'
    : activeGate
    ? `Active Phase: Gate 0${activeGate.gateId} ${activeGate.gateName}`
    : 'All Gates Completed';

  const handleChecklistClick = (gateId: number, taskId: string) => {
    onToggleChecklistItem(gateId, taskId);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Stage-Gate Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-emerald-500 border ${
            isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Stage-Gate Product Development Lifecycle Tracker
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              5-Phase Gate review pipeline enforcing quality standards, design freezes, and deliverable signoffs.
            </p>
          </div>
        </div>

        <div className={`flex items-center space-x-2 text-xs px-3.5 py-2 rounded-xl border ${
          isDark ? 'bg-[#0D1628] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-cyan-600'
        }`}>
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-semibold">{activePhaseText}</span>
        </div>
      </div>

      {gates.length === 0 ? (
        <div className={`p-16 rounded-2xl border border-dashed text-center space-y-4 transition-colors ${
          isDark ? 'bg-[#111B2E]/50 border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Stage-Gate Reviews Configured
            </h3>
            <p className="text-xs text-slate-400">
              There are no active stage-gate governance pipelines defined. Stage gates will appear here when configured for project milestones.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 5-Gate Horizontal Pipeline Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        {gates.map((gate) => {
          const isPassed = gate.status === 'Passed';
          const isInProgress = gate.status === 'In Progress';

          return (
            <div
              key={gate.gateId}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                isPassed
                  ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isInProgress
                  ? isDark ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-sm' : 'bg-cyan-50 border-cyan-300 text-cyan-800 shadow-sm'
                  : isDark ? 'bg-[#111B2E] border-[#243149] text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold font-mono ${
                    isDark ? 'bg-[#0D1628]' : 'bg-[#F8FAFC]'
                  }`}>
                    Gate 0{gate.gateId}
                  </span>
                  {isPassed ? (
                    <span className="badge-status badge-active text-[10px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Passed</span>
                    </span>
                  ) : isInProgress ? (
                    <span className="badge-status badge-review text-[10px] flex items-center space-x-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Upcoming</span>
                  )}
                </div>

                <h3 className={`text-xs font-bold line-clamp-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{gate.gateName}</h3>
              </div>

              <div className={`border-t pt-2 text-[11px] font-mono flex items-center justify-between ${
                isDark ? 'border-[#243149] text-[#94A3B8]' : 'border-[#E2E8F0] text-[#64748B]'
              }`}>
                <span>Target:</span>
                <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{gate.targetCompletionDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Deliverable Checklists Per Gate */}
      <div className="space-y-6">
        {gates.map((gate) => (
          <div
            key={gate.gateId}
            className={`rounded-2xl p-5 border shadow-sm space-y-4 text-xs ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className={`flex items-start justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{gate.gateName}</h3>
                  <span className={`badge-status text-[10px] ${
                    gate.status === 'Passed' ? 'badge-active' : 'badge-review'
                  }`}>
                    {gate.stage} phase
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{gate.description}</p>
              </div>

              <div className={`text-right text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Checklist: <span className="text-cyan-500 font-bold font-mono">
                  {gate.checklist.filter((c) => c.completed).length} / {gate.checklist.length} Passed
                </span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-2">
              {gate.checklist.map((item) => {
                const requiredPersona = USER_PERSONAS[item.requiredRole];

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      item.completed
                        ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleChecklistClick(gate.gateId, item.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                          item.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isDark ? 'border-[#243149] hover:border-cyan-500 bg-[#111B2E]' : 'border-[#CBD5E1] hover:border-cyan-500 bg-white'
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        <span className={`text-xs font-semibold ${item.completed ? 'line-through text-secondary' : isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                          {item.task}
                        </span>

                        {item.documentRef && (
                          <div className="text-[11px] font-mono text-cyan-500 flex items-center space-x-1 mt-0.5">
                            <FileText className="w-3 h-3" />
                            <span>Linked Doc: {item.documentRef}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="badge-status badge-active text-[10px]">
                        Signoff: {requiredPersona.name} ({requiredPersona.department})
                      </span>

                      {item.completed && (
                        <span className={`text-[11px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                          Completed on {item.completedDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

// Error Boundary for Stage Gate Tracker
class StageGateErrorBoundary extends React.Component<
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
    console.error('Stage Gate Tracker Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Design Review & Stage Gate Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading phase gate review pipeline.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload Design Review</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const StageGateTracker: React.FC<StageGateTrackerProps> = (props) => (
  <StageGateErrorBoundary>
    <StageGateTrackerInternal {...props} />
  </StageGateErrorBoundary>
);

export default StageGateTracker;

