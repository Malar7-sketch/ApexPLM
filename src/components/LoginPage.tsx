import React, { useState } from 'react';
import { 
  Box, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Shield,
  X
} from 'lucide-react';
import { MOCK_USERS, type UserAccount } from '../data/mockUsers';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

import { authApi, setAuthToken, setStoredUser, generateClientJwt } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount, mode: 'admin' | 'employee') => void;
  users?: UserAccount[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, users }) => {
  const { isDark } = useTheme();
  const [loginMode, setLoginMode] = useState<'admin' | 'employee'>('employee');
  const [email, setEmail] = useState<string>('alex.rivera@apexplm.io');
  const [password, setPassword] = useState<string>('alex123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  const handleModeSwitch = (mode: 'admin' | 'employee') => {
    setLoginMode(mode);
    setErrorMsg(null);
    if (mode === 'admin') {
      setEmail('admin@apexplm.io');
      setPassword('admin123');
    } else {
      setEmail('alex.rivera@apexplm.io');
      setPassword('alex123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Attempt API login with Node.js + MongoDB Atlas backend
      const res = await authApi.login({
        email: email.trim(),
        password: password,
      });

      if (res && res.user) {
        const userStatus = String(res.user.status).toLowerCase();
        if (userStatus === 'blocked' || userStatus === 'locked') {
          setErrorMsg('Account Blocked: Your account has been blocked by a PLM Administrator. Access to all PLM services is prohibited.');
          setIsLoading(false);
          return;
        }


        if (loginMode === 'admin' && res.user.systemRole !== 'ADMIN') {
          setErrorMsg('Access Denied: Admin Login mode requires an Administrator account.');
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        onLoginSuccess(res.user, loginMode);
        return;
      }
    } catch (apiErr: any) {
      // If backend returned a specific error (e.g. Invalid credentials or Account Blocked)
      if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
        setIsLoading(false);
        setErrorMsg(apiErr.message);
        return;
      }

      // 2. Fallback check for local mock pool if backend is offline
      let pool = users && users.length > 0 ? users : MOCK_USERS;
      try {
        const saved = localStorage.getItem('apex_plm_users');
        if (saved) {
          pool = JSON.parse(saved);
        }
      } catch (err) {
        console.error('Failed to load user accounts for login:', err);
      }

      const cleanInput = email.toLowerCase().trim();
      const foundUser = pool.find(
        (u) =>
          (u.email.toLowerCase().trim() === cleanInput || u.employeeId.toLowerCase().trim() === cleanInput) &&
          u.password === password
      );

      if (foundUser) {
        if (foundUser.status === 'Blocked' || foundUser.status === 'Locked') {
          setErrorMsg('Account Blocked: Your account has been blocked by a PLM Administrator. Access to all PLM services is prohibited.');
          setIsLoading(false);
          return;
        }

        if (loginMode === 'admin' && foundUser.systemRole !== 'ADMIN') {
          setErrorMsg('Access Denied: Admin Login mode requires an Administrator account.');
          setIsLoading(false);
          return;
        }

        const clientToken = generateClientJwt(foundUser);
        setAuthToken(clientToken);
        setStoredUser(foundUser);
        setIsLoading(false);
        onLoginSuccess(foundUser, loginMode);
      } else {
        setIsLoading(false);
        setErrorMsg(apiErr.message || 'Invalid Corporate Email / Employee ID or Password. Please try again.');
      }
    }
  };


  const handleQuickFill = (userEmail: string, userPass: string, mode: 'admin' | 'employee') => {
    setLoginMode(mode);
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMsg(null);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors ${
      isDark ? 'bg-[#0B1220] text-[#F1F5F9]' : 'bg-[#F4F6F8] text-[#172033]'
    }`}>
      
      {/* Top Right Theme Toggle */}
      <div className="absolute top-5 right-5 z-30">
        <ThemeToggle />
      </div>

      {/* Background Subtle Pattern */}
      <div className={`absolute inset-0 [background-size:24px_24px] pointer-events-none ${
        isDark 
          ? 'bg-[radial-gradient(#243149_1px,transparent_1px)] opacity-40' 
          : 'bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] opacity-60'
      }`} />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Login Card */}
      <div className={`w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10 border transition-all ${
        isDark 
          ? 'bg-[#111B2E] border-[#243149]' 
          : 'bg-white border-[#E2E8F0]'
      }`}>
        
        {/* Left Panel: Enterprise Branding */}
        <div className={`p-8 border-r flex flex-col justify-between space-y-6 transition-colors ${
          isDark 
            ? 'bg-[#0D1628] border-[#243149]' 
            : 'bg-[#F8FAFC] border-[#E2E8F0]'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-2xl text-white shadow-md">
                <Box className="w-7 h-7 font-bold" />
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  ApexPLM Studio
                </h1>
                <p className="text-[11px] text-cyan-500 font-mono tracking-widest uppercase font-bold">
                  Digital Manufacturing Platform
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed pt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              ISO 9001 compliant enterprise product lifecycle management for Mechanical Engineering, CAD Vault, BOM Rollup, CAPP Process Planning, and RBAC Security.
            </p>
          </div>

          {/* Quick Demo User Credentials Picker */}
          <div className={`space-y-2 text-xs p-4 rounded-2xl border ${
            isDark 
              ? 'bg-[#111B2E] border-[#243149]' 
              : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className={`font-bold uppercase tracking-wider text-[10px] mb-2 flex items-center space-x-1.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              <Key className="w-3.5 h-3.5 text-cyan-500" />
              <span>Select Enterprise Demo Account:</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@apexplm.io', 'admin123', 'admin')}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  loginMode === 'admin' && email === 'admin@apexplm.io'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-500 font-bold'
                    : isDark 
                    ? 'bg-[#0D1628] hover:bg-[#151F32] border-[#243149] text-[#CBD5E1]' 
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]'
                }`}
              >
                <div>
                  <div className="font-bold text-purple-500">Sarah Connor</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>PLM Administrator</div>
                </div>
                <span className="badge-status badge-active text-[10px]">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('alex.rivera@apexplm.io', 'alex123', 'employee')}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  loginMode === 'employee' && email === 'alex.rivera@apexplm.io'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500 font-bold'
                    : isDark 
                    ? 'bg-[#0D1628] hover:bg-[#151F32] border-[#243149] text-[#CBD5E1]' 
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]'
                }`}
              >
                <div>
                  <div className="font-bold text-cyan-500">Alex Rivera</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Lead Mechanical Engineer</div>
                </div>
                <span className="badge-status badge-active text-[10px]">Design</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('marcus.vance@apexplm.io', 'marcus123', 'employee')}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  loginMode === 'employee' && email === 'marcus.vance@apexplm.io'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                    : isDark 
                    ? 'bg-[#0D1628] hover:bg-[#151F32] border-[#243149] text-[#CBD5E1]' 
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]'
                }`}
              >
                <div>
                  <div className="font-bold text-amber-500">Marcus Vance</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Manufacturing Engineer</div>
                </div>
                <span className="badge-status badge-review text-[10px]">Mfg</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('elena.rostova@apexplm.io', 'elena123', 'employee')}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  loginMode === 'employee' && email === 'elena.rostova@apexplm.io'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                    : isDark 
                    ? 'bg-[#0D1628] hover:bg-[#151F32] border-[#243149] text-[#CBD5E1]' 
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]'
                }`}
              >
                <div>
                  <div className="font-bold text-emerald-500">Dr. Elena Rostova</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Quality Lead Auditor</div>
                </div>
                <span className="badge-status badge-active text-[10px]">Quality</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('employee@apexplm.io', 'employee123', 'employee')}
                className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  loginMode === 'employee' && email === 'employee@apexplm.io'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-500 font-bold'
                    : isDark 
                    ? 'bg-[#0D1628] hover:bg-[#151F32] border-[#243149] text-[#CBD5E1]' 
                    : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]'
                }`}
              >
                <div>
                  <div className="font-bold text-blue-500">John Miller</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Assembly Technician</div>
                </div>
                <span className="badge-status badge-active text-[10px]">Employee</span>
              </button>
            </div>
          </div>

          <div className={`flex items-center space-x-2 text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>256-Bit Encrypted SSO & Dynamic RBAC Security</span>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Mode Switcher Tabs */}
            <div className={`flex p-1 rounded-xl border mb-4 text-xs ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <button
                type="button"
                onClick={() => handleModeSwitch('admin')}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginMode === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('employee')}
                className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginMode === 'employee'
                    ? 'btn-primary btn-sm'
                    : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Employee Login</span>
              </button>
            </div>

            <h2 className={`text-xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              {loginMode === 'admin' ? 'PLM Administrator Sign In' : 'Employee Portal Sign In'}
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              {loginMode === 'admin'
                ? 'Enter corporate admin credentials for full system control.'
                : 'Enter corporate credentials. System will auto-detect your role.'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className={`block mb-1.5 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>
                {loginMode === 'admin' ? 'Corporate Email / Admin ID' : 'Corporate Email / Employee ID'}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
                <input
                  type="text"
                  required
                  placeholder={loginMode === 'admin' ? 'admin@apexplm.io' : 'alex.rivera@apexplm.io'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="plm-input pl-10 pr-4 py-2.5 w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className={`block mb-1.5 font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>Password</label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="plm-input pl-10 pr-10 py-2.5 w-full text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-secondary hover:text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className={`flex items-center space-x-2 cursor-pointer ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-cyan-500 hover:underline cursor-pointer font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                loginMode === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'btn-primary'
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{loginMode === 'admin' ? 'Sign In as Administrator' : 'Sign In as Employee'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className={`text-[10px] text-center pt-2 border-t ${
            isDark ? 'text-[#64748B] border-[#243149]' : 'text-[#94A3B8] border-[#E2E8F0]'
          }`}>
            ApexPLM Enterprise Platform v8.4 &bull; Teamcenter / Windchill Compatible RBAC
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotModal && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
              <h3 className={`text-base font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Reset Enterprise Password</h3>
              <button onClick={() => setForgotModal(false)} className="text-secondary hover:text-primary cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>
              Enter your corporate email address to receive a secure password reset link.
            </p>

            {forgotSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-3 rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Password reset link sent to your corporate email!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="name@apexplm.io"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="plm-input w-full text-xs"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setForgotModal(false)}
                    className="btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setForgotSuccess(true)}
                    className="btn-primary btn-sm"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

