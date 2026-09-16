import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import type { SystemRole } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface AccessDeniedProps {
  moduleName?: string;
  userRole?: SystemRole;
  onReturnDashboard: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  moduleName = 'Requested Module',
  userRole = 'EMPLOYEE',
  onReturnDashboard
}) => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className={`w-full max-w-lg rounded-3xl p-8 border shadow-2xl space-y-6 relative overflow-hidden transition-all ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        {/* Background glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center text-rose-500 shadow-xl ${
          isDark ? 'bg-rose-500/10 border-rose-500/30 shadow-rose-500/10' : 'bg-rose-50 border-rose-200 shadow-rose-200'
        }`}>
          <ShieldAlert className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full badge-status badge-archived text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>403 FORBIDDEN</span>
          </div>

          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            Access Denied
          </h2>
          <p className={`text-sm ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            You do not have permission to access this module.
          </p>
        </div>

        <div className={`p-4 rounded-2xl border text-xs text-left space-y-1.5 ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <div className="flex justify-between">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Attempted Module:</span>
            <span className="text-cyan-500 font-bold font-mono">{moduleName}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Your Current Role:</span>
            <span className="text-amber-500 font-bold font-mono">{userRole}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Policy Violation:</span>
            <span className="text-rose-500 font-semibold">RBAC Security Restricted</span>
          </div>
        </div>

        <button
          onClick={onReturnDashboard}
          className="btn-primary w-full py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

