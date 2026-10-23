import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Lock, 
  Unlock, 
  Download, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Ruler, 
  FileCheck,
  Eye,
  GitCommit,
  Printer,
  Sliders,
  Loader2,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Tag
} from 'lucide-react';
import type { PartItem, PermissionMatrix, AuditLog, StoredCadVaultFile } from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { 
  downloadCadVaultFile, 
  downloadActualStoredFile, 
  getStoredCadVaultFiles, 
  getStoredFileForPart, 
  type FileDownloadType 
} from '../utils/cadVaultStorage';
import { EngineeringDrawingModal } from './EngineeringDrawingModal';
import { CadPreviewModal } from './CadPreviewModal';
import { CadBomInspectorModal } from './CadBomInspectorModal';
import { CadRevisionHistoryModal } from './CadRevisionHistoryModal';
import { CadCompareDiffModal } from './CadCompareDiffModal';
import { useTheme } from '../context/ThemeContext';

interface CADViewer3DProps {
  part?: PartItem;
  onCheckoutToggle?: (partId: string) => void;
  userRole?: string;
  currentUser?: UserAccount | null;
  permissionMatrix?: PermissionMatrix;
  logAction?: (action: string, category: AuditLog['category'], targetId: string, details: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface AssemblyTreeNode {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  revision: string;
  quantity: number;
  lifecycle: string;
  children?: AssemblyTreeNode[];
}

export const CADViewer3DInternal: React.FC<CADViewer3DProps> = ({ 
  part: rawPart, 
  onCheckoutToggle, 
  userRole,
  currentUser,
  permissionMatrix,
  logAction,
  onNavigateTab
}) => {
  const part = rawPart;
  const { isDark } = useTheme();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root': true,
    'frame': true,
    'drivetrain': true,
    'wheel': false,
    'brake': false
  });

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Selected Revision State
  const [selectedRev, setSelectedRev] = useState<string>(part?.currentRev || 'Rev 01');

  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareRevA, setCompareRevA] = useState<string>(part?.currentRev || 'Rev 01');
  const [compareRevB, setCompareRevB] = useState<string>(part?.currentRev || 'Rev 01');

  // Genuine revision history from active part only
  const partRevisions = useMemo(() => {
    if (part?.revisionHistory && part.revisionHistory.length > 0) {
      return part.revisionHistory;
    }
    if (part) {
      return [
        {
          revId: part.currentRev || 'Rev 01',
          date: new Date().toISOString().split('T')[0],
          author: currentUser?.name || 'Lead Engineer',
          changeSummary: 'Initial Product Release',
          status: 'Released'
        }
      ];
    }
    return [];
  }, [part?.revisionHistory, part?.currentRev, currentUser?.name]);

  if (!part) {
    return (
      <div className={`rounded-2xl p-12 text-center border shadow-sm space-y-4 font-sans ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 inline-block">
          <Box className="w-10 h-10" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
          No CAD Model Loaded
        </h2>
        <p className={`text-xs max-w-md mx-auto font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No 3D CAD or assembly geometry is currently loaded. Create a product or upload STEP/CAD files in Product Management to view interactive 3D geometry and metadata.
        </p>
      </div>
    );
  }

  // Sync selectedRev when part changes
  React.useEffect(() => {
    if (part) {
      setSelectedRev(part.currentRev || 'A.1');
    }
  }, [part?.id, part?.currentRev]);

  // Button Statuses: 'idle' | 'downloading' | 'success' | 'error' | 'unavailable'
  const [cadState, setCadState] = useState<'idle' | 'downloading' | 'success' | 'error' | 'unavailable'>('idle');
  const [stepState, setStepState] = useState<'idle' | 'downloading' | 'success' | 'error' | 'unavailable'>('idle');
  const [pdfState, setPdfState] = useState<'idle' | 'downloading' | 'success' | 'error' | 'unavailable'>('idle');
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState<boolean>(false);
  const [isCadPreviewOpen, setIsCadPreviewOpen] = useState<boolean>(false);

  // Stored Files linked to this part/project
  const storedFiles: StoredCadVaultFile[] = part ? [
    ...getStoredCadVaultFiles(part.id),
    ...getStoredCadVaultFiles(part.partNumber),
    ...(part.cadMetadata?.attachedFiles || [])
  ].filter((f, idx, arr) => arr.findIndex(x => x.id === f.id || (x.fileName === f.fileName && x.dataUrl === f.dataUrl)) === idx) : [];

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  if (!part) {
    return (
      <div className={`rounded-[18px] p-12 border shadow-sm text-center space-y-4 font-sans ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 inline-block">
          <Box className="w-10 h-10" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>No CAD Model Loaded</h2>
        <p className={`text-xs max-w-md mx-auto font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          No 3D mechanical component is currently active in the CAD vault. Create a product in Product Master or import a STEP CAD file to begin 3D visualization.
        </p>
      </div>
    );
  }

  // Download Trigger Handler
  const handleDownload = async (fileType: FileDownloadType) => {
    const setStateMap = {
      cad: setCadState,
      step: setStepState,
      pdf: setPdfState
    };
    const setState = setStateMap[fileType];

    setState('downloading');

    // Simulate short preparation delay for realistic download feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = await downloadCadVaultFile({
      part,
      revision: selectedRev,
      fileType,
      userRole: userRole || currentUser?.systemRole,
      permissionMatrix,
      logAction
    });

    if (result.success) {
      setState('success');
      showToast(result.message, 'success');
      setTimeout(() => setState('idle'), 3000);
    } else {
      if (result.error === 'PDF_NOT_FOUND') {
        setState('unavailable');
      } else {
        setState('error');
      }
      showToast(result.message, 'error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  // Assembly Tree Data - Derived from actual active part
  const assemblyTreeData: AssemblyTreeNode = {
    id: part?.id || 'root',
    partNumber: part?.partNumber || 'N/A',
    name: part?.name || 'Assembly Unit',
    description: part?.description || 'Mechanical Component',
    revision: part?.currentRev || 'Rev 01',
    quantity: 1,
    lifecycle: part?.lifecycleStage || 'Draft',
    children: []
  };

  const renderTreeNodes = (node: AssemblyTreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];

    return (
      <div key={node.id} className="space-y-1 text-xs">
        <div 
          onClick={() => hasChildren && toggleNode(node.id)}
          className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer border ${
            depth === 0 
              ? isDark ? 'bg-[#0D1628] border-cyan-500/40 text-cyan-400 font-semibold' : 'bg-[#F8FAFC] border-cyan-500/40 text-cyan-700 font-semibold'
              : depth === 1 
              ? isDark ? 'bg-[#111B2E] border-[#243149] text-[#F1F5F9] ml-3' : 'bg-white border-[#E2E8F0] text-[#172033] ml-3'
              : isDark ? 'bg-[#151F32]/60 border-[#243149]/60 text-[#94A3B8] ml-6' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] ml-6'
          } hover:border-cyan-500/60`}
        >
          <div className="flex items-center space-x-2 truncate">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              ) : (
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
              )
            ) : (
              <span className="w-3.5 h-3.5 shrink-0" />
            )}
            <Box className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <span className="font-semibold font-mono">{node.partNumber}</span>
            <span className={`truncate text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{node.name}</span>
          </div>

          <div className="flex items-center space-x-2.5 text-[11px] shrink-0">
            <span className={isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}>Qty: {node.quantity}</span>
            <span className="text-amber-500 font-semibold font-mono">Rev {node.revision}</span>
            <span className={`badge-status ${
              node.lifecycle === 'Released' ? 'badge-active' : 'badge-progress'
            }`}>
              {node.lifecycle}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderTreeNodes(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2 border transition-all animate-bounce ${
          toastMsg.type === 'error'
            ? 'bg-rose-500 text-white border-rose-600'
            : toastMsg.type === 'info'
            ? 'bg-amber-500 text-slate-950 border-amber-600'
            : 'bg-cyan-500 text-slate-950 border-cyan-600'
        }`}>
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* CAD VAULT HEADER CARD */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xl font-bold font-mono text-cyan-500">{part.partNumber || 'ASM-EV-9000'}</span>
            
            {/* Active Selected Revision Badge / Dropdown */}
            <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${
              isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <span>Active Rev:</span>
              <select
                value={selectedRev}
                onChange={(e) => {
                  setSelectedRev(e.target.value);
                  showToast(`Selected Vault Revision ${e.target.value}`, 'info');
                }}
                className="bg-transparent font-bold border-none focus:outline-none cursor-pointer"
              >
                {partRevisions.map((r) => (
                  <option key={r.revId} value={r.revId} className={isDark ? 'bg-[#111B2E] text-slate-200' : 'bg-white text-slate-800'}>
                    {r.revId} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              {part.cadMetadata?.format || 'SLDASM'}
            </span>

            <span className={`badge-status ${part.isCheckedOut ? 'badge-draft' : 'badge-active'}`}>
              {part.isCheckedOut ? `Checked Out: ${part.checkedOutBy || 'Design Engineer'}` : 'Vault Available'}
            </span>
          </div>

          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
            {part.name || 'CAD Model'}
          </h1>
          <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            {part.description || 'Master Mechanical CAD Model & Geometry'}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => {
              if (onCheckoutToggle) onCheckoutToggle(part.id);
              showToast(part.isCheckedOut ? 'CAD File checked back into Vault' : 'CAD File checked out for editing');
            }}
            className={part.isCheckedOut ? 'btn-destructive' : 'btn-primary'}
          >
            {part.isCheckedOut ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{part.isCheckedOut ? 'Check In CAD' : 'Check Out CAD'}</span>
          </button>
        </div>
      </div>

      {/* CAD ACTION BAR */}
      <div className={`rounded-xl p-3 border shadow-sm flex items-center space-x-2 text-xs overflow-x-auto ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        {/* VIEW / PREVIEW BUTTON */}
        <button
          onClick={() => setIsCadPreviewOpen(true)}
          className="btn-primary btn-sm shrink-0 flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 font-bold cursor-pointer"
          title={`View / Preview 3D CAD geometry for ${part.partNumber}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View / Preview</span>
        </button>

        {/* DOWNLOAD CAD BUTTON */}
        <button
          disabled={cadState === 'downloading'}
          onClick={() => handleDownload('cad')}
          className="btn-secondary btn-sm shrink-0"
          title={`Download CAD source file for ${selectedRev}`}
        >
          {cadState === 'downloading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : cadState === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Downloaded ✓</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>Download CAD</span>
            </>
          )}
        </button>

        {/* DOWNLOAD STEP BUTTON */}
        <button
          disabled={stepState === 'downloading'}
          onClick={() => handleDownload('step')}
          className="btn-secondary btn-sm shrink-0"
          title={`Download STEP 3D Geometry model for ${selectedRev}`}
        >
          {stepState === 'downloading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : stepState === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Downloaded ✓</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-purple-500" />
              <span>Download STEP</span>
            </>
          )}
        </button>

        {/* DOWNLOAD PDF BUTTON */}
        <button
          disabled={pdfState === 'downloading'}
          onClick={() => handleDownload('pdf')}
          className="btn-secondary btn-sm shrink-0"
          title={`Download 2D Engineering Drawing PDF for ${selectedRev}`}
        >
          {pdfState === 'downloading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : pdfState === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Downloaded ✓</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Download PDF</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsDrawingModalOpen(true)}
          className="btn-secondary btn-sm shrink-0"
        >
          <Eye className="w-3.5 h-3.5 text-amber-500" />
          <span>View Drawing</span>
        </button>

        {/* VIEW BOM BUTTON */}
        <button
          onClick={() => setIsBomModalOpen(true)}
          className={`btn-sm shrink-0 cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-sm ${
            isDark 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400' 
              : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
          }`}
          title="Open Multi-Tier BOM Inspector"
        >
          <GitCommit className="w-3.5 h-3.5 text-emerald-500" />
          <span>View BOM</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
            isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-200 text-emerald-900'
          }`}>
            11 Items
          </span>
        </button>

        {/* REVISION HISTORY BUTTON */}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className={`btn-sm shrink-0 cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-sm ${
            isDark 
              ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400' 
              : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100 hover:border-blue-400'
          }`}
          title="Open Revision Audit Ledger & Timeline"
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Revision History</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
            isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-200 text-blue-900'
          }`}>
            v{selectedRev} ({partRevisions.length} Revs)
          </span>
        </button>

        {/* COMPARE REVISION BUTTON */}
        <button
          onClick={() => {
            setIsCompareModalOpen(true);
            setCompareRevA('A.3');
            setCompareRevB(selectedRev || 'A.4');
          }}
          className={`btn-sm shrink-0 cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all shadow-sm ${
            isDark 
              ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400' 
              : 'bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100 hover:border-purple-400'
          }`}
          title="Launch Parametric CAD Revision Diff Engine"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-500" />
          <span>Compare Revision</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200 text-purple-900'
          }`}>
            Diff Engine
          </span>
        </button>
      </div>

      {/* ATTACHED VAULT FILES LEDGER */}
      {storedFiles.length > 0 && (
        <div className={`rounded-xl p-4 border shadow-sm space-y-3 transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
            <div className="flex items-center space-x-2 flex-wrap">
              <Box className="w-4 h-4 text-cyan-400" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Attached CAD &amp; Document Vault Files ({storedFiles.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                &bull; Linked to Product <strong className="text-cyan-400 font-mono">{part.partNumber}</strong> &amp; Project <strong className="text-purple-400">{part.projectName || part.projectId || 'PRJ-01'}</strong>
              </span>
            </div>
            <button
              onClick={() => setIsCadPreviewOpen(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Launch 3D Viewport</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {storedFiles.map((file, idx) => (
              <div 
                key={file.id || idx}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all ${
                  isDark ? 'bg-[#0D1628] border-slate-700/50 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      {file.fileType}
                    </span>
                    <strong className="font-mono text-xs truncate block text-slate-200" title={file.fileName}>
                      {file.fileName}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {file.fileSize} &bull; {file.uploadDate}
                  </span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => setIsCadPreviewOpen(true)}
                    className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-400 cursor-pointer"
                    title="View / Preview file in 3D CAD viewer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => downloadActualStoredFile(file, logAction)}
                    className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400 cursor-pointer"
                    title="Download actual uploaded file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT: CAD INFORMATION + FILE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* LEFT COLUMN: ASSEMBLY INFORMATION CARD */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Box className="w-4 h-4 text-cyan-500" />
              <span>Assembly Metadata</span>
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
            }`}>
              CAD MASTER
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Part Number:</span>
              <span className={`font-mono font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{part.partNumber || 'ASM-EV-9000'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Revision:</span>
              <span className="text-amber-500 font-mono font-bold text-sm">{part.currentRev || 'A.4'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>File Format:</span>
              <span className="text-purple-500 font-semibold">{part.cadMetadata?.format || 'SLDASM'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Lifecycle Stage:</span>
              <span className="text-cyan-500 font-semibold uppercase">{part.lifecycleStage || 'In Review'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Owner Lead:</span>
              <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{part.createdBy || 'Lead Engineer'}</span>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
              <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Department:</span>
              <span className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}>Mechanical Design</span>
            </div>
          </div>

          {/* REVISION HISTORY TABLE */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className={`text-xs font-semibold flex items-center space-x-1.5 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Revision History</span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Click row to select target</span>
            </div>

            <div className="plm-table-container">
              <table className="plm-table text-xs">
                <thead>
                  <tr>
                    <th>Revision</th>
                    <th>Date</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partRevisions.map((rev) => {
                    const isSelected = selectedRev === rev.revId;
                    return (
                      <tr
                        key={rev.revId}
                        onClick={() => {
                          setSelectedRev(rev.revId);
                          showToast(`Selected Vault Revision ${rev.revId}`, 'info');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? (isDark ? 'bg-amber-500/15 font-bold' : 'bg-amber-50 font-bold') : ''
                        }`}
                      >
                        <td className="font-mono font-bold text-amber-500 flex items-center space-x-1.5">
                          <span>Rev {rev.revId}</span>
                          {isSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-sans font-semibold">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="font-mono text-[11px]">{rev.date}</td>
                        <td>{rev.author}</td>
                        <td>
                          <span className={`badge-status ${rev.status === 'Released' ? 'badge-active' : rev.status === 'Draft' ? 'badge-progress' : 'badge-draft'}`}>
                            {rev.status}
                          </span>
                        </td>
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isSelected && (
                              <button
                                onClick={() => {
                                  setSelectedRev(rev.revId);
                                  showToast(`Set Rev ${rev.revId} as active Vault revision`, 'success');
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/30 text-[10px] font-semibold cursor-pointer"
                                title="Set active in CAD Vault"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setCompareRevA(rev.revId);
                                setCompareRevB(selectedRev);
                                setIsCompareModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 text-[10px] font-semibold cursor-pointer"
                              title="Compare this revision"
                            >
                              Diff
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
        </div>

        {/* RIGHT COLUMN: CAD FILE DETAILS + BOUNDING GEOMETRY */}
        <div className="space-y-6">
          {/* CAD File Details */}
          <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                <FileCheck className="w-4 h-4 text-purple-500" />
                <span>File Technical Parameters</span>
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'
              }`}>
                SOLIDWORKS 2025
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>File Name:</span>
                <span className="text-cyan-500 font-mono font-bold">{part.cadMetadata?.fileName || 'ASM-EV-9000.SLDASM'}</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>File Size:</span>
                <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{part.cadMetadata?.fileSize || '24.8 MB'}</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>CAD Platform:</span>
                <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>SolidWorks 2025 SP3</span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Units:</span>
                <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>mm (Millimeters)</span>
              </div>
            </div>
          </div>

          {/* CAD BOUNDING GEOMETRY CARD */}
          <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                <Ruler className="w-4 h-4 text-emerald-500" />
                <span>Bounding Physical Geometry</span>
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
              }`}>
                PHYSICAL PROPS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Dimensions (X × Y × Z):</span>
                <span className="text-cyan-500 font-mono font-bold">
                  {part.cadMetadata?.boundingDimensionsMm?.join(' × ') || '450 × 680 × 1250'} mm
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Volume:</span>
                <span className="text-emerald-500 font-mono font-bold">
                  {(part.cadMetadata?.volumeCm3 || 8400).toLocaleString()} cm³
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Surface Area:</span>
                <span className="text-purple-500 font-mono font-bold">
                  {(part.cadMetadata?.surfaceAreaCm2 || 12400).toLocaleString()} cm²
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className={`block text-[11px] font-medium ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Mass (Weight):</span>
                <span className="text-amber-500 font-mono font-bold">
                  {part.weightKg || 28.4} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TWO-COLUMN: EXPANDABLE ASSEMBLY TREE + 2D BLUEPRINT PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        
        {/* EXPANDABLE ASSEMBLY STRUCTURE TREE */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Assembly Structure Tree</span>
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
            }`}>
              HIERARCHY
            </span>
          </div>

          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            {renderTreeNodes(assemblyTreeData)}
          </div>
        </div>

        {/* 2D ENGINEERING DRAWING PREVIEW */}
        <div className={`rounded-[14px] p-5 border shadow-sm space-y-4 flex flex-col justify-between ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <h3 className={`text-sm font-semibold flex items-center space-x-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              <Printer className="w-4 h-4 text-amber-500" />
              <span>2D Engineering Blueprint Preview</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsDrawingModalOpen(true)}
                className="btn-secondary btn-sm"
              >
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>View Sheet</span>
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="btn-secondary btn-sm"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* SVG Vector Drawing Graphic */}
          <div className={`border rounded-xl p-4 relative overflow-hidden flex-1 flex flex-col justify-between ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="relative z-10 py-4">
              <svg viewBox="0 0 600 240" className="w-full h-44 stroke-cyan-500 fill-none stroke-[1.5]">
                {/* Front View Orthographic */}
                <g transform="translate(40, 20)">
                  <rect x="10" y="20" width="120" height="140" rx="6" className="stroke-cyan-500 stroke-2" />
                  <circle cx="70" cy="90" r="35" className="stroke-cyan-500 stroke-[1.5]" />
                  <circle cx="70" cy="90" r="15" className="stroke-amber-500 stroke-1 stroke-dasharray-2" />
                  <line x1="70" y1="10" x2="70" y2="170" className="stroke-slate-500 stroke-1 stroke-dasharray-4" />
                  <line x1="0" y1="90" x2="140" y2="90" className="stroke-slate-500 stroke-1 stroke-dasharray-4" />
                  <text x="50" y="185" className="fill-slate-400 text-[10px] font-sans font-semibold stroke-none">FRONT VIEW</text>
                  <line x1="10" y1="5" x2="130" y2="5" className="stroke-emerald-500 stroke-1" />
                  <text x="50" y="0" className="fill-emerald-500 text-[9px] font-mono font-bold stroke-none">450.00 mm</text>
                </g>

                {/* Top View Orthographic */}
                <g transform="translate(230, 20)">
                  <rect x="20" y="40" width="140" height="90" rx="6" className="stroke-cyan-500 stroke-2" />
                  <line x1="20" y1="85" x2="160" y2="85" className="stroke-amber-500 stroke-1 stroke-dasharray-2" />
                  <circle cx="60" cy="85" r="20" className="stroke-cyan-500" />
                  <circle cx="120" cy="85" r="20" className="stroke-cyan-500" />
                  <text x="65" y="155" className="fill-slate-400 text-[10px] font-sans font-semibold stroke-none">TOP VIEW</text>
                  <line x1="165" y1="40" x2="165" y2="130" className="stroke-emerald-500 stroke-1" />
                  <text x="170" y="90" className="fill-emerald-500 text-[9px] font-mono font-bold stroke-none">680.00</text>
                </g>

                {/* Side Isometric Projections */}
                <g transform="translate(420, 20)">
                  <polygon points="20,50 80,20 140,50 140,130 80,160 20,130" className="stroke-purple-500 stroke-2" />
                  <line x1="80" y1="20" x2="80" y2="160" className="stroke-purple-500 stroke-1" />
                  <line x1="20" y1="50" x2="80" y2="85" className="stroke-purple-500 stroke-1" />
                  <line x1="140" y1="50" x2="80" y2="85" className="stroke-purple-500 stroke-1" />
                  <text x="50" y="185" className="fill-slate-400 text-[10px] font-sans font-semibold stroke-none">ISOMETRIC</text>
                </g>
              </svg>
            </div>

            {/* Drawing Title Block */}
            <div className={`p-3 rounded-lg border space-y-1 text-[11px] ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between border-b pb-1 font-semibold border-slate-700/20">
                <span className="text-cyan-500 font-mono">DWG-2026-9000</span>
                <span className="text-amber-500">SCALE 1:2.5</span>
              </div>

              <div className={`grid grid-cols-3 gap-2 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                <div>Part: <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{part.partNumber}</span></div>
                <div>Rev: <span className="text-amber-500 font-semibold">{part.currentRev || 'Rev 00'}</span></div>
                <div>Material: <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{part.material || 'Standard Alloy'}</span></div>
                <div>Tolerance: <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>ISO 2768-m</span></div>
                <div>Author: <span className="text-cyan-500 font-semibold">{part.createdBy || 'Lead Engineer'}</span></div>
                <div>Sheet: <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>1 OF 1</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <EngineeringDrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        part={part}
        revision={selectedRev}
        userRole={userRole}
        logAction={logAction}
      />

      {/* Multi-Tier BOM Inspector Modal */}
      <CadBomInspectorModal
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        part={part}
        revision={selectedRev}
        onNavigateToBomExplorer={() => onNavigateTab?.('bom')}
        onShowToast={showToast}
      />

      {/* Revision Audit History Ledger Modal */}
      <CadRevisionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        part={part}
        activeRevision={selectedRev}
        onSelectRevision={(revId) => {
          setSelectedRev(revId);
          showToast(`Vault active revision set to Rev ${revId}`, 'success');
        }}
        onOpenCompare={(revA, revB) => {
          setCompareRevA(revA);
          setCompareRevB(revB);
          setIsCompareModalOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Parametric CAD Revision Diff Engine Modal */}
      <CadCompareDiffModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        part={part}
        initialRevA={compareRevA || 'A.3'}
        initialRevB={compareRevB || selectedRev || 'A.4'}
        onSetActiveRev={(revId) => {
          setSelectedRev(revId);
          showToast(`Vault active revision set to Rev ${revId}`, 'success');
        }}
        onShowToast={showToast}
      />

      <CadPreviewModal
        isOpen={isCadPreviewOpen}
        onClose={() => setIsCadPreviewOpen(false)}
        part={part}
        revision={selectedRev}
        onOpenDrawing={() => setIsDrawingModalOpen(true)}
        logAction={logAction}
      />
    </div>
  );
};

// Error Boundary Fallback for CAD Viewer 3D
class CADErrorBoundary extends React.Component<
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
    console.error('CAD Viewer Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="plm-card p-8 text-center space-y-4 font-sans">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">CAD Vault 3D Viewer Error Caught</h2>
          <p className="text-xs text-secondary max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while loading 3D CAD models and metadata.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary"
          >
            <span>Reload CAD Vault</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const CADViewer3D: React.FC<CADViewer3DProps> = (props) => (
  <CADErrorBoundary>
    <CADViewer3DInternal {...props} />
  </CADErrorBoundary>
);

export default CADViewer3D;

