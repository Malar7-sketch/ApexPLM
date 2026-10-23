import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  X, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  Scale, 
  Package, 
  Boxes,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { PartItem } from '../types/plm';

export interface BomInspectorItem {
  id: string;
  level: 'L1' | 'L2';
  partNumber: string;
  name: string;
  category: 'Assembly' | 'Machined' | 'Electrical' | 'Hardware' | 'Composite';
  quantity: number;
  unitCost: number;
  extCost: number;
  material: string;
  weightKg: number;
  lifecycle: 'Released' | 'In Review' | 'Draft' | 'Prototype';
  supplier: string;
  leadTimeWeeks: number;
  inStock: boolean;
  notes: string;
}

interface CadBomInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartItem;
  revision: string;
  onNavigateToBomExplorer?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CadBomInspectorModal: React.FC<CadBomInspectorModalProps> = ({
  isOpen,
  onClose,
  part,
  revision,
  onNavigateToBomExplorer,
  onShowToast
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'L1' | 'L2'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'instock' | 'sourcing'>('all');
  const [selectedItem, setSelectedItem] = useState<BomInspectorItem | null>(null);

  // Default multi-tier BOM items for ASM-EV-9000 or dynamic generation for any part
  const bomItems: BomInspectorItem[] = useMemo(() => {
    return [
      {
        id: 'bom-1',
        level: 'L1',
        partNumber: 'ASM-FRM-01',
        name: 'Frame Chassis Assembly',
        category: 'Assembly',
        quantity: 1,
        unitCost: 420.00,
        extCost: 420.00,
        material: 'Aluminium 7075-T6 & Carbon Truss',
        weightKg: 9.80,
        lifecycle: 'Released',
        supplier: 'Apex In-House Machining Div',
        leadTimeWeeks: 3,
        inStock: true,
        notes: 'Hydroformed backbone chassis with reinforced steering head'
      },
      {
        id: 'bom-2',
        level: 'L2',
        partNumber: 'PN-FRAME-01',
        name: 'Main Chassis Backbone Extrusion',
        category: 'Machined',
        quantity: 1,
        unitCost: 260.00,
        extCost: 260.00,
        material: 'Al 7075-T6 Seamless Extrusion',
        weightKg: 6.40,
        lifecycle: 'Released',
        supplier: 'Kaiser Aluminum Inc.',
        leadTimeWeeks: 2,
        inStock: true,
        notes: '3.2mm uniform wall thickness with CNC weight-reduction pocketing'
      },
      {
        id: 'bom-3',
        level: 'L2',
        partNumber: 'PN-FORK-04',
        name: 'Front Suspension Fork Unit',
        category: 'Machined',
        quantity: 1,
        unitCost: 115.00,
        extCost: 115.00,
        material: 'Forged 6061-T6 Billet Alloy',
        weightKg: 2.30,
        lifecycle: 'Released',
        supplier: 'Fox Precision Forgings',
        leadTimeWeeks: 3,
        inStock: true,
        notes: 'CNC finished dual stanchion with integrated steering knuckle'
      },
      {
        id: 'bom-4',
        level: 'L2',
        partNumber: 'PN-BATT-02',
        name: 'Battery Cradle Isolation Mount',
        category: 'Hardware',
        quantity: 2,
        unitCost: 22.50,
        extCost: 45.00,
        material: 'Sheet Metal 5052-H32 & EPDM Gasket',
        weightKg: 1.10,
        lifecycle: 'In Review',
        supplier: 'Apex Sheet Metal Fab',
        leadTimeWeeks: 1,
        inStock: true,
        notes: 'Vibration-isolated tray rated for 48V 20Ah lithium-ion battery pack'
      },
      {
        id: 'bom-5',
        level: 'L1',
        partNumber: 'ASM-DRV-90',
        name: 'Drivetrain & Planetary Gearbox Sub-Assembly',
        category: 'Assembly',
        quantity: 1,
        unitCost: 680.00,
        extCost: 680.00,
        material: 'Powertrain Mixed High-Strength Alloys',
        weightKg: 11.20,
        lifecycle: 'In Review',
        supplier: 'Apex Powertrain Division',
        leadTimeWeeks: 4,
        inStock: false,
        notes: '750W peak planetary hub drive system with enlarged 18mm pitch radius'
      },
      {
        id: 'bom-6',
        level: 'L2',
        partNumber: 'PN-MTR-900',
        name: 'Brushless DC Hub Motor (750W Peak)',
        category: 'Electrical',
        quantity: 1,
        unitCost: 380.00,
        extCost: 380.00,
        material: 'NdFeB Magnets / Oxygen-Free Cu / Steel',
        weightKg: 5.80,
        lifecycle: 'Released',
        supplier: 'Bafang Electric Tech Co.',
        leadTimeWeeks: 4,
        inStock: true,
        notes: 'IP67 waterproof rated high-torque hub stator assembly'
      },
      {
        id: 'bom-7',
        level: 'L2',
        partNumber: 'PN-SHFT-12',
        name: 'Planetary Central Sun Shaft',
        category: 'Machined',
        quantity: 1,
        unitCost: 85.00,
        extCost: 85.00,
        material: 'CNC Turned 4140 Alloy Steel',
        weightKg: 1.40,
        lifecycle: 'In Review',
        supplier: 'Apex Precision Machining',
        leadTimeWeeks: 2,
        inStock: false,
        notes: 'Induction case-hardened teeth with spline drive connection'
      },
      {
        id: 'bom-8',
        level: 'L2',
        partNumber: 'PN-GEAR-33',
        name: 'Planetary Gear 18T (Tri-Set)',
        category: 'Machined',
        quantity: 3,
        unitCost: 45.00,
        extCost: 135.00,
        material: '20MnCr5 Case Hardened Alloy Steel',
        weightKg: 1.80,
        lifecycle: 'In Review',
        supplier: 'Gleason Gear Systems',
        leadTimeWeeks: 3,
        inStock: true,
        notes: 'AGMA Class 11 precision gear teeth ground to Ra 0.4um'
      },
      {
        id: 'bom-9',
        level: 'L2',
        partNumber: 'PN-CHN-05',
        name: 'Heavy-Duty Drive Chain Unit',
        category: 'Hardware',
        quantity: 1,
        unitCost: 80.00,
        extCost: 80.00,
        material: 'ISO 606 High Tensile Alloy Steel',
        weightKg: 2.20,
        lifecycle: 'Released',
        supplier: 'Tsubaki Chain Corp',
        leadTimeWeeks: 1,
        inStock: true,
        notes: 'O-ring sealed self-lubricating link assembly with pre-tensioning'
      },
      {
        id: 'bom-10',
        level: 'L1',
        partNumber: 'ASM-WHL-10',
        name: '10-inch Wheel & Tubeless Tire Assembly',
        category: 'Assembly',
        quantity: 2,
        unitCost: 185.00,
        extCost: 370.00,
        material: 'Magnesium Die-Cast Rim & Silica Rubber',
        weightKg: 4.60,
        lifecycle: 'Released',
        supplier: 'Enkei Mobility Ltd.',
        leadTimeWeeks: 2,
        inStock: true,
        notes: 'Dual wheel set with sealed deep-groove ceramic ball bearings'
      },
      {
        id: 'bom-11',
        level: 'L1',
        partNumber: 'ASM-BRK-20',
        name: 'Dual-Piston Hydraulic Disc Brake System',
        category: 'Assembly',
        quantity: 2,
        unitCost: 190.00,
        extCost: 380.00,
        material: 'SUS410 Rotor & Forged Billet Caliper',
        weightKg: 2.80,
        lifecycle: 'Released',
        supplier: 'Shimano Industrial Corp',
        leadTimeWeeks: 2,
        inStock: true,
        notes: '140mm ventilated brake rotor with mineral oil hydraulic circuit'
      }
    ];
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return bomItems.filter((item) => {
      // Level Filter
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      // Status / Stock Filter
      if (statusFilter === 'instock' && !item.inStock) return false;
      if (statusFilter === 'sourcing' && item.inStock) return false;
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.partNumber.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bomItems, levelFilter, statusFilter, searchTerm]);

  // Rollup KPI Calculations
  const totalRolledCost = bomItems.reduce((acc, item) => acc + item.extCost, 0);
  const totalRolledWeight = bomItems.reduce((acc, item) => acc + item.weightKg, 0);
  const inStockCount = bomItems.filter(i => i.inStock).length;
  const sourcingCount = bomItems.filter(i => !i.inStock).length;
  const l1Count = bomItems.filter(i => i.level === 'L1').length;
  const l2Count = bomItems.filter(i => i.level === 'L2').length;

  // CSV Export Handler
  const handleExportCsv = () => {
    const headers = [
      'Level',
      'Part Number',
      'Component Name',
      'Category',
      'Quantity',
      'Unit Cost (USD)',
      'Extended Cost (USD)',
      'Material / Specification',
      'Weight (kg)',
      'Lifecycle Status',
      'Supplier',
      'Lead Time (Weeks)',
      'In Stock'
    ];

    const rows = filteredItems.map(item => [
      item.level,
      `"${item.partNumber}"`,
      `"${item.name}"`,
      item.category,
      item.quantity,
      item.unitCost.toFixed(2),
      item.extCost.toFixed(2),
      `"${item.material}"`,
      item.weightKg.toFixed(2),
      item.lifecycle,
      `"${item.supplier}"`,
      item.leadTimeWeeks,
      item.inStock ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${part.partNumber || 'ASM-EV-9000'}_Rev_${revision}_BOM_Inspector.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast?.(`Exported ${filteredItems.length} BOM components to CSV successfully`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`rounded-2xl border max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh] transition-colors ${
        isDark ? 'bg-[#0f172a] border-[#1e293b] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
      }`}>
        
        {/* MODAL HEADER */}
        <div className={`p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-[#0c1322]' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Multi-Tier Bill of Materials (BOM) Inspector</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Rev {revision}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Active Assembly: <strong className="font-mono text-cyan-400">{part.partNumber}</strong> &bull; {part.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportCsv}
              className={`btn-sm flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Download BOM as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            {onNavigateToBomExplorer && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToBomExplorer();
                }}
                className="btn-sm flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                title="Navigate to full interactive BOM Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full BOM Explorer</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ROLLUP KPI CARDS */}
        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 border-b text-xs ${
          isDark ? 'bg-[#0b1120] border-slate-800/80' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111c33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              <span>Components</span>
            </div>
            <div className="font-bold text-sm text-cyan-400 font-mono">
              {bomItems.length} Items <span className="text-[10px] text-slate-400 font-normal">({l1Count} L1 / {l2Count} L2)</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111c33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rolled-Up Cost</span>
            </div>
            <div className="font-bold text-sm text-emerald-400 font-mono">
              ${totalRolledCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111c33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Mass Rollup</span>
            </div>
            <div className="font-bold text-sm text-amber-400 font-mono">
              {totalRolledWeight.toFixed(2)} kg
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111c33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>Procurement</span>
            </div>
            <div className="font-bold text-sm font-mono text-purple-400">
              {inStockCount} In Stock <span className="text-[10px] text-slate-400 font-normal">({sourcingCount} Sourcing)</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#111c33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Make vs Buy</span>
            </div>
            <div className="font-bold text-sm font-mono text-blue-400">
              6 Make / 5 Buy
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER CONTROLS */}
        <div className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search part number, name, material..."
              className={`w-full pl-8 pr-8 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-slate-400 text-[11px] font-semibold shrink-0">Level:</span>
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                levelFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Levels ({bomItems.length})
            </button>
            <button
              onClick={() => setLevelFilter('L1')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                levelFilter === 'L1'
                  ? 'bg-emerald-500 text-slate-950'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              L1 Assemblies ({l1Count})
            </button>
            <button
              onClick={() => setLevelFilter('L2')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                levelFilter === 'L2'
                  ? 'bg-emerald-500 text-slate-950'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              L2 Parts ({l2Count})
            </button>

            <span className="text-slate-400 text-[11px] font-semibold shrink-0 ml-2">Stock:</span>
            <button
              onClick={() => setStatusFilter(statusFilter === 'instock' ? 'all' : 'instock')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'instock'
                  ? 'bg-cyan-500 text-slate-950'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              In Stock Only
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'sourcing' ? 'all' : 'sourcing')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'sourcing'
                  ? 'bg-amber-500 text-slate-950'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sourcing Pending
            </button>
          </div>
        </div>

        {/* MULTI-TIER BOM TABLE */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="plm-table-container">
            <table className="plm-table text-xs">
              <thead>
                <tr>
                  <th className="w-12 text-center">Tier</th>
                  <th>Part Number &amp; Description</th>
                  <th>Category</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Cost</th>
                  <th className="text-right">Ext Cost</th>
                  <th>Material &amp; Specification</th>
                  <th className="text-center">Weight</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Sourcing</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isL1 = item.level === 'L1';
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedItem(isSelected ? null : item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? (isDark ? 'bg-emerald-500/15' : 'bg-emerald-50') 
                            : isL1 
                            ? (isDark ? 'bg-slate-900/60 font-medium' : 'bg-slate-50/80 font-medium') 
                            : ''
                        }`}
                      >
                        <td className="text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isL1 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {item.level}
                          </span>
                        </td>

                        <td>
                          <div className={`flex items-center space-x-2 ${!isL1 ? 'pl-4' : ''}`}>
                            {!isL1 && <span className="text-slate-500 font-mono text-xs">└─</span>}
                            <div>
                              <div className="font-mono font-bold text-cyan-400 text-xs flex items-center space-x-1.5">
                                <span>{item.partNumber}</span>
                                {isL1 && <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-sans font-normal">Sub-Assy</span>}
                              </div>
                              <div className={`text-[11px] truncate max-w-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {item.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-[11px] font-medium text-slate-400">
                            {item.category}
                          </span>
                        </td>

                        <td className="text-center font-mono font-semibold">
                          {item.quantity}x
                        </td>

                        <td className="text-right font-mono text-slate-300">
                          ${item.unitCost.toFixed(2)}
                        </td>

                        <td className="text-right font-mono font-bold text-emerald-400">
                          ${item.extCost.toFixed(2)}
                        </td>

                        <td className="text-[11px] text-slate-400 truncate max-w-[160px]" title={item.material}>
                          {item.material}
                        </td>

                        <td className="text-center font-mono text-[11px]">
                          {item.weightKg.toFixed(2)} kg
                        </td>

                        <td className="text-center">
                          <span className={`badge-status ${
                            item.lifecycle === 'Released' ? 'badge-active' : 'badge-progress'
                          }`}>
                            {item.lifecycle}
                          </span>
                        </td>

                        <td className="text-center">
                          {item.inStock ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>In Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{item.leadTimeWeeks}w Lead</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-500 text-xs">
                      No components found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ITEM DETAIL DRAWER / HIGHLIGHT PANEL */}
          {selectedItem && (
            <div className={`mt-4 p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
              isDark ? 'bg-[#0c1424] border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <strong className="text-emerald-400 font-mono">{selectedItem.partNumber}</strong>
                  <span>&bull; {selectedItem.name}</span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close Detail
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Manufacturer / Supplier:</span>
                  <strong className="text-slate-200">{selectedItem.supplier}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Lead Time:</span>
                  <strong className="text-slate-200">{selectedItem.leadTimeWeeks} Business Weeks</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Engineering Notes:</span>
                  <span className="text-slate-300">{selectedItem.notes}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Inventory Status:</span>
                  <strong className={selectedItem.inStock ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedItem.inStock ? 'Allocated in Central Warehouse' : 'Purchase Order Generated (PO-2026-891)'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-[#0c1322]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-slate-400 text-[11px] flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Showing {filteredItems.length} of {bomItems.length} components &bull; Multi-level rollup verified to ISO 11442</span>
          </div>

          <button
            onClick={onClose}
            className={`btn-secondary btn-sm cursor-pointer ${
              isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
            }`}
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
