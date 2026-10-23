import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Layers, 
  DollarSign, 
  ArrowUpRight,
  X
} from 'lucide-react';
import type { InventoryItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface InventoryManagerProps {
  inventory: InventoryItem[];
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory }) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQrItem, setSelectedQrItem] = useState<InventoryItem | null>(null);

  const filtered = inventory.filter((item) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInventoryValue = inventory.reduce((acc, i) => acc + i.stockQty * i.unitCost, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-amber-500 border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Inventory & Warehouse Control Studio
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Raw materials, hardware, sub-assemblies, bin location tracking, QR code scanning, and reorder alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search SKU, Name, Bin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Total Inventory Asset Valuation</span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Tracked SKUs</span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">{inventory.length} SKUs</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Reorder Warnings (&lt; Min Qty)</span>
          <div className="text-2xl font-bold text-amber-500 font-mono">{inventory.filter((i) => i.stockQty < i.minQty).length} SKUs</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="plm-table-container">
        <div className="overflow-x-auto">
          <table className="plm-table text-xs">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Item Description</th>
                <th>Category</th>
                <th>Location / Bin</th>
                <th className="text-center">Stock Qty</th>
                <th className="text-right">Unit Cost</th>
                <th className="text-center">QR Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold text-amber-500 font-mono">{item.sku}</td>
                  <td className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{item.name}</td>
                  <td className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{item.category}</td>
                  <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>{item.warehouseLocation} ({item.binNumber})</td>
                  <td className="text-center font-bold font-mono">
                    <span className={item.stockQty < item.minQty ? 'text-amber-500' : ''}>
                      {item.stockQty}
                    </span>
                    <span className={`text-[10px] ml-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>/ Min {item.minQty}</span>
                  </td>
                  <td className="text-right font-bold text-cyan-500 font-mono">${item.unitCost.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      onClick={() => setSelectedQrItem(item)}
                      className="btn-secondary btn-sm p-1.5 inline-flex items-center justify-center cursor-pointer"
                      title="View QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Label Modal */}
      {selectedQrItem && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-sm p-6 text-center space-y-4 text-xs">
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <span className={`font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>QR Code Label Printer</span>
              <button onClick={() => setSelectedQrItem(null)} className="text-secondary hover:text-primary cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
              {/* Simulated QR barcode graphic */}
              <div className="w-36 h-36 border-4 border-black p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-black" />
                  <div className="w-8 h-8 bg-black" />
                </div>
                <div className="text-[9px] font-bold text-black tracking-widest">{selectedQrItem.sku}</div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-black" />
                  <div className="w-4 h-4 bg-black" />
                </div>
              </div>
            </div>

            <div>
              <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{selectedQrItem.name}</div>
              <div className="text-xs text-amber-500 font-mono mt-1">Bin Location: {selectedQrItem.binNumber}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

