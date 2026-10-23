import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Search, 
  Plus, 
  CheckCircle2, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  Clock,
  Cpu,
  FolderOpen
} from 'lucide-react';
import type { 
  PartItem, 
  BOMNode, 
  LifecycleStage, 
  QualityNCR, 
  DfmeaRow, 
  PfmeaRow, 
  EngineeringDocument, 
  Project, 
  ECR,
  AuditLog 
} from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { useTheme } from '../context/ThemeContext';
import { safeSetItem, sanitizeDocumentsForStorage, sanitizePartsForStorage } from '../utils/safeStorage';
import { 
  purgeStoredCadVaultFiles, 
  recordDeletedProductId, 
  isProductIdDeleted 
} from '../utils/cadVaultStorage';
import { partsApi, bomApi, documentsApi } from '../services/api';
import { NewProductForm } from './product/NewProductForm';
import { ProductDetailsView } from './product/ProductDetailsView';

interface ProductManagementProps {
  parts: PartItem[];
  setParts: React.Dispatch<React.SetStateAction<PartItem[]>>;
  bomTrees: Record<string, BOMNode>;
  setBomTrees: React.Dispatch<React.SetStateAction<Record<string, BOMNode>>>;
  currentUser: UserAccount;
  ncrs: QualityNCR[];
  setNcrs?: React.Dispatch<React.SetStateAction<QualityNCR[]>>;
  dfmeaRows: DfmeaRow[] | any[];
  setDfmeaRows: React.Dispatch<React.SetStateAction<DfmeaRow[]>>;
  pfmeaRows: PfmeaRow[] | any[];
  setPfmeaRows: React.Dispatch<React.SetStateAction<PfmeaRow[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  documents: EngineeringDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EngineeringDocument[]>>;
  ecrs?: ECR[];
  setEcrs?: React.Dispatch<React.SetStateAction<ECR[]>>;
  inventory?: any[];
  setInventory?: React.Dispatch<React.SetStateAction<any[]>>;
  logAction: (action: string, category: any, targetId: string, details: string) => void;
  initialFilterStage?: string;
  activeProjectId?: string;
  onSelectPart: (partId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  parts,
  setParts,
  bomTrees,
  setBomTrees,
  currentUser,
  ncrs,
  setNcrs,
  dfmeaRows,
  setDfmeaRows,
  pfmeaRows,
  setPfmeaRows,
  projects,
  setProjects,
  documents,
  setDocuments,
  ecrs = [],
  setEcrs,
  inventory = [],
  setInventory,
  logAction,
  initialFilterStage,
  activeProjectId,
  onSelectPart,
  onNavigateTab
}) => {
  const { isDark } = useTheme();

  // Admin access validation
  const isAdmin = Boolean(currentUser && (
    currentUser.systemRole === 'ADMIN' || 
    currentUser.roleId === 'admin' || 
    currentUser.personaKey === 'admin' ||
    (currentUser.role && currentUser.role.toLowerCase().includes('admin'))
  ));

  // Navigation & Sub-View State: 'list' | 'create' | 'details'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // List View Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>(initialFilterStage || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Admin deletion modal state
  const [productToDelete, setProductToDelete] = useState<PartItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync external filter requests
  useEffect(() => {
    if (initialFilterStage) {
      setFilterStage(initialFilterStage);
    }
  }, [initialFilterStage]);

  // Selected Product for Details View
  const selectedProduct = parts.find(p => p.id === selectedProductId) || parts[0];

  // Helper for filter matching
  const isPartMatchingFilter = (part: PartItem, filter: string): boolean => {
    if (filter === 'all' || !filter) return true;
    if (filter === 'draft') {
      return (
        part.lifecycleStage === 'concept' || 
        (part.productStatus || '').toLowerCase().includes('draft') ||
        (part.currentRev || '').toLowerCase().includes('draft')
      );
    }
    if (filter === 'under_review') {
      return (
        part.lifecycleStage === 'design' || 
        part.lifecycleStage === 'prototype' || 
        (part.productStatus || '').toLowerCase().includes('review')
      );
    }
    if (filter === 'released') {
      return (
        part.lifecycleStage === 'production' || 
        part.completionPercent === 100 || 
        (part.productStatus || '').toLowerCase().includes('released') || 
        (part.productStatus || '').toLowerCase().includes('complete')
      );
    }
    return true;
  };

  // Filtered Parts calculation
  const filteredParts = parts.filter(p => {
    const matchesStage = isPartMatchingFilter(p, filterStage);
    if (!matchesStage) return false;

    if (categoryFilter !== 'all' && p.category !== categoryFilter) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.partNumber.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.material && p.material.toLowerCase().includes(q)) ||
      (p.productFamily && p.productFamily.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.projectName && p.projectName.toLowerCase().includes(q))
    );
  });

  // Unique categories for filtering
  const availableCategories = Array.from(new Set(parts.map(p => p.category).filter(Boolean)));

  // ADMIN-ONLY: Permanent system-wide Product Deletion
  const handleConfirmDeleteProduct = async (partToDelete: PartItem) => {
    if (!isAdmin) {
      alert('Access Denied: Only users with the ADMIN role are permitted to delete Product Master records.');
      return;
    }
    if (!partToDelete) return;

    setIsDeleting(true);
    const targetId = partToDelete.id;
    const targetPn = partToDelete.partNumber;
    const targetName = partToDelete.name;

    try {
      // 1. Permanently delete from MongoDB Atlas via backend API
      try {
        await partsApi.delete(targetId);
      } catch (err: any) {
        console.warn('Backend partsApi delete (ID) failed:', err.message);
      }

      if (targetPn && targetPn !== targetId) {
        try {
          await partsApi.delete(targetPn);
        } catch {
          // Ignore
        }
      }

      try {
        await bomApi.delete(targetId);
      } catch {
        // Ignore
      }

      // 2. Permanently delete from Product Master local state and storage
      setParts(prev => {
        const next = prev.filter(p => p.id !== targetId && p.partNumber !== targetPn);
        safeSetItem('apex_plm_parts', JSON.stringify(sanitizePartsForStorage(next)));
        return next;
      });

      // 3. Permanently purge CAD Files and associated Vault metadata
      purgeStoredCadVaultFiles(targetId);
      purgeStoredCadVaultFiles(targetPn);

      // 4. Permanently purge BOM / EBOM trees
      setBomTrees(prev => {
        const next = { ...prev };
        delete next[targetId];
        delete next[targetPn];
        Object.keys(next).forEach(treeKey => {
          if (next[treeKey]?.children) {
            next[treeKey] = {
              ...next[treeKey],
              children: next[treeKey].children.filter(
                c => c.partId !== targetId && c.partNumber !== targetPn && c.id !== targetId
              )
            };
          }
        });
        safeSetItem('apex_plm_bom_trees', JSON.stringify(next));
        return next;
      });

      // 5. Permanently purge Engineering Documents
      setDocuments(prev => {
        const next = prev.filter(
          d => d.linkedPartId !== targetId && 
               d.linkedPartId !== targetPn && 
               !d.docNumber.includes(targetPn) && 
               !d.docNumber.includes(targetId)
        );
        safeSetItem('apex_plm_documents', JSON.stringify(sanitizeDocumentsForStorage(next)));
        return next;
      });

      // 6. Record purged ID to prevent resurrection
      recordDeletedProductId([targetId, targetPn]);

      logAction(
        'Permanently Purged Product Master',
        'SYSTEM',
        targetPn,
        `Admin permanently purged product "${targetName}" (${targetPn}, ID: ${targetId}) across all PLM modules and database.`
      );

      window.dispatchEvent(new CustomEvent('plm:part-sync'));
      setProductToDelete(null);
      if (selectedProductId === targetId) {
        setViewMode('list');
      }
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Details View
  const handleOpenDetails = (part: PartItem) => {
    setSelectedProductId(part.id);
    if (onSelectPart) {
      onSelectPart(part.id);
    }
    setViewMode('details');
  };

  // Open Edit Product (switches to create form pre-filled or details)
  const handleOpenEdit = (part: PartItem) => {
    handleOpenDetails(part);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. CREATE NEW PRODUCT WORKFLOW (6-SECTION FORM) */}
      {viewMode === 'create' && (
        <NewProductForm
          onCancel={() => setViewMode('list')}
          onSuccess={(newProduct, newDocs, newBOM) => {
            setParts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)]);
            if (newDocs && newDocs.length > 0) {
              setDocuments(prev => [...newDocs, ...prev.filter(d => !newDocs.some(nd => nd.id === d.id))]);
            }
            if (newBOM) {
              setBomTrees(prev => ({
                ...prev,
                [newProduct.id]: newBOM,
                [newProduct.partNumber]: newBOM
              }));
            }
            setSelectedProductId(newProduct.id);
            if (onSelectPart) onSelectPart(newProduct.id);
            setViewMode('details');
          }}
          existingParts={parts}
          projects={projects}
          currentUser={currentUser}
          logAction={logAction}
        />
      )}

      {/* 2. PRODUCT DETAILS VIEW (11 TABS) */}
      {viewMode === 'details' && selectedProduct && (
        <ProductDetailsView
          product={selectedProduct}
          onBack={() => setViewMode('list')}
          onEditProduct={handleOpenEdit}
          onDeleteProduct={isAdmin ? setProductToDelete : undefined}
          currentUser={currentUser}
          allProducts={parts}
          setAllProducts={setParts}
          documents={documents}
          setDocuments={setDocuments}
          bomTrees={bomTrees}
          setBomTrees={setBomTrees}
          projects={projects}
          ecrs={ecrs}
          ncrs={ncrs}
          dfmeaRows={dfmeaRows}
          pfmeaRows={pfmeaRows}
          auditLogs={[]}
          logAction={logAction}
          onSelectPart={onSelectPart}
          onNavigateTab={onNavigateTab}
          isAdmin={isAdmin}
        />
      )}

      {/* 3. PRODUCT MASTER DIRECTORY LANDING */}
      {viewMode === 'list' && (
        <div className="space-y-6 max-w-5xl mx-auto py-4">
          {/* Main Landing Banner */}
          <div className={`rounded-3xl p-8 border shadow-lg text-center space-y-6 transition-colors ${
            isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-3xl text-cyan-400 border shadow-inner ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
              }`}>
                <Box className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  PRODUCT MASTER
                </h1>
                <p className={`text-xs max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Centralized Product Master &amp; Revision Control. Create and manage mechanical product records, 
                  revision history, 3D CAD models, engineering documents, and multi-level BOM structures.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setViewMode('create')}
                className="btn-primary px-6 py-2.5 text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/25 cursor-pointer font-bold tracking-wide"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE NEW PRODUCT</span>
              </button>
            </div>
          </div>

          {/* Metric Count Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'all', label: 'TOTAL PRODUCTS', value: parts.length, color: 'text-cyan-400', activeRing: 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/40 shadow-cyan-500/10' },
              { id: 'draft', label: 'DRAFT', value: parts.filter(p => isPartMatchingFilter(p, 'draft')).length, color: 'text-amber-400', activeRing: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-amber-500/10' },
              { id: 'under_review', label: 'UNDER REVIEW', value: parts.filter(p => isPartMatchingFilter(p, 'under_review')).length, color: 'text-purple-400', activeRing: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/40 shadow-purple-500/10' },
              { id: 'released', label: 'RELEASED', value: parts.filter(p => isPartMatchingFilter(p, 'released')).length, color: 'text-emerald-400', activeRing: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-emerald-500/10' }
            ].map(stat => (
              <button
                key={stat.id}
                type="button"
                onClick={() => setFilterStage(stat.id)}
                className={`rounded-2xl p-4 border text-center space-y-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
                  filterStage === stat.id
                    ? `${stat.activeRing} shadow-lg font-bold`
                    : isDark ? 'bg-[#111B2E] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.label}
                </span>
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {filterStage === stat.id ? (
                    <span className="text-cyan-400 font-bold">&bull; ACTIVE FILTER</span>
                  ) : (
                    <span>Click to show {stat.label.toLowerCase()}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Directory Filter Bar & Listing */}
          <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
            isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-700/30">
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Product Master Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SHOWING {filteredParts.length} OF {parts.length}
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {availableCategories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#0D1628] border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Part Number, Name, Family..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-[#0D1628] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Product Directory Cards */}
            {filteredParts.length > 0 ? (
              <div className="space-y-3">
                {filteredParts.map(part => {
                  const isReleased = part.lifecycleStage === 'production' || (part.productStatus || '').toLowerCase().includes('released');
                  const isUnderReview = part.lifecycleStage === 'design' || part.lifecycleStage === 'prototype' || (part.productStatus || '').toLowerCase().includes('review');

                  return (
                    <div
                      key={part.id}
                      onClick={() => handleOpenDetails(part)}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group ${
                        isDark 
                          ? 'bg-[#0D1628]/70 border-slate-700/50 hover:bg-[#15233c] hover:border-cyan-500/50' 
                          : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-cyan-500 hover:shadow-md'
                      }`}
                    >
                      {/* Left: Product Icon & Primary Metadata */}
                      <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                          isReleased 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : isUnderReview 
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          <Box className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono font-bold text-cyan-400 text-xs">
                              {part.partNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-700/30 px-1.5 py-0.5 rounded">
                              ID: {part.id}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Rev {part.currentRev}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {part.category} &bull; {part.type}
                            </span>
                          </div>

                          <h3 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-800 group-hover:text-cyan-700'} transition-colors`}>
                            {part.name}
                          </h3>

                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {part.description || `${part.material || 'Standard Alloy'} &bull; Project: ${part.projectName || part.projectId || 'Unassigned'}`}
                          </p>
                        </div>
                      </div>

                      {/* Right: Lifecycle Badge & Action Buttons */}
                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                          isReleased
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : isUnderReview
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        }`}>
                          {isReleased ? 'RELEASED' : isUnderReview ? 'UNDER REVIEW' : 'DRAFT'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(part);
                          }}
                          className="btn-primary btn-sm text-[11px] flex items-center space-x-1 cursor-pointer py-1 px-3 shadow-sm shadow-cyan-500/20"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(part);
                          }}
                          className="btn-secondary btn-sm text-[11px] flex items-center space-x-1 cursor-pointer py-1 px-2.5"
                          title="Edit Product"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(part);
                            }}
                            className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 cursor-pointer transition-all"
                            title="Permanently Delete (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : parts.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-xl space-y-4">
                <Box className="w-12 h-12 mx-auto text-slate-500" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-200">No products yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No product records have been created. Create your first product master to track revisions, CAD models, documents, and BOM.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode('create')}
                    className="btn-primary px-5 py-2 text-xs inline-flex items-center space-x-2 cursor-pointer font-bold shadow-lg shadow-cyan-500/25"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Product</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed rounded-xl space-y-3">
                <Box className="w-10 h-10 mx-auto text-slate-500" />
                <h4 className="text-xs font-bold text-slate-300">No Product Records Match Filter</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No products matched the filter &quot;<strong className="text-cyan-400 uppercase font-mono">{filterStage.replace('_', ' ')}</strong>&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStage('all');
                    setSearchTerm('');
                    setCategoryFilter('all');
                  }}
                  className="btn-secondary btn-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DELETE CONFIRMATION MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#0D1628] border-rose-500/50 text-white' : 'bg-white border-rose-300 text-slate-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-400">Permanently Delete Product?</h3>
                <p className="text-xs text-slate-400">Action is irreversible (Admin Only).</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>Product: <strong className="text-white">{productToDelete.name}</strong></div>
              <div>Number: <span className="font-mono text-cyan-400">{productToDelete.partNumber}</span></div>
              <div>Permanent ID: <span className="font-mono text-purple-400">{productToDelete.id}</span></div>
              <p className="text-[11px] text-rose-300/90 pt-2 border-t border-slate-700/40">
                This will cascade delete all linked CAD models, drawings, revision history, and BOM structures from the database.
              </p>
            </div>

            <div className="flex justify-end space-x-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="btn-secondary btn-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteProduct(productToDelete)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
