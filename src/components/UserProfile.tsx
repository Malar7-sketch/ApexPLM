import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Key, 
  ShieldCheck, 
  Activity, 
  Smartphone, 
  Globe
} from 'lucide-react';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';

interface UserProfileProps {
  user: UserAccount;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'activity'>('personal');
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordToast, setPasswordToast] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordToast('New passwords do not match.');
      return;
    }
    setPasswordToast('Password successfully changed for corporate account.');
    setPasswordForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPasswordToast(null), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Profile Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm space-y-6 relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-5">
            <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center text-4xl shadow-sm ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              {user.avatar}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{user.name}</h1>
                <span className="badge-status badge-active text-xs">
                  {user.systemRole}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {user.role} &bull; {user.department}
              </p>
              <div className={`flex items-center space-x-4 text-[11px] font-mono pt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                <span>Employee ID: <strong className="text-cyan-500">{user.employeeId}</strong></span>
                <span>Location: <strong className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{user.officeLocation}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className={`p-3 rounded-xl border text-right ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className={`text-[10px] block font-bold uppercase ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Reporting Manager</span>
              <span className="text-cyan-500 font-bold">{user.manager}</span>
            </div>
            <div className={`p-3 rounded-xl border text-right ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className={`text-[10px] block font-bold uppercase ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Last Active Login</span>
              <span className="text-emerald-500 font-bold font-mono">{user.lastLogin}</span>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className={`flex items-center space-x-2 border-b pb-2 text-xs ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & SSO</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity Log</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <h3 className={`text-sm font-bold border-b pb-2 ${
                isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
              }`}>
                Corporate Employment Details
              </h3>
              <div className="space-y-3">
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Full Name:</span>
                  <span className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{user.name}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Employee ID:</span>
                  <span className="text-cyan-500 font-mono font-bold">{user.employeeId}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Corporate Email:</span>
                  <span className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{user.email}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Department:</span>
                  <span className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{user.department}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Job Title:</span>
                  <span className="text-amber-500 font-bold">{user.role}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>System Role:</span>
                  <span className="text-purple-500 font-bold">{user.systemRole}</span>
                </div>
                <div className={`flex justify-between border-b pb-2 ${isDark ? 'border-[#243149]/60' : 'border-[#E2E8F0]'}`}>
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Reporting Manager:</span>
                  <span className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{user.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Joining Date:</span>
                  <span className="text-emerald-500 font-bold font-mono">{user.joiningDate || '2021-09-01'}</span>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <h3 className={`text-sm font-bold border-b pb-2 ${
                isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
              }`}>
                Authorized Module Permissions
              </h3>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Your role-based permissions are assigned by your PLM Administrator.
              </p>
              <div className="space-y-2">
                {user.permissions.map((perm, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border flex items-center space-x-2 text-emerald-500 font-bold ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Password Reset Form */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <h3 className={`text-sm font-bold border-b pb-2 flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
              }`}>
                <Key className="w-4 h-4 text-purple-500" />
                <span>Change Account Password</span>
              </h3>

              {passwordToast && (
                <div className="bg-purple-500/10 border border-purple-500/30 text-purple-500 p-3 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordToast}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="plm-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    className="plm-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="plm-input w-full text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-sm w-full py-2.5"
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* 2FA & Active Sessions */}
            <div className="space-y-6">
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Two-Factor Authentication (2FA)</h4>
                    <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>YubiKey / Authenticator App hardware 2FA</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer text-xs ${
                      twoFactorEnabled
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : 'bg-slate-500/10 text-secondary border-slate-500/30'
                    }`}
                  >
                    {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <h4 className={`font-bold text-sm border-b pb-2 ${
                  isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
                }`}>Active SSO Sessions</h4>
                <div className="space-y-2">
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                  }`}>
                    <div>
                      <div className="font-bold text-cyan-500">Austin Gigafactory Workstation #12</div>
                      <div className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Windows 11 &bull; Chrome 128 &bull; 192.168.1.104</div>
                    </div>
                    <span className="badge-status badge-active text-[10px]">CURRENT SESSION</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className={`p-5 rounded-2xl border space-y-3 text-xs ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <h3 className={`text-sm font-bold border-b pb-2 ${
              isDark ? 'text-[#F1F5F9] border-[#243149]' : 'text-[#172033] border-[#E2E8F0]'
            }`}>
              Recent Account Action History
            </h3>
            <div className="space-y-2">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
              }`}>
                <div>
                  <div className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Active Enterprise Session</div>
                  <div className={`text-[10px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                    Signed in as {user.email || user.name} &bull; Security Role: {user.systemRole || 'Standard'}
                  </div>
                </div>
                <span className="badge-status badge-active text-[10px] font-mono">AUTH ACTIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

