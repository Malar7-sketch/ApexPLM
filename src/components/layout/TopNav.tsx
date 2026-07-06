import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Moon, Sun, Bell, Command, ChevronRight, Home,
  X, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { notifications } from '@/data/plm-data';

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/products': 'Products',
  '/projects': 'Projects',
  '/lifecycle': 'Product Lifecycle',
  '/digital-twin': 'Digital Twin',
  '/cad-repository': 'CAD Repository',
  '/documents': 'Documents',
  '/bom-explorer': 'BOM Explorer',
  '/engineering-change': 'Engineering Change',
  '/manufacturing': 'Manufacturing',
  '/production': 'Production',
  '/quality': 'Quality',
  '/suppliers': 'Suppliers',
  '/inventory': 'Inventory',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/team': 'Team',
  '/settings': 'Settings',
  '/contact': 'Contact',
};

interface TopNavProps {
  sidebarCollapsed: boolean;
  onOpenCommandPalette: () => void;
}

export default function TopNav({ sidebarCollapsed, onOpenCommandPalette }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const currentPage = routeNames[location.pathname] || 'Home';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-30 glass-topnav flex items-center justify-between px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {location.pathname !== '/' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            <span className="font-medium text-gray-700 dark:text-gray-200">{currentPage}</span>
          </>
        )}
      </div>

      {/* Search Bar */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 min-w-[320px] border border-gray-200/50 dark:border-gray-700/50"
      >
        <Search className="w-4 h-4" />
        <span>Search products, CAD, BOM, ECOs...</span>
        <div className="ml-auto flex items-center gap-1 text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">
          <Command className="w-3 h-3" />K
        </div>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
        </button>

        {/* Clock */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
          <Clock className="w-[18px] h-[18px]" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-plm-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                        !n.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {!n.read && <div className="w-2 h-2 rounded-full bg-plm-accent mt-1.5 flex-shrink-0" />}
                        <div className={cn(!n.read ? '' : 'ml-5')}>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{n.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{n.time}</span>
                            <span className="plm-badge plm-badge-neutral text-[10px]">{n.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="w-9 h-9 rounded-xl bg-plm-accent flex items-center justify-center text-white font-bold text-sm">
            MM
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">Malarvannan M</div>
            <div className="text-[11px] text-gray-400">Design Engineer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
