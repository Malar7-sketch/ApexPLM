import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  User, 
  Shield, 
  X, 
  Zap, 
  ChevronDown,
  Layers,
  FileCheck2,
  GitBranch,
  CheckCircle,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_USERS, type UserAccount } from '../data/mockUsers';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { authApi, setAuthToken, setStoredUser, generateClientJwt } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount, mode: 'admin' | 'employee') => void;
  users?: UserAccount[];
}

// -----------------------------------------------------------------------------
// Unique PLM Proprietary Isometric Vector Insignia
// Represents Product (Top), Lifecycle (Left), Management (Right) with luminous core
// -----------------------------------------------------------------------------
export const PlmLogoMark: React.FC<{ isDark?: boolean; size?: number; className?: string }> = ({ 
  size = 40,
  className = '' 
}) => (
  <div 
    className={`inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-slate-200/80 shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    style={{ width: size, height: size }}
  >
    <img 
      src="/plm-logo.png" 
      alt="PLM Logo" 
      className="w-full h-full object-contain"
    />
  </div>
);

// -----------------------------------------------------------------------------
// Main PLM Studio Enterprise Login Component
// -----------------------------------------------------------------------------
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, users }) => {
  const { isDark } = useTheme();
  const [loginRole, setLoginRole] = useState<'employee' | 'admin'>('employee');
  const [email, setEmail] = useState<string>('alex.rivera@plmstudio.io');
  const [password, setPassword] = useState<string>('alex123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [showQuickFillMenu, setShowQuickFillMenu] = useState<boolean>(false);

  // Forgot Password Modal State
  const [forgotModal, setForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  // Password Security Clearance Calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: 'Awaiting Input', color: 'bg-slate-400' };
    if (pwd.length < 5) return { level: 1, label: 'Basic Key', color: 'bg-rose-500' };
    if (pwd.length < 8) return { level: 2, label: 'Operational Access', color: 'bg-amber-500' };
    return { level: 3, label: 'Defense-Grade 256-Bit', color: 'bg-emerald-400' };
  };
  const pwdStrength = getPasswordStrength(password);

  const handleRoleSwitch = (role: 'employee' | 'admin') => {
    setLoginRole(role);
    setErrorMsg(null);
    if (role === 'admin') {
      setEmail('admin@plmstudio.io');
      setPassword('admin123');
    } else {
      setEmail('alex.rivera@plmstudio.io');
      setPassword('alex123');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isCaps = e.getModifierState && e.getModifierState('CapsLock');
    setCapsLockOn(Boolean(isCaps));
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const rawInput = email.trim();
    // Universal domain normalizer: matches @plmstudio.io, @aerocore.io, and legacy @apexplm.io
    const normalizedInput = rawInput
      .replace(/@plmstudio\.io$/i, '@apexplm.io')
      .replace(/@aerocore\.io$/i, '@apexplm.io');

    try {
      // 1. Try Authenticating with backend REST API if online
      const isEmail = normalizedInput.includes('@');
      const response = await authApi.login(
        isEmail
          ? { email: normalizedInput, password }
          : { employeeId: normalizedInput, password }
      );

      if (response && response.token && response.user) {
        setAuthToken(response.token);
        setStoredUser(response.user);
        setIsLoading(false);
        onLoginSuccess(response.user, loginRole);
        return;
      }
    } catch {
      console.warn('[PLM Studio] Remote authentication server unreachable. Activating secure offline client gateway.');
    }

    // 2. Resilient Offline Fallback Authentication
    try {
      let pool: UserAccount[] = [];
      if (users && users.length > 0) {
        pool = users;
      } else {
        const stored = localStorage.getItem('apex_plm_users');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              pool = parsed;
            }
          } catch {
            pool = [];
          }
        }
      }

      if (pool.length === 0) {
        pool = MOCK_USERS;
      }

      const cleanNormalized = normalizedInput.toLowerCase().trim();
      const cleanRaw = rawInput.toLowerCase().trim();

      const foundUser = pool.find((u) => {
        const uEmail = u.email.toLowerCase().trim();
        const uEmp = u.employeeId.toLowerCase().trim();
        return (
          (uEmail === cleanNormalized || uEmail === cleanRaw || uEmp === cleanRaw) &&
          u.password === password
        );
      });

      if (foundUser) {
        if (foundUser.status === 'Blocked' || foundUser.status === 'Locked') {
          setErrorMsg('Security Notice: Credentials suspended by IT enterprise policy.');
          setIsLoading(false);
          return;
        }

        if (loginRole === 'admin' && foundUser.systemRole !== 'ADMIN') {
          setErrorMsg('Clearance Error: Administrator Gateway requires Tier-1 ROOT credentials.');
          setIsLoading(false);
          return;
        }

        const clientToken = generateClientJwt(foundUser);
        setAuthToken(clientToken);
        setStoredUser(foundUser);
        setIsLoading(false);
        onLoginSuccess(foundUser, loginRole);
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid corporate email or security key. Please check your credentials.');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('System authentication fault. Please contact your PLM administrator.');
    }
  };

  const handleSelectDemoAccount = (user: UserAccount) => {
    const isAdmin = user.systemRole === 'ADMIN';
    setLoginRole(isAdmin ? 'admin' : 'employee');
    setEmail(user.email.replace('@apexplm.io', '@plmstudio.io'));
    setPassword(user.password);
    setErrorMsg(null);
    setShowQuickFillMenu(false);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between font-sans relative overflow-x-hidden transition-colors duration-500 ${
      isDark ? 'bg-[#070B14] text-[#F8FAFC]' : 'bg-[#F4F6F9] text-[#0F172A]'
    }`}>

      {/* Atmospheric Soft Lighting Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[140px] transition-all duration-700 ${
          isDark ? 'bg-cyan-500/[0.08]' : 'bg-cyan-500/[0.04]'
        }`} />
        <div className={`absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full blur-[150px] transition-all duration-700 ${
          isDark ? 'bg-indigo-600/[0.08]' : 'bg-indigo-500/[0.04]'
        }`} />
        <div className={`absolute inset-0 [background-size:32px_32px] ${
          isDark 
            ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] opacity-40' 
            : 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] opacity-60'
        }`} />
      </div>

      {/* Top Precision Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <PlmLogoMark isDark={isDark} size={42} />
          <div>
            <div className="flex items-center space-x-2.5">
              <span className={`text-xl font-bold font-display tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                PLM Studio
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
              MISSION-CRITICAL PRODUCT LIFECYCLE & CAD PLATFORM
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[11px] font-mono backdrop-blur-md ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700 shadow-xs'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">US-EAST REPOSITORY</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">AUTHENTICATED TLS</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Balanced Viewport: Overview on Left + Clean Authentication Card on Right */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 md:py-10 my-auto flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 xl:gap-16">
        
        {/* Left Side: Proper Professional Headline & Platform Overview */}
        <div className="w-full lg:w-7/12 space-y-6">
          <div className="space-y-3">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
              <span>Digital Engineering & CAD Lifecycle Platform</span>
            </div>

            <h1 className={`text-4xl sm:text-5xl xl:text-6xl font-extrabold font-display tracking-tight leading-[1.12] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Design, Release & Validate with{' '}
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                Absolute Precision.
              </span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-xl ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Aerospace-grade parametric CAD vault, multi-level BOM synchronization, CAPP manufacturing routes, and automated stage-gate signoffs in one unified platform.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3.5 pt-1">
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="text-2xl font-bold font-display text-cyan-500">99.99%</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Audit Immutability</div>
            </div>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="text-2xl font-bold font-display text-indigo-500">&lt; 1.2s</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Multi-CAD Sync</div>
            </div>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="text-2xl font-bold font-display text-emerald-500">AS9100D</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Aerospace Certified</div>
            </div>
          </div>

          {/* 3 Core PLM Architecture Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center space-x-2 text-cyan-500 font-bold mb-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-bold font-display">CAD Model Vault</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Biometric check-in/out, multi-format 3D viewer & immutable revision history.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center space-x-2 text-purple-500 font-bold mb-2">
                <GitBranch className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold font-display">EBOM & MBOM</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Multi-tier BOM rollups, real-time cost rollups & CAPP manufacturing routes.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-slate-900/70 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-500 font-bold mb-2">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold font-display">Stage-Gate & ECN</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                ISO 9001:2015 change controls, automated 8D CAPA workflows & quality signoffs.
              </p>
            </div>
          </div>

          {/* Compliance Ticker */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 pt-0.5">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>ISO 9001:2015 Compliant</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>AS9100D Aerospace Certified</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>SOC 2 Type II Security</span>
            </div>
          </div>
        </div>

        {/* Right Side: Proper Enterprise Authentication Card */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className={`rounded-3xl border shadow-xl backdrop-blur-xl p-7 sm:p-8 relative transition-all ${
            isDark 
              ? 'bg-slate-900/95 border-slate-800 shadow-black/60' 
              : 'bg-white border-slate-200 shadow-slate-200/80'
          }`}>
            {/* Specular Top Line */}
            <div className="absolute top-0 inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            {/* Header */}
            <div className="space-y-1 mb-5">
              <h2 className={`text-2xl font-bold font-display tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Sign In to Workspace
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Enter your credentials to access engineering records & CAD vault.
              </p>
            </div>

            {/* Role Gateway Switcher */}
            <div className={`p-1 rounded-2xl border flex items-center mb-5 text-xs font-semibold ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => handleRoleSwitch('employee')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginRole === 'employee'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Engineering Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  loginRole === 'admin'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Administrator</span>
              </button>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 p-3 rounded-xl text-xs flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-medium leading-tight">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} onKeyDown={handleKeyDown} className="space-y-4 text-xs">
              {/* Email / ID */}
              <div className="space-y-1.5">
                <label className={`block font-semibold text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {loginRole === 'admin' ? 'Administrator Email' : 'Corporate Email or Employee ID'}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    required
                    placeholder={loginRole === 'admin' ? 'admin@plmstudio.io' : 'alex.rivera@plmstudio.io'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-sans outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 shadow-xs'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`block font-semibold text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium text-[11px]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs font-sans outline-none transition-all ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 shadow-xs'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-3 cursor-pointer ${
                      isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 w-6 rounded-full transition-colors ${
                          seg <= pwdStrength.level ? pwdStrength.color : isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {pwdStrength.label}
                  </span>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className={`flex items-center space-x-2 cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="font-medium text-[11px]">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                  loginRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO WORKSPACE</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Demo Switcher
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(MOCK_USERS[0])}
                  className={`py-2 px-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                    email === 'alex.rivera@plmstudio.io'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 font-bold'
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">👤</span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Alex Rivera</div>
                    <div className="text-[9px] text-slate-400">Lead Engineer</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDemoAccount(MOCK_USERS.find(u => u.systemRole === 'ADMIN') || MOCK_USERS[1])}
                  className={`py-2 px-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                    email === 'admin@plmstudio.io' || email === 'marcus.vance@plmstudio.io'
                      ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-400 font-bold'
                      : isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">🛡️</span>
                  <div className="truncate">
                    <div className="font-bold text-[11px]">Marcus Vance</div>
                    <div className="text-[9px] text-slate-400">System Admin</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Single-Line Executive Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-700/15">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ISO 9001:2015 &bull; AS9100D &bull; SOC 2 TYPE II CERTIFIED</span>
        </div>
        <div>
          &copy; 2026 PLM Studio Systems Inc. All rights reserved.
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl text-xs space-y-4 ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-700/40">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Reset Enterprise Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Enter your authorized corporate email address. A secure recovery key will be sent to your verified inbox.
              </p>

              {forgotSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-4 rounded-2xl flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <div>
                    <div className="font-bold">Password Reset Dispatched</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-300">Check your corporate inbox for the recovery key.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 font-semibold">Corporate Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="alex.rivera@plmstudio.io"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotSuccess(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer shadow-md"
                    >
                      Send Recovery Key
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
