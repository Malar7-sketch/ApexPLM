import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, ShieldCheck, FileText, Filter, Trash2 } from 'lucide-react';
import type { UserNotification } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface NotificationCenterProps {
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onNavigateTab
}) => {
  const { isDark } = useTheme();
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Unread', 'Tasks', 'Approvals', 'Quality', 'Engineering', 'System'];

  const filtered = notifications.filter((item) => {
    if (filterCategory === 'All') return true;
    if (filterCategory === 'Unread') return !item.isRead;
    return item.category === filterCategory;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Tasks': return 'badge-status badge-active';
      case 'Approvals': return 'badge-status badge-review';
      case 'Quality': return 'badge-status badge-active';
      case 'Engineering': return 'badge-status badge-active';
      case 'System': return 'badge-status badge-draft';
      default: return 'badge-status badge-draft';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-pink-500 border ${
            isDark ? 'bg-pink-500/10 border-pink-500/30' : 'bg-pink-50 border-pink-200'
          }`}>
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Personalized Enterprise Notification Center</span>
              <span className="badge-status badge-draft text-[10px]">
                INBOX
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Stay informed on assigned tasks, ECN signoff requests, CAD revision updates, and quality alerts.
            </p>
          </div>
        </div>

        <button
          onClick={onClearAll}
          className="btn-secondary btn-sm inline-flex items-center space-x-2 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Read Notifications</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={`flex items-center p-1.5 rounded-2xl border space-x-1 text-xs overflow-x-auto ${
        isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
      }`}>
        {categories.map((cat) => {
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                isActive
                  ? 'btn-primary btn-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 text-xs">
        {filtered.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center border ${
            isDark ? 'bg-[#111B2E] border-[#243149] text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
          }`}>
            No notifications found for selected filter category.
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-2xl p-4 border shadow-sm flex items-start justify-between gap-4 transition-all ${
                notif.isRead
                  ? isDark ? 'bg-[#111B2E] border-[#243149] opacity-75' : 'bg-white border-[#E2E8F0] opacity-75'
                  : isDark ? 'bg-[#111B2E] border-cyan-500/40 shadow-sm' : 'bg-white border-cyan-400 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={getCategoryBadgeClass(notif.category)}>
                    {notif.category}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{notif.timestamp}</span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unread" />
                  )}
                </div>

                <h4 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{notif.title}</h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{notif.message}</p>

                {notif.linkTab && (
                  <button
                    onClick={() => onNavigateTab(notif.linkTab!)}
                    className="text-cyan-500 text-[11px] font-bold hover:underline pt-1 inline-block cursor-pointer"
                  >
                    Open Action Item &rarr;
                  </button>
                )}
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => onMarkAsRead(notif.id)}
                  className="btn-secondary p-2 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer"
                  title="Mark as read"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

