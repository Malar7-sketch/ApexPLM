import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, FolderKanban, GitBranch, Box, HardDrive, 
  FileText, Network, GitPullRequest, Factory, Activity, ShieldCheck,
  Truck, Warehouse, BarChart3, ClipboardList, Users, Settings, Mail,
  ChevronLeft, ChevronRight, Sparkles, 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Package, FolderKanban, GitBranch, Box, HardDrive,
  FileText, Network, GitPullRequest, Factory, Activity, ShieldCheck,
  Truck, Warehouse, BarChart3, ClipboardList, Users, Settings, Mail,
};

const navSections = [
  { section: 'WORKSPACE', items: [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    { name: 'Products', path: '/products', icon: 'Package' },
    { name: 'Projects', path: '/projects', icon: 'FolderKanban' },
    { name: 'Product Lifecycle', path: '/lifecycle', icon: 'GitBranch' },
  ]},
  { section: 'ENGINEERING', items: [
    { name: 'Digital Twin', path: '/digital-twin', icon: 'Box' },
    { name: 'CAD Repository', path: '/cad-repository', icon: 'HardDrive' },
    { name: 'Documents', path: '/documents', icon: 'FileText' },
    { name: 'BOM Explorer', path: '/bom-explorer', icon: 'Network' },
    { name: 'Engineering Change', path: '/engineering-change', icon: 'GitPullRequest' },
  ]},
  { section: 'OPERATIONS', items: [
    { name: 'Manufacturing', path: '/manufacturing', icon: 'Factory' },
    { name: 'Production', path: '/production', icon: 'Activity' },
    { name: 'Quality', path: '/quality', icon: 'ShieldCheck' },
    { name: 'Suppliers', path: '/suppliers', icon: 'Truck' },
    { name: 'Inventory', path: '/inventory', icon: 'Warehouse' },
  ]},
  { section: 'INSIGHTS', items: [
    { name: 'Analytics', path: '/analytics', icon: 'BarChart3' },
    { name: 'Reports', path: '/reports', icon: 'ClipboardList' },
  ]},
  { section: 'ORGANIZATION', items: [
    { name: 'Team', path: '/team', icon: 'Users' },
    { name: 'Settings', path: '/settings', icon: 'Settings' },
    { name: 'Contact', path: '/contact', icon: 'Mail' },
  ]},
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenCopilot: () => void;
}

export default function Sidebar({ collapsed, onToggle, onOpenCopilot }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-40 glass-sidebar flex flex-col shadow-sidebar overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-plm-accent flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-bold text-base leading-tight">PLM Nexus</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Enterprise PLM</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.section} className="mb-2">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest"
                >
                  {section.section}
                </motion.div>
              )}
            </AnimatePresence>
            {section.items.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-plm-accent text-white shadow-lg shadow-plm-accent/25'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive && 'drop-shadow-sm')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.15 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="sidebar-dot"
                      className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* AI Copilot Button */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onOpenCopilot}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
            'bg-gradient-to-r from-plm-accent/20 to-orange-500/10 text-plm-accent hover:from-plm-accent/30 hover:to-orange-500/20',
            'transition-all duration-200 border border-plm-accent/20'
          )}
        >
          <Sparkles className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-left"
              >
                <div className="text-xs font-semibold">AI Copilot</div>
                <div className="text-[10px] text-gray-400">Press ⌘K to ask anything about PLM.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-plm-secondary border-2 border-plm-primary text-white flex items-center justify-center hover:bg-plm-accent transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
