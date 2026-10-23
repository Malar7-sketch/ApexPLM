import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  UserCheck, 
  Cpu, 
  CheckCircle2, 
  Building2, 
  FileKey,
  X
} from 'lucide-react';
import type { UserPersona } from '../types/plm';
import { USER_PERSONAS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface LoginModalProps {
  currentPersona: UserPersona;
  onLoginSelect: (persona: UserPersona) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentPersona,
  onLoginSelect,
  onClose
}) => {
  const { isDark } = useTheme();
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(currentPersona);
  const [jwtToken, setJwtToken] = useState<string>(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(currentPersona)}.eyJleHAiOjE3ODUzNDAwMDB9`
  );

  const handleSelectRole = (roleKey: UserPersona) => {
    setSelectedPersona(roleKey);
    setJwtToken(`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(roleKey)}.eyJleHAiOjE3ODUzNDAwMDB9`);
  };

  const handleAuthenticate = () => {
    onLoginSelect(selectedPersona);
    onClose();
  };

  const persona = USER_PERSONAS[selectedPersona];

  return (
    <div className="plm-modal-backdrop font-sans">
      <div className={`rounded-2xl w-full max-w-2xl p-6 border shadow-2xl space-y-6 transition-all ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white font-extrabold shadow-sm">
              <Cpu className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <span>ApexPLM Enterprise Gateway</span>
                <span className="badge-status badge-active text-[10px]">
                  JWT Secured
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                Role-Based Access Control (RBAC) & Single Sign-On
              </p>
            </div>
          </div>

          <button onClick={onClose} className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isDark ? 'border-[#243149] text-[#94A3B8] hover:text-white bg-[#0D1628]' : 'border-[#E2E8F0] text-[#64748B] hover:text-black bg-[#F8FAFC]'
          }`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Selector Grid */}
        <div className="space-y-3">
          <h3 className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Select Active User Role & Persona
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(USER_PERSONAS) as UserPersona[]).map((key) => {
              const info = USER_PERSONAS[key];
              const isSelected = key === selectedPersona;

              return (
                <div
                  key={key}
                  onClick={() => handleSelectRole(key)}
                  className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
                    isSelected
                      ? isDark ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm' : 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-sm'
                      : isDark ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500/40' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-cyan-500/40'
                  }`}
                >
                  <img src={info.avatar} alt={info.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700/50 shrink-0" />
                  <div className="overflow-hidden">
                    <div className={`text-xs font-bold truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{info.name}</div>
                    <div className="text-[11px] text-cyan-500 truncate font-mono">{info.role}</div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${info.badgeColor}`}>
                      {info.department}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions & JWT Token Viewer */}
        <div className={`p-4 rounded-xl border space-y-3 text-xs ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`flex items-center space-x-1.5 font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <FileKey className="w-4 h-4 text-amber-500" />
              <span>Granted Permissions Matrix</span>
            </span>
            <span className="badge-status badge-active text-[10px]">Token Status: VALID</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {persona.permissions.map((perm) => (
              <span key={perm} className={`px-2 py-0.5 rounded border text-[10px] ${
                isDark ? 'bg-[#111B2E] text-[#CBD5E1] border-[#243149]' : 'bg-white text-[#475569] border-[#E2E8F0]'
              }`}>
                ✓ {perm}
              </span>
            ))}
          </div>

          <div className={`border-t pt-2 flex items-center space-x-2 text-[10px] truncate ${
            isDark ? 'border-[#243149] text-[#64748B]' : 'border-[#E2E8F0] text-[#94A3B8]'
          }`}>
            <Key className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="truncate font-mono">Bearer Token: {jwtToken}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end space-x-3 border-t pt-4 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <button
            onClick={onClose}
            className="btn-secondary btn-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthenticate}
            className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Authenticate Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

