import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Edit2,
  Trash2,
  Download,
  Printer,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Warehouse,
  MapPin,
  Tag,
  Filter,
  FileSpreadsheet,
  Boxes,
  ExternalLink,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import QRCode from 'qrcode';
import type { InventoryItem, PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  setInventory?: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  parts?: PartItem[];
  currentUser?: any;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

const CATEGORIES: InventoryItem['category'][] = [
  'Raw Material',
  'Standard Hardware',
  'Component',
  'Sub-Assembly',
  'Finished Goods'
];

const WAREHOUSE_LOCATIONS = [
  'Warehouse A - Metal Yard',
  'Warehouse B - High-Precision Vault',
  'Warehouse C - Electronics Bay',
  'Main Plant - Assembly Line Store',
  'Finished Goods Warehouse - Dock 4',
  'Red Hold Quarantine Area'
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  inventory = [], 
  setInventory,
  parts = [],
  currentUser,
  logAction
}) => {
  const { isDark } = useTheme();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterWarningOnly, setFilterWarningOnly] = useState<boolean>(false);

  // QR Modal State
  const [selectedQrItem, setSelectedQrItem] = useState<InventoryItem | null>(null);
  const [qrFormat, setQrFormat] = useState<'sku' | 'full' | 'json'>('sku');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedQr, setCopiedQr] = useState<boolean>(false);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Fields
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>('Raw Material');
  const [formWarehouse, setFormWarehouse] = useState(WAREHOUSE_LOCATIONS[0]);
  const [formBin, setFormBin] = useState('');
  const [formStockQty, setFormStockQty] = useState<number>(100);
  const [formMinQty, setFormMinQty] = useState<number>(25);
  const [formMaxQty, setFormMaxQty] = useState<number>(500);
  const [formUnitCost, setFormUnitCost] = useState<number>(50);
  const [formLinkedPartId, setFormLinkedPartId] = useState<string>('');
  const [formSupplier, setFormSupplier] = useState('');

  // Stock Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('PO Supplier Delivery');

  // Import from Parts Master Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPartToImport, setSelectedPartToImport] = useState<string>('');

  // Real Scannable QR Code generation using genuine qrcode library
  useEffect(() => {
    if (!selectedQrItem) {
      setQrDataUrl('');
      return;
    }

    let payload = selectedQrItem.sku;
    if (qrFormat === 'full') {
      payload = `SKU: ${selectedQrItem.sku}\nName: ${selectedQrItem.name}\nBin: ${selectedQrItem.warehouseLocation} (${selectedQrItem.binNumber})\nStock: ${selectedQrItem.stockQty} / Min ${selectedQrItem.minQty}\nUnit Cost: $${selectedQrItem.unitCost.toFixed(2)}`;
    } else if (qrFormat === 'json') {
      payload = JSON.stringify({
        sku: selectedQrItem.sku,
        name: selectedQrItem.name,
        category: selectedQrItem.category,
        location: selectedQrItem.warehouseLocation,
        bin: selectedQrItem.binNumber,
        qty: selectedQrItem.stockQty,
        min: selectedQrItem.minQty,
        cost: selectedQrItem.unitCost
      }, null, 2);
    }

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate genuine QR code:', err));
  }, [selectedQrItem, qrFormat]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    const randomHex = Math.floor(Math.random() * 900 + 100);
    setFormSku(`SKU-RAW-${randomHex}`);
    setFormName('');
    setFormCategory('Raw Material');
    setFormWarehouse(WAREHOUSE_LOCATIONS[0]);
    setFormBin(`BIN-A-${Math.floor(Math.random() * 50 + 10)}`);
    setFormStockQty(50);
    setFormMinQty(20);
    setFormMaxQty(300);
    setFormUnitCost(75);
    setFormLinkedPartId('');
    setFormSupplier('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormSku(item.sku);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormWarehouse(item.warehouseLocation);
    setFormBin(item.binNumber);
    setFormStockQty(item.stockQty);
    setFormMinQty(item.minQty);
    setFormMaxQty(item.maxQty);
    setFormUnitCost(item.unitCost);
    setFormLinkedPartId(item.linkedPartId || '');
    setFormSupplier(item.supplier || '');
    setIsModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) return;

    const linkedPart = parts.find((p) => p.id === formLinkedPartId);

    if (editingItem) {
      // Update existing item
      const updated: InventoryItem = {
        ...editingItem,
        sku: formSku.trim(),
        name: formName.trim(),
        category: formCategory,
        warehouseLocation: formWarehouse,
        binNumber: formBin.trim() || 'A-01',
        stockQty: Number(formStockQty) || 0,
        minQty: Number(formMinQty) || 0,
        maxQty: Number(formMaxQty) || 100,
        unitCost: Number(formUnitCost) || 0,
        linkedPartId: linkedPart?.id,
        linkedPartNumber: linkedPart?.partNumber,
        supplier: formSupplier.trim() || undefined
      };

      if (setInventory) {
        setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      }

      if (logAction) {
        logAction(
          'Updated Inventory SKU',
          'INVENTORY',
          updated.sku,
          `SKU ${updated.sku} (${updated.name}) modified by ${currentUser?.name || 'User'}`
        );
      }
    } else {
      // Create new item
      const newItem: InventoryItem = {
        id: `INV-${Date.now()}`,
        sku: formSku.trim(),
        name: formName.trim(),
        category: formCategory,
        warehouseLocation: formWarehouse,
        binNumber: formBin.trim() || 'A-01',
        stockQty: Number(formStockQty) || 0,
        minQty: Number(formMinQty) || 0,
        maxQty: Number(formMaxQty) || 100,
        unitCost: Number(formUnitCost) || 0,
        qrCodeUrl: '',
        linkedPartId: linkedPart?.id,
        linkedPartNumber: linkedPart?.partNumber,
        supplier: formSupplier.trim() || undefined
      };

      if (setInventory) {
        setInventory((prev) => [newItem, ...prev]);
      }

      if (logAction) {
        logAction(
          'Created Inventory SKU',
          'INVENTORY',
          newItem.sku,
          `New SKU ${newItem.sku} created with ${newItem.stockQty} units in ${newItem.warehouseLocation}`
        );
      }
    }

    setIsModalOpen(false);
  };

  // Delete SKU
  const handleDeleteItem = (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to delete SKU "${item.sku}" (${item.name})?`)) return;

    if (setInventory) {
      setInventory((prev) => prev.filter((i) => i.id !== item.id));
    }

    if (logAction) {
      logAction(
        'Deleted Inventory SKU',
        'INVENTORY',
        item.sku,
        `SKU ${item.sku} deleted by ${currentUser?.name || 'User'}`
      );
    }
  };

  // Open Quick Stock Adjuster
  const handleOpenAdjust = (item: InventoryItem, defaultType: 'add' | 'remove') => {
    setAdjustingItem(item);
    setAdjustType(defaultType);
    setAdjustDelta(10);
    setAdjustReason(defaultType === 'add' ? 'PO Supplier Delivery' : 'Work Order Assembly Issue');
  };

  // Commit Stock Adjustment
  const handleCommitAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || adjustDelta <= 0) return;

    const delta = adjustType === 'add' ? adjustDelta : -adjustDelta;
    const newQty = Math.max(0, adjustingItem.stockQty + delta);

    if (setInventory) {
      setInventory((prev) =>
        prev.map((item) => (item.id === adjustingItem.id ? { ...item, stockQty: newQty } : item))
      );
    }

    if (logAction) {
      logAction(
        adjustType === 'add' ? 'Received Stock In' : 'Issued Stock Out',
        'INVENTORY',
        adjustingItem.sku,
        `${adjustType === 'add' ? '+' : '-'}${adjustDelta} units (New Total: ${newQty}). Reason: "${adjustReason}"`
      );
    }

    setAdjustingItem(null);
  };

  // Import Part into Inventory
  const handleImportPart = () => {
    const part = parts.find((p) => p.id === selectedPartToImport);
    if (!part) return;

    const newSku = `SKU-${part.partNumber}`;
    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      sku: newSku,
      name: part.name,
      category: 'Component',
      warehouseLocation: 'Warehouse B - High-Precision Vault',
      binNumber: `BIN-${part.partNumber.slice(-4) || 'P-01'}`,
      stockQty: 40,
      minQty: 10,
      maxQty: 200,
      unitCost: part.estimatedCost || 100,
      qrCodeUrl: '',
      linkedPartId: part.id,
      linkedPartNumber: part.partNumber,
      supplier: 'Apex In-House Machining'
    };

    if (setInventory) {
      setInventory((prev) => [newItem, ...prev]);
    }

    if (logAction) {
      logAction(
        'Imported Part to Inventory',
        'INVENTORY',
        newSku,
        `Part ${part.partNumber} imported as inventory SKU by ${currentUser?.name || 'User'}`
      );
    }

    setIsImportModalOpen(false);
    setSelectedPartToImport('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['SKU Code', 'Item Description', 'Category', 'Warehouse Location', 'Bin', 'Stock Qty', 'Min Qty', 'Max Qty', 'Unit Cost', 'Asset Value', 'Supplier'];
    const rows = inventory.map((i) => [
      `"${i.sku}"`,
      `"${i.name}"`,
      `"${i.category}"`,
      `"${i.warehouseLocation}"`,
      `"${i.binNumber}"`,
      i.stockQty,
      i.minQty,
      i.maxQty,
      i.unitCost.toFixed(2),
      (i.stockQty * i.unitCost).toFixed(2),
      `"${i.supplier || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Warehouse_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print QR Label
  const handlePrintLabel = () => {
    if (!selectedQrItem || !qrDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up was blocked. Please allow pop-ups to print barcode labels.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Label - ${selectedQrItem.sku}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; margin: 0; padding: 10px; }
            .label-card { border: 2px solid #000; border-radius: 8px; padding: 12px; width: 280px; margin: 0 auto; }
            .header { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; }
            .sku { font-size: 16px; font-weight: 900; margin: 6px 0; font-family: monospace; }
            .name { font-size: 11px; font-weight: 600; line-height: 1.3; margin-bottom: 8px; }
            img { width: 160px; height: 160px; display: block; margin: 0 auto 8px; }
            .footer { font-size: 10px; font-weight: bold; border-top: 1px dashed #999; padding-top: 6px; display: flex; justify-content: space-between; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="header">ApexPLM Warehouse Control</div>
            <div class="sku">${selectedQrItem.sku}</div>
            <img src="${qrDataUrl}" alt="${selectedQrItem.sku}" />
            <div class="name">${selectedQrItem.name}</div>
            <div class="footer">
              <span>LOC: ${selectedQrItem.binNumber}</span>
              <span>QTY: ${selectedQrItem.stockQty}</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy QR text
  const handleCopyQr = () => {
    if (!selectedQrItem) return;
    let payload = selectedQrItem.sku;
    if (qrFormat === 'full') {
      payload = `SKU: ${selectedQrItem.sku}\nName: ${selectedQrItem.name}\nBin: ${selectedQrItem.warehouseLocation} (${selectedQrItem.binNumber})\nStock: ${selectedQrItem.stockQty} / Min ${selectedQrItem.minQty}\nUnit Cost: $${selectedQrItem.unitCost.toFixed(2)}`;
    } else if (qrFormat === 'json') {
      payload = JSON.stringify({
        sku: selectedQrItem.sku,
        name: selectedQrItem.name,
        category: selectedQrItem.category,
        location: selectedQrItem.warehouseLocation,
        bin: selectedQrItem.binNumber,
        qty: selectedQrItem.stockQty,
        min: selectedQrItem.minQty,
        cost: selectedQrItem.unitCost
      }, null, 2);
    }
    navigator.clipboard.writeText(payload);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  // Filtered Items
  const filtered = inventory.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.binNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesWarning = !filterWarningOnly || item.stockQty < item.minQty;

    return matchesSearch && matchesCat && matchesWarning;
  });

  const totalInventoryValue = inventory.reduce((acc, i) => acc + i.stockQty * i.unitCost, 0);
  const reorderCount = inventory.filter((i) => i.stockQty < i.minQty).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-amber-500 border ${
            isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
          }`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Inventory & Warehouse Control Studio
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
                {inventory.length} SKUs Tracked
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Raw materials, hardware, sub-assemblies, bin location tracking, scannable QR codes, and reorder alerts.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={inventory.length === 0}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-[#243149] hover:bg-[#1A263D] text-[#94A3B8]' : 'border-[#CBD5E1] hover:bg-slate-100 text-[#475569]'
            }`}
            title="Export Inventory to CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          {/* Import from Parts Master */}
          {parts.length > 0 && (
            <button
              onClick={() => {
                setSelectedPartToImport(parts[0]?.id || '');
                setIsImportModalOpen(true);
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isDark ? 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
              }`}
              title="Import Part from Product Master to Inventory"
            >
              <Boxes className="w-4 h-4" />
              <span>Import Part SKU</span>
            </button>
          )}

          {/* Add SKU Button */}
          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Inventory SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Total Inventory Asset Valuation
          </span>
          <div className="text-2xl font-bold text-emerald-500 font-mono">
            ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Tracked SKUs & Locations
          </span>
          <div className="text-2xl font-bold text-cyan-500 font-mono">
            {inventory.length} SKUs
          </div>
        </div>

        <div 
          onClick={() => setFilterWarningOnly(!filterWarningOnly)}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
            filterWarningOnly
              ? 'border-amber-500 bg-amber-500/10'
              : isDark ? 'bg-[#111B2E] border-[#243149] hover:border-amber-500/40' : 'bg-white border-[#E2E8F0] hover:border-amber-400'
          }`}
          title="Click to toggle filter for reorder warnings"
        >
          <div className="flex items-center justify-between">
            <span className={`font-semibold block mb-1 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Reorder Warnings (&lt; Min Qty)
            </span>
            {filterWarningOnly && (
              <span className="text-[10px] text-amber-500 font-bold uppercase">Filter Active</span>
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${reorderCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
            {reorderCount} SKUs
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search SKU, Name, Bin, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input pl-9 pr-3 py-1.5 w-full text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
            }`}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Quick Warning Filter Button */}
          {reorderCount > 0 && (
            <button
              onClick={() => setFilterWarningOnly(!filterWarningOnly)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                filterWarningOnly
                  ? 'bg-amber-500 text-black border-amber-500'
                  : isDark ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-amber-300 text-amber-700 bg-amber-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts ({reorderCount})</span>
            </button>
          )}
        </div>

        <span className={`text-[11px] font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
          Showing {filtered.length} of {inventory.length} Items
        </span>
      </div>

      {/* Inventory Table */}
      {filtered.length === 0 ? (
        <div className={`p-12 rounded-2xl border border-dashed text-center space-y-4 ${
          isDark ? 'bg-[#111B2E]/60 border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Inventory Items Found
            </h3>
            <p className="text-xs text-slate-400">
              {searchTerm || selectedCategory !== 'all' || filterWarningOnly 
                ? 'No items match your active filters. Try clearing search criteria.'
                : 'Your warehouse inventory is currently empty. Click "+ Add Inventory SKU" or import a part.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center space-x-1.5 cursor-pointer font-bold mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create First SKU</span>
          </button>
        </div>
      ) : (
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
                  <th className="text-right">Asset Value</th>
                  <th className="text-center">QR Code</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.stockQty < item.minQty;
                  return (
                    <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="font-bold text-amber-500 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.sku}</span>
                          {item.linkedPartNumber && (
                            <span 
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                                isDark ? 'bg-[#0D1628] border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'
                              }`}
                              title={`Linked Part: ${item.linkedPartNumber}`}
                            >
                              {item.linkedPartNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`font-semibold max-w-xs truncate ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                        <div>{item.name}</div>
                        {item.supplier && (
                          <div className={`text-[10px] font-normal ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                            Supplier: {item.supplier}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          item.category === 'Raw Material'
                            ? isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                            : item.category === 'Finished Goods'
                            ? isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>
                        <div className="flex items-center space-x-1 font-mono text-[11px]">
                          <MapPin className="w-3 h-3 text-cyan-500 shrink-0" />
                          <span>{item.warehouseLocation}</span>
                          <span className="font-bold text-amber-400">({item.binNumber})</span>
                        </div>
                      </td>
                      <td className="text-center font-bold font-mono">
                        <div className="inline-flex items-center space-x-1.5">
                          <span className={`text-sm ${isLow ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {item.stockQty}
                          </span>
                          <span className={`text-[10px] font-normal ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                            / Min {item.minQty}
                          </span>
                          {isLow && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Stock below minimum threshold!" />
                          )}
                        </div>
                      </td>
                      <td className="text-right font-bold text-cyan-500 font-mono">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="text-right font-bold font-mono text-emerald-400">
                        ${(item.stockQty * item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            setSelectedQrItem(item);
                            setQrFormat('sku');
                          }}
                          className={`btn-secondary btn-sm p-1.5 inline-flex items-center justify-center cursor-pointer transition-all ${
                            isDark ? 'hover:text-cyan-400 hover:border-cyan-500' : 'hover:text-cyan-700 hover:border-cyan-500'
                          }`}
                          title="Generate Scannable QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="inline-flex items-center space-x-1">
                          {/* Quick Adjust Buttons */}
                          <button
                            onClick={() => handleOpenAdjust(item, 'add')}
                            className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 cursor-pointer"
                            title="Receive Stock (+)"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item, 'remove')}
                            className="p-1 rounded hover:bg-amber-500/10 text-amber-400 cursor-pointer"
                            title="Issue Stock (-)"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded hover:bg-cyan-500/10 text-cyan-400 cursor-pointer"
                            title="Edit SKU Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1 rounded hover:bg-rose-500/10 text-rose-400 cursor-pointer"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= REAL SCANNABLE QR CODE MODAL ================= */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 text-center space-y-4 text-xs ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2 text-left">
                <QrCode className="w-5 h-5 text-cyan-500" />
                <div>
                  <h3 className="font-bold text-sm">Industrial QR Code Label</h3>
                  <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    100% Scannable ISO/IEC 18004 Standard QR Code
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedQrItem(null)} 
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format Selector */}
            <div className={`p-1.5 rounded-xl border flex items-center justify-center space-x-1 ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setQrFormat('sku')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  qrFormat === 'sku'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                SKU Only
              </button>
              <button
                onClick={() => setQrFormat('full')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  qrFormat === 'full'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                Full Details
              </button>
              <button
                onClick={() => setQrFormat('json')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  qrFormat === 'json'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                Scanner JSON
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-xl border-4 border-slate-900 mx-auto">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={selectedQrItem.sku} 
                  className="w-56 h-56 mx-auto block object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Generating QR Code...
                </div>
              )}
              <div className="text-[12px] font-black text-black tracking-widest font-mono mt-2 uppercase">
                {selectedQrItem.sku}
              </div>
            </div>

            {/* Details Box */}
            <div className={`p-3 rounded-xl border text-left space-y-1 ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-xs truncate">{selectedQrItem.name}</div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Location: <strong className="text-amber-400">{selectedQrItem.binNumber}</strong></span>
                <span>Stock: <strong className="text-emerald-400">{selectedQrItem.stockQty} Units</strong></span>
              </div>
            </div>

            {/* Modal Actions: Print, Download, Copy */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handlePrintLabel}
                className="btn-primary py-2 px-3 text-xs flex items-center justify-center space-x-1.5 cursor-pointer font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </button>

              <a
                href={qrDataUrl}
                download={`QR_${selectedQrItem.sku}.png`}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                  isDark ? 'border-[#243149] bg-[#111B2E] hover:bg-[#1A263D] text-cyan-400' : 'border-[#CBD5E1] bg-white hover:bg-slate-100 text-cyan-700'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </a>

              <button
                onClick={handleCopyQr}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                  copiedQr
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : isDark ? 'border-[#243149] bg-[#111B2E] hover:bg-[#1A263D] text-slate-300' : 'border-[#CBD5E1] bg-white hover:bg-slate-100 text-slate-700'
                }`}
              >
                {copiedQr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedQr ? 'Copied!' : 'Copy Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE / EDIT INVENTORY ITEM MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2.5">
                <Package className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Inventory Item' : 'Add New Inventory SKU'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold block">SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. SKU-ALU-7075-BAR"
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149] text-amber-400' : 'bg-[#F8FAFC] border-[#CBD5E1] text-amber-600'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Item Description & Specification</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aluminum 7075-T6 Round Billet Stock Ø190mm x 3m"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold block">Warehouse Location</label>
                  <select
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                  >
                    {WAREHOUSE_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Bin / Shelf Number</label>
                  <input
                    type="text"
                    value={formBin}
                    onChange={(e) => setFormBin(e.target.value)}
                    placeholder="e.g. A-12-04 or RACK-3-B"
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold block">Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149] text-emerald-400' : 'bg-[#F8FAFC] border-[#CBD5E1] text-emerald-600'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Min Qty (Reorder)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Max Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={formMaxQty}
                    onChange={(e) => setFormMaxQty(parseInt(e.target.value) || 100)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formUnitCost}
                    onChange={(e) => setFormUnitCost(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#CBD5E1] text-cyan-600'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-semibold block">Linked Part (Optional)</label>
                  <select
                    value={formLinkedPartId}
                    onChange={(e) => setFormLinkedPartId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                  >
                    <option value="">No linked part</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partNumber} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="e.g. Alcoa Aerospace Metals"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                      isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                    }`}
                  />
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-end space-x-3 ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border font-semibold cursor-pointer ${
                    isDark ? 'border-[#243149] hover:bg-[#1A263D] text-slate-400' : 'border-[#CBD5E1] hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 font-bold cursor-pointer"
                >
                  {editingItem ? 'Save SKU Changes' : 'Create Inventory Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= QUICK STOCK ADJUST MODAL ================= */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4 text-xs ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm">Quick Stock Adjustment</h3>
              </div>
              <button 
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-amber-400 font-mono">{adjustingItem.sku}</div>
              <div className="truncate font-semibold text-[11px]">{adjustingItem.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Current Stock: <strong className="text-cyan-400">{adjustingItem.stockQty}</strong> units
              </div>
            </div>

            <form onSubmit={handleCommitAdjust} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                    adjustType === 'add'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : isDark ? 'border-[#243149] bg-[#111B2E] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Receive (+ Stock)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                    adjustType === 'remove'
                      ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                      : isDark ? 'border-[#243149] bg-[#111B2E] text-slate-400' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Issue (- Stock)</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Quantity to {adjustType === 'add' ? 'Receive' : 'Issue'}</label>
                <input
                  type="number"
                  min="1"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono font-bold text-center text-sm focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#111B2E] border-[#243149] text-cyan-400' : 'bg-[#F8FAFC] border-[#CBD5E1] text-cyan-600'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Reason / Reference</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. PO Arrival #8902 or Scrap"
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                  }`}
                  required
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className={`flex-1 py-2 rounded-xl border font-semibold cursor-pointer ${
                    isDark ? 'border-[#243149] hover:bg-[#1A263D] text-slate-400' : 'border-[#CBD5E1] hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-2 font-bold cursor-pointer"
                >
                  Confirm {adjustType === 'add' ? `+${adjustDelta}` : `-${adjustDelta}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= IMPORT FROM PARTS MASTER MODAL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 text-xs ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Import Part from Product Master</h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Select an engineering part from the Product Master to instantly generate a tracked warehouse SKU with pre-filled costs and descriptions.
            </p>

            <div className="space-y-1.5">
              <label className="font-semibold block">Select Engineering Part</label>
              <select
                value={selectedPartToImport}
                onChange={(e) => setSelectedPartToImport(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-[#F8FAFC] border-[#CBD5E1]'
                }`}
              >
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partNumber} - {p.name} (${p.estimatedCost})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className={`px-4 py-2 rounded-xl border font-semibold cursor-pointer ${
                  isDark ? 'border-[#243149] hover:bg-[#1A263D] text-slate-400' : 'border-[#CBD5E1] hover:bg-slate-100 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPart}
                className="btn-primary py-2 px-4 font-bold cursor-pointer"
              >
                Import as Tracked SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
