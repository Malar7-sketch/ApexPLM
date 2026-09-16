import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Users, 
  Mail, 
  Building2, 
  Database, 
  CheckCircle2, 
  Save 
} from 'lucide-react';
import type { UserPersona } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

export const SettingsPanel: React.FC = () => {
  const { isDark } = useTheme();
  const [companyName, setCompanyName] = useState('Apex Aerospace & Robotics Engineering Corp.');
  const [backupFrequency, setBackupFrequency] = useState('Daily at 02:00 UTC');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-cyan-500 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Enterprise System Settings & Security Controls
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Role-based access matrix, department structures, automated email notifications, and vault backup configuration.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 border-b pb-2 ${
            isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
          }`}>
            <Building2 className="w-4 h-4 text-cyan-500" />
            <span>Organization Profile</span>
          </h3>

          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>Company Legal Entity Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="plm-input w-full text-xs"
            />
          </div>

          <div>
            <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>Automated CAD Vault Backup Schedule</label>
            <input
              type="text"
              value={backupFrequency}
              onChange={(e) => setBackupFrequency(e.target.value)}
              className="plm-input w-full text-xs font-mono"
            />
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 border-b pb-2 ${
            isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Role-Based Access Control (RBAC) Matrix</span>
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(Object.keys(USER_PERSONAS) as UserPersona[]).map((key) => {
              const persona = USER_PERSONAS[key];
              return (
                <div key={key} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{persona.name}</span>
                    <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{persona.role}</span>
                  </div>
                  <span className="badge-status badge-active text-[10px]">
                    {persona.department}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="btn-primary btn-sm inline-flex items-center space-x-2 cursor-pointer shadow-sm px-6 py-2.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Enterprise Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

