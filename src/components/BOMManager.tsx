import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  GitCommit, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  DollarSign, 
  Scale, 
  Download, 
  Search, 
  Wrench, 
  ArrowRightLeft, 
  Leaf, 
  ShieldAlert, 
  FileSpreadsheet, 
  FileText,
  Maximize2, 
  Minimize2, 
  AlertCircle,
  RefreshCw,
  Box,
  MoreVertical,
  Eye,
  History,
  CheckCircle2,
  Loader2,
  Package,
  Calendar,
  User,
  ShieldCheck,
  Tag
} from 'lucide-react';
import type { BOMNode, PartItem } from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { generateBomExcel, generateBomPdf, flattenBomTree } from '../utils/bomExportEngine';
import { EngineeringDrawingModal } from './EngineeringDrawingModal';
import { useTheme } from '../context/ThemeContext';

interface BOMManagerProps {
  rootNode?: BOMNode | null;
  partsMap?: Record<string, PartItem>;
  parts?: PartItem[];
  selectedPartId?: string;
  onSelectPart?: (partId: string) => void;
  isLoading?: boolean;
  currentUser?: UserAccount | null;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

// Error Boundary Fallback for BOM Studio
class BOMErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BOM Studio Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">BOM Studio Rendering Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while parsing the Bill of Materials structure.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload BOM View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const BOMManagerInternal: React.FC<BOMManagerProps> = ({ 
  rootNode: initialRootNode, 
  partsMap = {}, 
  parts = [],
  selectedPartId,
  onSelectPart = () => {},
  isLoading = false,
  currentUser,
  logAction
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'ebom' | 'mbom' | 'sbom' | 'compare'>('ebom');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRevision, setSelectedRevision] = useState<string>('');
  
  // Action Menu State
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);

  // Export Loading States
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; subText?: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Drawing Modal State
  const [drawingModalPart, setDrawingModalPart] = useState<PartItem | null>(null);
  const [drawingModalBom, setDrawingModalBom] = useState<BOMNode | null>(null);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState<boolean>(false);

  // Revision History Modal State
  const [historyModalPart, setHistoryModalPart] = useState<PartItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);


  // Active root node for current view
  const rootNode = initialRootNode || (selectedPartId && partsMap[selectedPartId] ? null : null);
  const activePart = rootNode ? (partsMap[rootNode.partId || ''] || parts.find(p => p.id === rootNode.partId || p.partNumber === rootNode.partNumber) || parts[0] || null) : (parts[0] || null);

  // Initialize revision & expanded nodes
  useEffect(() => {
    if (rootNode?.id) {
      setExpandedNodes((prev) => ({ ...prev, [rootNode.id]: true }));
      setSelectedRevision(rootNode.revision || activePart?.currentRev || 'Rev 00');
    }
  }, [rootNode?.id, activePart?.currentRev]);

  // Toast Helper
  const showToast = (text: string, subText?: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, subText, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close open dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuNodeId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    if (!rootNode) return;
    const allIds: Record<string, boolean> = {};
    const traverse = (node: BOMNode) => {
      allIds[node.id] = true;
      node.children?.forEach(traverse);
    };
    traverse(rootNode);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    if (!rootNode) return;
    setExpandedNodes({ [rootNode.id]: true });
  };

  // Safe Rollup Calculation
  const rollups = useMemo(() => {
    if (!rootNode) return { totalCost: 0, totalWeight: 0, totalCarbon: 0, lineCount: 0 };

    let cost = 0;
    let weight = 0;
    let carbon = 0;
    let count = 0;

    const traverse = (curr: BOMNode) => {
      if (!curr) return;
      if (viewMode === 'ebom' && (curr.isMbomOnly || curr.isSbomOnly)) return;
      if (viewMode === 'mbom' && curr.isSbomOnly) return;

      const qty = curr.quantity ?? 1;
      count += 1;
      cost += (curr.unitCost ?? 0) * qty;
      weight += (curr.weightKg ?? 0) * qty;
      carbon += (curr.carbonKgCO2 ?? 0) * qty;

      if (curr.children && curr.children.length > 0) {
        curr.children.forEach(traverse);
      }
    };

    traverse(rootNode);
    return { totalCost: cost, totalWeight: weight, totalCarbon: carbon, lineCount: count };
  }, [rootNode, viewMode]);

  // Download Excel BOM Handler (for root or specific child node)
  const handleDownloadExcel = async (targetNode: BOMNode = rootNode!) => {
    if (!targetNode) return;
    try {
      setIsExportingExcel(true);
      showToast('Generating Excel BOM...', `Building procurement workbook for ${targetNode.partNumber}`, 'info');

      const targetPart = partsMap[targetNode.partId || ''] || activePart || undefined;
      const { blob, filename } = await generateBomExcel({
        rootNode: { ...targetNode, revision: selectedRevision || targetNode.revision },
        part: targetPart,
        viewMode,
        authorName: currentUser?.name || 'Engineering Lead'
      });

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      showToast('Excel BOM downloaded successfully.', filename, 'success');

      if (logAction) {
        logAction(
          'Exported Excel BOM',
          'BOM',
          targetNode.partNumber || targetNode.id,
          `Downloaded Excel BOM: ${filename}`
        );
      }
    } catch (err) {
      console.error('Error generating Excel BOM:', err);
      showToast('Export Failed', 'Unable to generate Excel BOM workbook.', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Download PDF BOM Handler (for root or specific child node)
  const handleDownloadPdf = async (targetNode: BOMNode = rootNode!) => {
    if (!targetNode) return;
    try {
      setIsExportingPdf(true);
      showToast('Generating PDF BOM...', `Rendering engineering document for ${targetNode.partNumber}`, 'info');

      const targetPart = partsMap[targetNode.partId || ''] || activePart || undefined;
      const { blob, filename } = await generateBomPdf({
        rootNode: { ...targetNode, revision: selectedRevision || targetNode.revision },
        part: targetPart,
        viewMode,
        authorName: currentUser?.name || 'Engineering Lead'
      });

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      showToast('PDF BOM downloaded successfully.', filename, 'success');

      if (logAction) {
        logAction(
          'Exported PDF BOM',
          'BOM',
          targetNode.partNumber || targetNode.id,
          `Downloaded PDF BOM: ${filename}`
        );
      }
    } catch (err) {
      console.error('Error generating PDF BOM:', err);
      showToast('Export Failed', 'Unable to generate PDF BOM document.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Open Drawing Modal Handler
  const handleOpenDrawing = (node: BOMNode) => {
    const p = partsMap[node.partId || ''] || (activePart ? { ...activePart, partNumber: node.partNumber, name: node.name } : null);
    if (p) {
      setDrawingModalPart(p);
      setDrawingModalBom(node);
      setIsDrawingModalOpen(true);
    }
  };

  // Open Revision History Modal Handler
  const handleOpenHistory = (node: BOMNode) => {
    const p = partsMap[node.partId || ''] || (activePart ? { ...activePart, partNumber: node.partNumber, name: node.name } : null);
    if (p) {
      setHistoryModalPart(p);
      setIsHistoryModalOpen(true);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800/60 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Empty State if BOM Data is Unavailable
  if (!rootNode) {
    return (
      <div className={`border rounded-3xl p-12 shadow-2xl text-center space-y-4 font-sans transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 inline-block">
          <Box className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>No BOM items available</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No Bill of Materials hierarchy was found. Create a product or add an assembly item in Product Management to build multi-level EBOM and MBOM trees.
          </p>
        </div>
      </div>
    );
  }

  // Node Matcher for Search Filter
  const matchesSearch = (node: BOMNode): boolean => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const selfMatch = 
      node.partNumber?.toLowerCase().includes(term) ||
      node.name?.toLowerCase().includes(term) ||
      node.material?.toLowerCase().includes(term) ||
      node.refDes?.toLowerCase().includes(term);

    const childMatch = node.children?.some(matchesSearch);
    return Boolean(selfMatch || childMatch);
  };

  // Render BOM Row with Action Menu
  const renderBOMRow = (node: BOMNode, depth: number = 0): React.ReactNode => {
    if (!matchesSearch(node)) return null;

    const isExpanded = Boolean(expandedNodes[node.id]);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isMbomItem = Boolean(node.isMbomOnly);
    const isSbomItem = Boolean(node.isSbomOnly);

    if (viewMode === 'ebom' && (isMbomItem || isSbomItem)) return null;
    if (viewMode === 'mbom' && isSbomItem) return null;

    const lineCost = ((node.unitCost ?? 0) * (node.quantity ?? 1)).toFixed(2);
    const isMenuOpen = activeMenuNodeId === node.id;

    return (
      <React.Fragment key={node.id}>
        <tr className={`transition-colors ${
          viewMode === 'compare' && isMbomItem
            ? isDark ? 'bg-emerald-950/30 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
            : isSbomItem 
            ? isDark ? 'bg-purple-950/20 text-purple-300' : 'bg-purple-50 text-purple-800'
            : isMbomItem 
            ? isDark ? 'bg-emerald-950/20 text-emerald-300' : 'bg-emerald-50/60 text-emerald-800'
            : ''
        }`}>
          {/* 1. Part Number & Hierarchy */}
          <td>
            <div className="flex items-center" style={{ paddingLeft: `${depth * 18}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleNode(node.id)}
                  className={`mr-2 p-0.5 cursor-pointer hover:text-cyan-500 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <span className="w-5 inline-block" />
              )}

              <button
                onClick={() => node.partId && onSelectPart(node.partId)}
                className="font-bold font-mono text-cyan-500 hover:underline flex items-center space-x-1.5 cursor-pointer text-left"
              >
                <span>{node.partNumber}</span>
              </button>

              {isMbomItem && (
                <span className="badge-status badge-active text-[10px] ml-2">
                  <Wrench className="w-3 h-3 mr-1 inline" />
                  MBOM
                </span>
              )}

              {isSbomItem && (
                <span className="badge-status badge-draft text-[10px] ml-2">
                  <ShieldAlert className="w-3 h-3 mr-1 inline" />
                  SBOM
                </span>
              )}
            </div>
          </td>

          {/* 2. Description */}
          <td>
            <div className="font-medium">{node.name}</div>
            {isMbomItem && node.mbomInstruction && (
              <div className="text-[11px] text-emerald-500 mt-0.5">
                Instruction: {node.mbomInstruction}
              </div>
            )}
            {isSbomItem && node.sbomMaintenanceInterval && (
              <div className="text-[11px] text-purple-500 mt-0.5">
                Interval: {node.sbomMaintenanceInterval}
              </div>
            )}
          </td>

          {/* 3. Revision */}
          <td>
            <span className="font-mono text-amber-500 font-semibold">
              {node.revision || 'Rev A.0'}
            </span>
          </td>

          {/* 4. Quantity */}
          <td className="text-center font-semibold">
            {node.quantity} <span className={`text-[11px] font-normal ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{node.unit || 'pcs'}</span>
          </td>

          {/* 5. Material */}
          <td className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>
            {node.material || 'Standard Alloy'}
          </td>

          {/* 6. Unit Cost */}
          <td className="text-right">
            ${(node.unitCost ?? 0).toFixed(2)}
          </td>

          {/* 7. Total Line Cost */}
          <td className="text-right font-mono font-bold text-cyan-500">
            ${lineCost}
          </td>

          {/* 8. Carbon Footprint */}
          <td className="text-right text-emerald-500 font-semibold">
            {((node.carbonKgCO2 ?? 0) * (node.quantity ?? 1)).toFixed(1)} kg
          </td>

          {/* 9. Action Menu Column (⋮) */}
          <td className="text-center relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuNodeId(isMenuOpen ? null : node.id);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#1E293B] text-[#94A3B8]' : 'hover:bg-slate-100 text-[#64748B]'
              }`}
              title="Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Action Dropdown Menu */}
            {isMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`absolute right-2 top-10 z-30 w-52 rounded-xl shadow-xl p-1.5 text-left text-xs space-y-1 border ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div className={`px-3 py-1.5 border-b text-[10px] truncate ${
                  isDark ? 'border-[#243149] text-[#64748B]' : 'border-[#E2E8F0] text-[#94A3B8]'
                }`}>
                  {node.partNumber} ({node.revision || 'Rev A.0'})
                </div>

                <button
                  onClick={() => {
                    if (node.partId) onSelectPart(node.partId);
                    setActiveMenuNodeId(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-500" />
                  <span>View Item Master</span>
                </button>

                <button
                  onClick={() => {
                    handleDownloadExcel(node);
                    setActiveMenuNodeId(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Download Excel BOM</span>
                </button>

                <button
                  onClick={() => {
                    handleDownloadPdf(node);
                    setActiveMenuNodeId(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Download PDF BOM</span>
                </button>

                <button
                  onClick={() => {
                    handleOpenDrawing(node);
                    setActiveMenuNodeId(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>View 2D Blueprint</span>
                </button>

                <button
                  onClick={() => {
                    handleOpenHistory(node);
                    setActiveMenuNodeId(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center space-x-2 text-left transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#151F32] text-[#F1F5F9]' : 'hover:bg-slate-50 text-[#172033]'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-purple-500" />
                  <span>Revision History</span>
                </button>
              </div>
            )}
          </td>
        </tr>

        {hasChildren && isExpanded && node.children?.map((child) => renderBOMRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl text-xs font-semibold shadow-xl flex items-start space-x-3 border transition-all animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-500 text-white border-rose-600'
            : toastMessage.type === 'info'
            ? 'bg-amber-500 text-slate-950 border-amber-600'
            : 'bg-cyan-500 text-slate-950 border-cyan-600'
        }`}>
          {toastMessage.type === 'info' ? (
            <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold">{toastMessage.text}</div>
            {toastMessage.subText && <div className="text-[11px] opacity-90">{toastMessage.subText}</div>}
          </div>
        </div>
      )}

      {/* Top Header & Mode Toggle */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        
        {/* Left Product Title & Revision Information */}
        <div className="flex items-center space-x-4">
          <div className={`p-3.5 rounded-2xl text-cyan-500 border ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <GitCommit className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                {rootNode.name}
              </h2>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-bold border ${
                isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                {rootNode.partNumber}
              </span>
              
              {/* Revision Tag */}
              <div className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md border text-xs font-mono ${
                isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <Tag className="w-3 h-3 text-amber-500" />
                <span className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>Rev:</span>
                <span className="text-amber-500 font-bold">{selectedRevision || rootNode.revision || 'Rev B.1'}</span>
              </div>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Multi-level EBOM, Manufacturing MBOM routings, Service SBOM kits, and live carbon metrics.
            </p>
          </div>
        </div>

        {/* Right Actions: Mode Tabs + Download Buttons */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          
          {/* Mode Switcher Tabs */}
          <div className={`flex items-center p-1 rounded-xl border space-x-1 text-xs font-medium ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setViewMode('ebom')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'ebom'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              EBOM
            </button>
            <button
              onClick={() => setViewMode('mbom')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'mbom'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              MBOM
            </button>
            <button
              onClick={() => setViewMode('sbom')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'sbom'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              SBOM
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'compare'
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Diff
            </button>
          </div>

          {/* Download Buttons */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => handleDownloadExcel(rootNode)}
              disabled={isExportingExcel}
              className="btn-secondary btn-sm"
              title="Download Excel BOM"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Excel...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Excel BOM</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownloadPdf(rootNode)}
              disabled={isExportingPdf}
              className="btn-secondary btn-sm"
              title="Download PDF BOM"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>PDF BOM</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Metric Summary Rollup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-[14px] border transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Roll-Up Cost</span>
            <DollarSign className="w-4 h-4 text-cyan-500" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            ${rollups.totalCost.toFixed(2)}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Standard Component Cost</div>
        </div>

        <div className={`p-4 rounded-[14px] border transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Assembly Weight</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {rollups.totalWeight.toFixed(3)} kg
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>CAD Calculated Mass</div>
        </div>

        <div className={`p-4 rounded-[14px] border transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Carbon Footprint</span>
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">
            {rollups.totalCarbon.toFixed(1)} kg CO₂e
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Embedded Embodied Carbon</div>
        </div>

        <div className={`p-4 rounded-[14px] border transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>BOM Line Items</span>
            <Package className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-cyan-500">
            {rollups.lineCount} Items
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{viewMode.toUpperCase()} Active View</div>
        </div>
      </div>

      {/* Toolbar: Search & Tree Expand Controls */}
      <div className={`rounded-xl p-3 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
          <input
            type="text"
            placeholder="Search Part Number, Name, Material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="plm-input text-xs pl-9 pr-3 py-1.5 w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="btn-secondary btn-sm"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="btn-secondary btn-sm"
          >
            <Minimize2 className="w-3.5 h-3.5 text-secondary" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* BOM Hierarchy Table */}
      <div className="plm-table-container">
        <table className="plm-table text-xs">
          <thead>
            <tr>
              <th>Part Number / Hierarchy</th>
              <th>Description</th>
              <th>Rev</th>
              <th className="text-center">Qty</th>
              <th>Material</th>
              <th className="text-right">Unit Rate</th>
              <th className="text-right">Total Cost</th>
              <th className="text-right">Carbon</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {renderBOMRow(rootNode, 0)}
          </tbody>
        </table>
      </div>

      {/* 2D Engineering Drawing Preview Modal */}
      {drawingModalPart && (
        <EngineeringDrawingModal
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
          part={drawingModalPart}
          bomTree={drawingModalBom || rootNode}
          logAction={logAction}
        />
      )}

      {/* Revision History Modal */}
      {isHistoryModalOpen && historyModalPart && (
        <div className="plm-modal-backdrop">
          <div className="plm-modal-card max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-2">
                <History className="w-4.5 h-4.5 text-purple-500" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                  Revision History: {historyModalPart.partNumber}
                </h3>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="text-secondary hover:text-primary cursor-pointer text-base leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(historyModalPart.revisionHistory && historyModalPart.revisionHistory.length > 0 ? historyModalPart.revisionHistory.map(r => ({
                revId: r.revision || 'Rev 00',
                date: r.releaseDate || new Date().toISOString().substring(0, 10),
                author: r.author || historyModalPart.createdBy || 'Lead Engineer',
                changeSummary: r.changeDescription || 'Engineering Revision',
                status: r.status || 'Released'
              })) : [
                { revId: historyModalPart.currentRev || 'Rev 00', date: new Date().toISOString().substring(0, 10), author: historyModalPart.createdBy || 'Lead Engineer', changeSummary: 'Initial Product Release', status: 'Released' }
              ]).map((rev, idx) => (
                <div key={idx} className={`p-3 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-500">{rev.revId}</span>
                    <span className="badge-status badge-active text-[10px]">
                      {rev.status}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>{rev.changeSummary}</div>
                  <div className={`text-[10px] flex items-center justify-between pt-1 border-t border-slate-700/20 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                    <span>By: {rev.author}</span>
                    <span>{rev.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t pt-3 border-slate-700/30">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const BOMManager: React.FC<BOMManagerProps> = (props) => (
  <BOMErrorBoundary>
    <BOMManagerInternal {...props} />
  </BOMErrorBoundary>
);

