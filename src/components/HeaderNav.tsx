import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Cpu, 
  LogOut, 
  User, 
  Lock,
  Sliders,
  Box,
  FileText,
  Briefcase,
  GitPullRequest,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import type { UserAccount } from '../data/mockUsers';
import type { PartItem, EngineeringDocument, Project, ECR, QualityNCR } from '../types/plm';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck } from 'lucide-react';
import { PlmLogoMark } from './LoginPage';

interface HeaderNavProps {
  currentUser: UserAccount | null;
  unreadNotifCount?: number;
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
  onSearchQuery?: (query: string) => void;
  parts?: PartItem[];
  documents?: EngineeringDocument[];
  projects?: Project[];
  ecrs?: ECR[];
  ncrs?: QualityNCR[];
  onSelectPart?: (partId: string) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentUser,
  unreadNotifCount = 0,
  onLogout,
  onNavigateTab,
  onSearchQuery,
  parts = [],
  documents = [],
  projects = [],
  ecrs = [],
  ncrs = [],
  onSelectPart
}) => {
  const { isDark } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Live Categorized Search Data from Central PLM State
  const searchCategories = [
    {
      category: 'PRODUCTS & CAD',
      icon: Box,
      items: parts.map(p => ({
        id: p.partNumber,
        label: `${p.partNumber} — ${p.name} (${p.currentRev})`,
        tab: 'products',
        partId: p.id
      }))
    },
    {
      category: 'DOCUMENTS & DRAWINGS',
      icon: FileText,
      items: documents.map(d => ({
        id: d.docNumber,
        label: `${d.docNumber} — ${d.title} (${d.revision})`,
        tab: 'documents'
      }))
    },
    {
      category: 'PROJECTS',
      icon: Briefcase,
      items: projects.map(prj => ({
        id: prj.code,
        label: `${prj.code} — ${prj.name} [${prj.status}]`,
        tab: 'projects'
      }))
    },
    {
      category: 'ENGINEERING CHANGES',
      icon: GitPullRequest,
      items: ecrs.map(e => ({
        id: e.id,
        label: `${e.id} — ${e.title} [${e.status}]`,
        tab: 'eco'
      }))
    },
    {
      category: 'QUALITY & NCR',
      icon: ShieldCheck,
      items: ncrs.map(n => ({
        id: n.ncrNumber || n.id,
        label: `${n.ncrNumber || n.id} — ${n.title || n.description || 'Non-Conformance'} [${n.status}]`,
        tab: 'quality'
      }))
    }
  ];

  const filteredCategories = searchCategories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((cat) => cat.items.length > 0);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className={`h-16 border-b px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md transition-colors ${
      isDark 
        ? 'bg-[#0D1628]/95 border-[#243149] shadow-sm' 
        : 'bg-white/95 border-[#E2E8F0] shadow-sm'
    }`}>
      {/* Brand Logo & Product Name */}
      <div className="flex items-center space-x-3.5 shrink-0">
        <button 
          onClick={() => onNavigateTab(currentUser?.systemRole === 'ADMIN' ? 'admin_dashboard' : 'employee_dashboard')}
          className="flex items-center space-x-3 group text-left cursor-pointer"
        >
          <PlmLogoMark isDark={isDark} size={36} />
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[15px] font-black tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                PLM Studio
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                v8.4 Enterprise
              </span>
            </div>
            <p className={`text-[11px] font-medium leading-none mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Mission-Critical Product Lifecycle Platform
            </p>
          </div>
        </button>
      </div>

      {/* Global Search Experience (380px) */}
      <div ref={searchRef} className="hidden md:block relative w-[380px] lg:w-[420px]">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} />
          <input
            type="text"
            value={searchQuery}
            placeholder="Search Part Number, Drawing, Project, Change..."
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
              if (onSearchQuery) onSearchQuery(e.target.value);
            }}
            className={`w-full h-10 text-[13px] rounded-lg pl-9 pr-8 border focus:outline-none transition-colors ${
              isDark 
                ? 'bg-[#0B1220] border-[#243149] text-[#F1F5F9] placeholder-[#64748B] focus:border-cyan-500' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033] placeholder-[#94A3B8] focus:border-cyan-600 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Instant Categorized Dropdown */}
        {showSearchDropdown && (
          <div className={`absolute left-0 right-0 mt-1.5 rounded-xl border p-2 shadow-2xl z-50 max-h-96 overflow-y-auto ${
            isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
          }`}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.category} className="mb-2 last:mb-0">
                    <div className={`flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'
                    }`}>
                      <Icon className="w-3 h-3 text-cyan-500" />
                      <span>{group.category}</span>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if ((item as any).partId && onSelectPart) {
                              onSelectPart((item as any).partId);
                            }
                            onNavigateTab(item.tab);
                            setShowSearchDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isDark 
                              ? 'hover:bg-[#151F32] text-[#CBD5E1] hover:text-white' 
                              : 'hover:bg-[#F1F5F9] text-[#334155] hover:text-[#172033]'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                            isDark ? 'bg-[#151F32] text-[#94A3B8]' : 'bg-[#E2E8F0] text-[#64748B]'
                          }`}>
                            {item.tab.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching engineering records found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Theme Toggle, Notifications, User Profile */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Global Theme Switcher */}
        <ThemeToggle />

        {/* Notifications Dropdown Panel */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`p-2 rounded-lg transition-colors relative cursor-pointer ${
              isDark 
                ? 'text-[#94A3B8] hover:text-white hover:bg-[#151F32]' 
                : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9]'
            }`}
            title="Engineering Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>

          {showNotifMenu && (
            <div className={`absolute right-0 mt-2 w-80 rounded-xl border p-3 shadow-2xl z-50 space-y-2 ${
              isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/50">
                <span className="text-xs font-bold">Notifications ({unreadNotifCount} unread)</span>
                <button
                  onClick={() => {
                    onNavigateTab('notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-[11px] text-cyan-500 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-1 text-xs">
                {unreadNotifCount === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No new notifications.
                  </div>
                ) : (
                  <div 
                    onClick={() => { onNavigateTab('notifications'); setShowNotifMenu(false); }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-[#151F32]' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>Action Items Pending</span>
                      <span className="text-[10px] text-amber-400 font-normal">Active</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                      You have {unreadNotifCount} unread system notice(s).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-2.5 h-10 px-2.5 rounded-lg border transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#0D1628] border-[#243149] hover:border-cyan-500 text-[#F1F5F9]' 
                : 'bg-white border-[#E2E8F0] hover:border-cyan-600 text-[#172033]'
            }`}
          >
            <div className={`w-6.5 h-6.5 rounded-md flex items-center justify-center text-sm shrink-0 ${
              isDark ? 'bg-[#151F32]' : 'bg-[#F1F5F9]'
            }`}>
              {currentUser?.avatar || '👤'}
            </div>
            <div className="text-left hidden sm:block truncate max-w-[130px]">
              <div className="text-xs font-semibold flex items-center space-x-1 truncate">
                <span className="truncate">{currentUser?.name || 'User'}</span>
                <ChevronDown className={`w-3 h-3 shrink-0 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} />
              </div>
              <div className={`text-[10px] truncate ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {currentUser?.role || 'Engineer'}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-3 shadow-2xl z-50 space-y-3 border ${
              isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
            }`}>
              {/* User Card */}
              <div className={`p-3 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="text-xs font-bold">{currentUser?.name || 'User'}</div>
                <div className={`text-[11px] truncate ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  {currentUser?.email || ''}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>
                    {currentUser?.employeeId || ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                  }`}>
                    {currentUser?.systemRole || 'DESIGN_ENGINEER'}
                  </span>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onNavigateTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center space-x-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#CBD5E1] hover:text-white' : 'hover:bg-[#F1F5F9] text-[#334155] hover:text-[#172033]'
                  }`}
                >
                  <User className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>My Profile & Engineering Credentials</span>
                </button>

                <button
                  onClick={() => {
                    onNavigateTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center space-x-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#CBD5E1] hover:text-white' : 'hover:bg-[#F1F5F9] text-[#334155] hover:text-[#172033]'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>System Preferences</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className={`border-t pt-2 ${isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'}`}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center space-x-2.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderNav;

