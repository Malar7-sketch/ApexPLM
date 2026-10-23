import React, { useState } from 'react';
import { 
  Building2, 
  Star, 
  Award, 
  Clock, 
  Mail, 
  Plus, 
  Search, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  Truck
} from 'lucide-react';
import type { Supplier } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onAddSupplier?: (supplier: Supplier) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = suppliers.filter((s) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-blue-500 border ${
            isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Supplier Relationship Management (SRM & Procurement)
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Approved Vendor List (AVL), supplier quality scores, lead-time tracking, and procurement RFQs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search Vendor, Code, Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input pl-9 pr-3 py-1.5 w-64 text-xs"
            />
          </div>

          <button className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className={`rounded-2xl p-5 border shadow-sm space-y-4 transition-all hover:shadow-md ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                  isDark ? 'bg-[#0D1628] text-cyan-400 border-[#243149]' : 'bg-[#F8FAFC] text-cyan-600 border-[#E2E8F0]'
                }`}>
                  {sup.vendorCode}
                </span>
                <h3 className={`text-base font-bold mt-1.5 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{sup.name}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{sup.category} • {sup.location}</p>
              </div>

              <span className="badge-status badge-active text-[11px] flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sup.status}</span>
              </span>
            </div>

            <div className={`grid grid-cols-3 gap-3 p-3 rounded-xl border text-center ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Rating Score</span>
                <span className="text-sm font-bold text-cyan-500 font-mono">{sup.ratingScore} / 100</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>On-Time Delivery</span>
                <span className="text-sm font-bold text-emerald-500 font-mono">{sup.deliveryScorePercent}%</span>
              </div>
              <div>
                <span className={`text-[10px] block ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Quality (PPM)</span>
                <span className="text-sm font-bold text-purple-500 font-mono">{sup.qualityScorePpm} PPM</span>
              </div>
            </div>

            <div className={`flex items-center justify-between border-t pt-3 text-[11px] ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <span className={`flex items-center space-x-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Standard Lead Time: {sup.leadTimeWeeks} Weeks</span>
              </span>

              <button className="text-cyan-500 hover:underline flex items-center space-x-1 font-bold cursor-pointer">
                <Mail className="w-3.5 h-3.5" />
                <span>Send RFQ</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

