import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Layers, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  Maximize2
} from 'lucide-react';
import type { PartItem, LifecycleStage, PartCategory } from '../types/plm';
import { INITIAL_PARTS } from '../data/mockPlmData';
import { useTheme } from '../context/ThemeContext';

interface ItemMasterProps {
  parts?: PartItem[];
  selectedPartId?: string;
  onSelectPart: (partId: string) => void;
  onCheckoutToggle: (partId: string) => void;
}

export const ItemMaster: React.FC<ItemMasterProps> = ({
  parts: rawParts,
  selectedPartId,
  onSelectPart,
  onCheckoutToggle
}) => {
  const parts = rawParts !== undefined ? rawParts : [];
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');

  const filteredParts = parts.filter((part) => {
    const matchesSearch = 
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.tags || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || part.category === categoryFilter;
    const matchesStage = stageFilter === 'All' || part.lifecycleStage === stageFilter;

    return matchesSearch && matchesCategory && matchesStage;
  });

  const selectedPart = parts.find((p) => p.id === selectedPartId) || parts[0];

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className={`rounded-[14px] p-5 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl text-cyan-500 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Part & CAD Item Master
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Engineering repository managing CAD metadata, revision locks, material specs, and lifecycle states.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search PN, Name, Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input text-xs pl-9 pr-3 py-1.5 w-56"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="All">All Categories</option>
            <option value="CNC Machined">CNC Machined</option>
            <option value="Sheet Metal">Sheet Metal</option>
            <option value="Composite Assembly">Composite Assembly</option>
            <option value="Cast Metal">Cast Metal</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="All">All Stages</option>
            <option value="concept">Concept</option>
            <option value="design">Design</option>
            <option value="prototype">Prototype</option>
            <option value="production">Production</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Parts Catalog + Detailed Inspector Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parts List Catalog Table (8 Cols) */}
        <div className="lg:col-span-8 plm-table-container">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Part Name</th>
                <th>Rev</th>
                <th>Category</th>
                <th>Stage</th>
                <th>Vault State</th>
                <th className="text-right">Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => {
                const isSelected = part.id === selectedPart.id;

                return (
                  <tr
                    key={part.id}
                    onClick={() => onSelectPart(part.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? isDark ? 'bg-cyan-500/10 text-cyan-300 font-semibold' : 'bg-cyan-50 text-cyan-800 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="font-bold font-mono text-cyan-500">
                      {part.partNumber}
                    </td>
                    <td className="font-medium">
                      {part.name}
                    </td>
                    <td>
                      <span className="font-mono text-amber-500 font-semibold">
                        {part.currentRev}
                      </span>
                    </td>
                    <td>
                      {part.category}
                    </td>
                    <td>
                      <span className={`badge-status ${
                        part.lifecycleStage === 'production'
                          ? 'badge-active'
                          : part.lifecycleStage === 'prototype'
                          ? 'badge-pending'
                          : 'badge-progress'
                      }`}>
                        {part.lifecycleStage}
                      </span>
                    </td>
                    <td>
                      {part.isCheckedOut ? (
                        <span className="text-amber-500 flex items-center space-x-1 text-[11px] font-semibold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <span className="text-emerald-500 flex items-center space-x-1 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Available</span>
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono font-bold text-cyan-500">
                      ${part.estimatedCost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Part Detail Inspector Drawer (4 Cols) */}
        {selectedPart && (
          <div className={`lg:col-span-4 rounded-[14px] p-5 border shadow-sm space-y-4 ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="border-b pb-3 border-slate-700/30">
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-[#0D1628] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#E2E8F0] text-cyan-700'
              }`}>
                {selectedPart.partNumber}
              </span>
              <h3 className={`text-base font-bold mt-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{selectedPart.name}</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{selectedPart.description}</p>
            </div>

            {/* Lock / Checkout Interactive Action */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <div>
                <span className={`text-[10px] uppercase font-semibold block ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>CAD Vault Status</span>
                {selectedPart.isCheckedOut ? (
                  <span className="text-xs font-bold text-amber-500 flex items-center space-x-1 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked by {selectedPart.checkedOutBy}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-500 flex items-center space-x-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Available for Checkout</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => onCheckoutToggle(selectedPart.id)}
                className={selectedPart.isCheckedOut ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
              >
                {selectedPart.isCheckedOut ? 'Check In' : 'Check Out CAD'}
              </button>
            </div>

            {/* Material & Mass Specifications */}
            <div className="space-y-2 text-xs">
              <h4 className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Physical Specifications
              </h4>
              <div className={`p-3 rounded-xl border space-y-1.5 ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Material Spec:</span>
                  <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{selectedPart.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Mass (kg):</span>
                  <span className="text-purple-500 font-mono font-bold">{selectedPart.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>CAD File:</span>
                  <span className="text-cyan-500 font-mono">{selectedPart.cadMetadata.fileName}</span>
                </div>
              </div>
            </div>

            {/* Revision Audit Log History */}
            <div className="space-y-2">
              <h4 className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Revision History Log
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedPart.revisionHistory.map((rev) => (
                  <div key={rev.revId} className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-500">{rev.revId}</span>
                      <span className={`text-[10px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{rev.date}</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{rev.changeSummary}</p>
                    <div className="text-[10px] pt-1 border-t border-slate-700/20 flex justify-between">
                      <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Author: {rev.author}</span>
                      <span className="badge-status badge-active text-[9px]">{rev.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

