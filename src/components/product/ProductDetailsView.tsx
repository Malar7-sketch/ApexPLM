import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Box, 
  Layers, 
  FileText, 
  Cpu, 
  GitCommit, 
  GitPullRequest, 
  ShieldAlert, 
  Award, 
  Wrench, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  Eye, 
  Download, 
  Plus, 
  GitCompare, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  Edit,
  Clock,
  X,
  Upload,
  FolderLock
} from 'lucide-react';
import type { 
  PartItem, 
  Revision, 
  BOMNode, 
  EngineeringDocument, 
  Project, 
  ECR, 
  QualityNCR, 
  DfmeaRow, 
  PfmeaRow, 
  AuditLog 
} from '../../types/plm';
import type { UserAccount } from '../../data/mockUsers';
import { useTheme } from '../../context/ThemeContext';
import { 
  downloadCadVaultFile, 
  registerCadVaultFile, 
  getStoredCadVaultFiles, 
  sanitizeRevName 
} from '../../utils/cadVaultStorage';
import { generateEngineeringDrawingPdf } from '../../utils/engineeringDrawingPdf';
import { CadPreviewModal } from '../CadPreviewModal';
import { DocumentViewerModal } from '../DocumentViewerModal';
import { RevisionCompareModal } from './RevisionCompareModal';
import { CreateRevisionModal } from './CreateRevisionModal';
import { partsApi, documentsApi } from '../../services/api';

interface ProductDetailsViewProps {
  product: PartItem;
  onBack: () => void;
  onEditProduct: (product: PartItem) => void;
  onDeleteProduct?: (product: PartItem) => void;
  currentUser: UserAccount;
  allProducts: PartItem[];
  setAllProducts: React.Dispatch<React.SetStateAction<PartItem[]>>;
  documents: EngineeringDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EngineeringDocument[]>>;
  bomTrees: Record<string, BOMNode>;
  setBomTrees: React.Dispatch<React.SetStateAction<Record<string, BOMNode>>>;
  projects: Project[];
  ecrs?: ECR[];
  ncrs?: QualityNCR[];
  dfmeaRows?: DfmeaRow[];
  pfmeaRows?: PfmeaRow[];
  auditLogs?: AuditLog[];
  logAction: (action: string, category: any, targetId: string, details: string) => void;
  onSelectPart: (partId: string) => void;
  onNavigateTab: (tab: string) => void;
  isAdmin: boolean;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  onBack,
  onEditProduct,
  onDeleteProduct,
  currentUser,
  allProducts,
  setAllProducts,
  documents,
  setDocuments,
  bomTrees,
  setBomTrees,
  projects,
  ecrs = [],
  ncrs = [],
  dfmeaRows = [],
  pfmeaRows = [],
  auditLogs = [],
  logAction,
  onSelectPart,
  onNavigateTab,
  isAdmin
}) => {
  const { isDark } = useTheme();

  // Active Tab state for the 11 tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'revisions' | 'documents' | 'cad' | 'bom' | 
    'changes' | 'dfmea' | 'review' | 'mfg' | 'quality' | 'audit'
  >('overview');

  // Selected revision to inspect (allows historical viewing without modifying active revision!)
  const [inspectedRevId, setInspectedRevId] = useState<string>(product.currentRev);

  // Modals
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCreateRevModalOpen, setIsCreateRevModalOpen] = useState(false);
  const [cadPreviewPart, setCadPreviewPart] = useState<PartItem | null>(null);
  const [viewingDoc, setViewingDoc] = useState<EngineeringDocument | null>(null);

  // Direct Document Upload modal state
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocType, setNewDocType] = useState('Technical Specification');
  const [newDocTitle, setNewDocTitle] = useState('');

  // Find inspected revision object
  const inspectedRev: Revision | undefined = product.revisionHistory?.find(r => r.revId === inspectedRevId) || {
    revId: product.currentRev,
    date: '2026-08-01',
    author: product.productOwner || 'Alex Rivera, PE',
    changeSummary: 'Current active release',
    status: 'Released',
    technicalSpecs: product.technicalSpecs
  };

  const currentSpecs = inspectedRev?.technicalSpecs || product.technicalSpecs || {};
  const rootBOM = bomTrees[product.id] || bomTrees[product.partNumber];
  const bomComponents: BOMNode[] = inspectedRev?.bomSnapshot || (rootBOM?.children || []);

  // Filter documents linked to this product and inspected revision
  const productDocuments = documents.filter(d => 
    d.linkedPartId === product.id || 
    d.linkedPartId === product.partNumber ||
    d.docNumber?.includes(product.partNumber)
  );

  // Merge any files stored in central vault or revision history so nothing is missed
  const allLinkedVaultFiles = [
    ...getStoredCadVaultFiles(product.id),
    ...getStoredCadVaultFiles(product.partNumber),
    ...(inspectedRev?.attachedFiles || []),
    ...(product.cadMetadata?.attachedFiles || []),
    ...(product.revisionHistory?.flatMap(r => r.attachedFiles || []) || [])
  ];

  const mergedDocuments = [...productDocuments];
  allLinkedVaultFiles.forEach((file, idx) => {
    if (!file || !file.fileName) return;
    const exists = mergedDocuments.some(
      d => d.fileName === file.fileName || d.id === file.id || (file.id && d.id?.includes(file.id))
    );
    if (!exists) {
      const isPdf = file.fileType.toUpperCase() === 'PDF' || file.fileName.toLowerCase().endsWith('.pdf');
      const isCad = ['STEP', 'STP', 'SLDPRT', 'SLDASM', 'DWG', 'DXF', 'IGES'].includes(file.fileType.toUpperCase());
      mergedDocuments.push({
        id: file.id || `DOC-SYNTH-${product.id}-${idx}`,
        docNumber: `DOC-${(file.revision || inspectedRevId).replace(/[^a-zA-Z0-9]/g, '')}-${product.partNumber}-${String(idx + 1).padStart(3, '0')}`,
        title: file.fileName,
        type: isPdf ? '2D Drawing PDF' : isCad ? '3D CAD Model' : 'Technical Specification',
        linkedPartId: product.id,
        revision: file.revision || inspectedRevId,
        author: file.uploadedBy || 'Engineering Team',
        uploadDate: file.uploadDate || new Date().toISOString().split('T')[0],
        fileSize: file.fileSize || '1.5 MB',
        status: 'Approved',
        fileUrl: file.dataUrl,
        fileName: file.fileName,
        fileExtension: file.fileType?.toLowerCase() || (isPdf ? 'pdf' : 'bin')
      });
    }
  });

  if (product.cadMetadata?.pdfFile && !mergedDocuments.some(d => d.fileExtension === 'pdf' || d.type === '2D Drawing PDF')) {
    mergedDocuments.push({
      id: `DIRECT-PDF-${product.id}`,
      docNumber: `DWG-${product.partNumber}`,
      title: `${product.partNumber}_Drawing.pdf`,
      type: '2D Drawing PDF',
      linkedPartId: product.id,
      revision: inspectedRevId,
      author: 'Engineering Master',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: '1.2 MB',
      status: 'Approved',
      fileUrl: product.cadMetadata.pdfFile,
      fileName: `${product.partNumber}_Drawing.pdf`,
      fileExtension: 'pdf'
    });
  }

  const revisionDocuments = mergedDocuments.filter(d => 
    !d.revision || 
    d.revision === inspectedRevId || 
    d.revision.includes(inspectedRevId) ||
    inspectedRevId.includes(d.revision)
  );

  // Filter ECRs / ECNs linked to this product
  const productEcrs = ecrs.filter(e => 
    e.targetProductId === product.id || 
    e.targetProductPartNumber === product.partNumber ||
    e.impactedPartIds?.includes(product.id) ||
    e.impactedPartIds?.includes(product.partNumber)
  );

  // Filter NCRs linked to this product
  const productNcrs = ncrs.filter(n => 
    n.linkedPartId === product.id || 
    n.linkedPartId === product.partNumber ||
    n.targetPartNumber === product.partNumber
  );

  // Filter DFMEA / PFMEA rows linked to this product
  const productDfmeas = dfmeaRows.filter(row => 
    (row.component && (row.component.includes(product.partNumber) || row.component.includes(product.id))) ||
    (row.system && row.system.includes(product.productFamily || ''))
  );

  // Filter Audit Logs for this product
  const productAuditLogs = auditLogs.filter(log => 
    log.targetId === product.id || 
    log.targetId === product.partNumber ||
    log.details.includes(product.partNumber) ||
    log.details.includes(product.id)
  );

  // Handle setting an active/current revision
  const handleSetActiveRevision = (revId: string) => {
    const updated = {
      ...product,
      currentRev: revId
    };
    setAllProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    partsApi.update(product.id, updated).catch(err => console.warn('Backend update failed:', err));
    logAction(
      'Activated Revision',
      'ITEM_MASTER',
      product.partNumber,
      `Set active current revision of ${product.partNumber} to ${revId}.`
    );
    setInspectedRevId(revId);
  };

  // Direct Document Upload in Product Details
  const handleDirectDocUpload = async () => {
    if (!newDocFile) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const ext = newDocFile.name.split('.').pop()?.toUpperCase() || 'BIN';
        const isPdf = ext === 'PDF';
        const docId = `DOC-${product.partNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
        const newDoc: EngineeringDocument = {
          id: docId,
          docNumber: `DOC-${inspectedRevId.replace(/[^a-zA-Z0-9]/g, '')}-${product.partNumber}-${Date.now().toString().slice(-4)}`,
          title: newDocTitle || newDocFile.name,
          type: newDocType as any,
          linkedPartId: product.id,
          revision: inspectedRevId,
          author: currentUser.name || 'Alex Rivera, PE',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: (newDocFile.size / (1024 * 1024)).toFixed(2) + ' MB',
          status: 'Approved',
          fileUrl: dataUrl,
          fileName: newDocFile.name,
          fileExtension: ext.toLowerCase(),
          description: `Document uploaded to ${product.partNumber} ${inspectedRevId}`
        };

        setDocuments(prev => [newDoc, ...prev]);
        await documentsApi.create(newDoc);

        // Register to CAD vault
        registerCadVaultFile({
          id: `VAULT-${docId}`,
          productId: product.id,
          partNumber: product.partNumber,
          projectId: product.projectId,
          projectName: product.projectName,
          fileName: newDocFile.name,
          fileType: ext,
          category: isPdf ? 'drawing' : 'document',
          fileSize: newDoc.fileSize,
          uploadDate: newDoc.uploadDate,
          uploadedBy: newDoc.author,
          dataUrl: dataUrl
        });

        // Update product attachedDocIds in local state & MongoDB
        const updatedProduct = {
          ...product,
          revisionHistory: (product.revisionHistory || []).map(r => {
            if (r.revId === inspectedRevId) {
              return {
                ...r,
                attachedDocIds: [...(r.attachedDocIds || []), docId],
                attachedFiles: [
                  ...(r.attachedFiles || []),
                  {
                    id: `VAULT-${docId}`,
                    productId: product.id,
                    partNumber: product.partNumber,
                    fileName: newDocFile.name,
                    fileType: ext,
                    category: (isPdf ? 'drawing' : 'document') as any,
                    fileSize: newDoc.fileSize,
                    uploadDate: newDoc.uploadDate,
                    uploadedBy: newDoc.author,
                    dataUrl: dataUrl
                  }
                ]
              };
            }
            return r;
          })
        };
        setAllProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        partsApi.update(product.id, updatedProduct).catch(console.warn);

        logAction('Uploaded Document', 'DOCUMENTS', newDoc.docNumber, `Attached ${newDoc.title} to ${product.partNumber} ${inspectedRevId}.`);
        setIsUploadingDoc(false);
        setNewDocFile(null);
        setNewDocTitle('');
      };
      reader.readAsDataURL(newDocFile);
    } catch (e: any) {
      alert('Upload error: ' + e.message);
    }
  };

  // Generate & Attach Official PDF Drawing
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const handleGenerateAndAttachPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const cleanRev = sanitizeRevName(inspectedRevId);
      const { blob, filename } = await generateEngineeringDrawingPdf({
        part: product,
        revision: inspectedRevId,
        authorName: currentUser.name || 'Alex Rivera, PE'
      });

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const docId = `DOC-${product.partNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
        const newDoc: EngineeringDocument = {
          id: docId,
          docNumber: `DWG-${product.partNumber}-${cleanRev}`,
          title: `${product.name} Official 2D Drawing Blueprint`,
          type: '2D Drawing PDF',
          linkedPartId: product.id,
          revision: inspectedRevId,
          author: currentUser.name || 'Alex Rivera, PE',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
          status: 'Approved',
          fileUrl: dataUrl,
          fileName: filename,
          fileExtension: 'pdf',
          description: `Generated engineering blueprint for ${product.partNumber} (${inspectedRevId})`
        };

        setDocuments(prev => [newDoc, ...prev]);
        await documentsApi.create(newDoc);

        registerCadVaultFile({
          id: `VAULT-${docId}`,
          productId: product.id,
          partNumber: product.partNumber,
          projectId: product.projectId,
          projectName: product.projectName,
          fileName: filename,
          fileType: 'PDF',
          category: 'drawing',
          fileSize: newDoc.fileSize,
          uploadDate: newDoc.uploadDate,
          uploadedBy: newDoc.author,
          dataUrl: dataUrl
        });

        const updatedProduct = {
          ...product,
          revisionHistory: (product.revisionHistory || []).map(r => {
            if (r.revId === inspectedRevId) {
              return {
                ...r,
                attachedDocIds: [...(r.attachedDocIds || []), docId],
                pdfFile: dataUrl
              };
            }
            return r;
          })
        };
        setAllProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        partsApi.update(product.id, updatedProduct).catch(console.warn);

        logAction('Generated Drawing PDF', 'DOCUMENTS', newDoc.docNumber, `Created & attached blueprint ${filename} to ${product.partNumber} ${inspectedRevId}.`);
        alert(`Successfully generated & attached "${filename}" to Revision ${inspectedRevId}!`);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download physical file helper
  const handleDownloadDoc = (doc: EngineeringDocument) => {
    if (!doc.fileUrl) {
      alert('No physical file data is associated with this document record.');
      return;
    }

    try {
      const ext = doc.fileExtension || doc.fileName?.split('.').pop() || (doc.type === '2D Drawing PDF' ? 'pdf' : 'bin');
      const filename = doc.fileName || doc.title || `${doc.docNumber}.${ext}`;

      if (doc.fileUrl.startsWith('data:')) {
        const parts = doc.fileUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
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
      } else {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 1000);
      }
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Failed to download document file.');
    }
  };

  const tabs = [
    { id: 'overview', label: '1. OVERVIEW', icon: Box },
    { id: 'revisions', label: `2. REVISIONS (${product.revisionHistory?.length || 1})`, icon: RefreshCw },
    { id: 'documents', label: `3. DOCUMENTS (${revisionDocuments.length})`, icon: FileText },
    { id: 'cad', label: '4. CAD FILES', icon: Box },
    { id: 'bom', label: `5. BOM (${bomComponents.length})`, icon: GitCommit },
    { id: 'changes', label: `6. CHANGES (${productEcrs.length})`, icon: GitPullRequest },
    { id: 'dfmea', label: `7. DFMEA / RISK (${productDfmeas.length})`, icon: ShieldAlert },
    { id: 'review', label: '8. DESIGN REVIEW', icon: Award },
    { id: 'mfg', label: '9. MANUFACTURING', icon: Wrench },
    { id: 'quality', label: `10. QUALITY (${productNcrs.length})`, icon: ShieldCheck },
    { id: 'audit', label: `11. AUDIT LOG (${productAuditLogs.length})`, icon: Activity }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className={`rounded-2xl p-6 border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className={`p-2.5 rounded-xl border shrink-0 transition-colors cursor-pointer ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-cyan-400' : 'border-slate-200 hover:bg-slate-100 text-cyan-700'
            }`}
            title="Return to Product Master Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-cyan-400 font-mono">
                {product.partNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Permanent ID: {product.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Active: {product.currentRev}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {product.lifecycleStage}
              </span>
            </div>

            <h1 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {product.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {product.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsCreateRevModalOpen(true)}
            className="btn-primary btn-sm flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Create New Revision</span>
          </button>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-purple-400" />
            <span>Compare Revisions</span>
          </button>

          <button
            onClick={() => onEditProduct(product)}
            className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Product</span>
          </button>

          {isAdmin && onDeleteProduct && (
            <button
              onClick={() => onDeleteProduct(product)}
              className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer flex items-center space-x-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Revision Inspection Bar (Switch between historical snapshots) */}
      <div className={`px-5 py-3 rounded-xl border flex items-center justify-between text-xs ${
        isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            Inspecting Revision Snapshot:
          </span>
          <select
            value={inspectedRevId}
            onChange={(e) => setInspectedRevId(e.target.value)}
            className={`px-3 py-1 rounded-lg border font-mono font-bold outline-none cursor-pointer ${
              isDark ? 'bg-[#111B2E] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-cyan-800'
            }`}
          >
            {(product.revisionHistory || []).map(r => (
              <option key={r.revId} value={r.revId}>
                {r.revId} ({r.status}) &bull; {r.date}
              </option>
            ))}
          </select>
          {inspectedRevId !== product.currentRev && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Viewing Historical Snapshot
            </span>
          )}
        </div>

        {inspectedRevId !== product.currentRev && (
          <button
            onClick={() => handleSetActiveRevision(inspectedRevId)}
            className="btn-secondary btn-sm text-[11px] cursor-pointer"
          >
            Activate as Current Revision
          </button>
        )}
      </div>

      {/* 11 Tabs Bar */}
      <div className={`rounded-xl border p-1.5 flex items-center space-x-1 overflow-x-auto shadow-sm ${
        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? isDark 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className={`rounded-2xl p-6 border shadow-sm space-y-4 md:col-span-2 ${
            isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b pb-2 border-slate-700/30">
              Product Master Specifications &amp; Attributes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Product Name:</span>
                <strong className="text-white text-sm">{product.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Product / Part Number:</span>
                <strong className="font-mono text-cyan-400 text-sm">{product.partNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Permanent Product ID:</span>
                <strong className="font-mono text-purple-400">{product.id}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Active Revision:</span>
                <strong className="font-mono text-amber-400">{product.currentRev} ({inspectedRev?.status || 'Draft'})</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Category:</span>
                <strong>{product.category}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Type:</span>
                <strong>{product.type}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Product Family:</span>
                <strong>{product.productFamily || 'Electric Mobility'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Associated Project:</span>
                <strong className="text-cyan-400">{product.projectName || product.projectId || 'PRJ-01'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Customer / OEM:</span>
                <strong>{product.customerName || 'Apex Mobility Global'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Department:</span>
                <strong>{product.department || 'Mechanical Design'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Product Owner:</span>
                <strong>{product.productOwner || 'Alex Rivera, PE'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Design Engineer:</span>
                <strong>{product.designEngineer || 'Alex Rivera, PE'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Manufacturing Engineer:</span>
                <strong>{product.manufacturingEngineer || 'Marcus Vance'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Quality Engineer:</span>
                <strong>{product.qualityEngineer || 'Dr. Elena Rostova'}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Description:</span>
                <p className="mt-1 text-slate-300 leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>

          {/* Quick Technical Specs & CAD Status Card */}
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 border-b pb-2 border-slate-700/30">
                Technical Baseline ({inspectedRevId})
              </h3>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between border-b pb-1 border-slate-800/40">
                  <span className="text-slate-400">Material:</span>
                  <span className="font-semibold">{currentSpecs.material || product.material}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-800/40">
                  <span className="text-slate-400">Weight:</span>
                  <span className="font-mono font-semibold">{currentSpecs.weightKg || product.weightKg} kg</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-800/40">
                  <span className="text-slate-400">Dimensions:</span>
                  <span className="font-mono text-[11px]">{currentSpecs.dimensions || `${product.cadMetadata?.boundingDimensionsMm?.join(' x ')} mm`}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-800/40">
                  <span className="text-slate-400">CAD Platform:</span>
                  <span className="font-mono text-cyan-400">{currentSpecs.cadFileFormat || product.cadMetadata?.format || 'STEP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Cost:</span>
                  <span className="font-mono font-bold text-emerald-400">${product.actualCost?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCadPreviewPart(product)}
                  className="btn-primary btn-sm w-full flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Interactive 3D CAD Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REVISIONS ================= */}
      {activeTab === 'revisions' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Revision History &amp; Engineering Change Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every revision represents an immutable engineering baseline under permanent ID <strong className="text-cyan-400">{product.id}</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                <span>Compare Revisions</span>
              </button>
              <button
                onClick={() => setIsCreateRevModalOpen(true)}
                className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Revision</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                  isDark ? 'bg-[#0D1628] text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <th className="py-2.5 px-3">Revision</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Change Reason &amp; Summary</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(product.revisionHistory || []).map((rev) => {
                  const isCurrent = rev.revId === product.currentRev;
                  const isInspected = rev.revId === inspectedRevId;

                  return (
                    <tr 
                      key={rev.revId}
                      className={`transition-colors ${
                        isInspected ? isDark ? 'bg-cyan-500/10' : 'bg-cyan-50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {rev.revId}
                        {isCurrent && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            CURRENT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{rev.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{rev.author}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rev.status === 'Released'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : rev.status === 'Draft'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {rev.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{rev.changeSummary || rev.description || 'No description provided'}</div>
                        {rev.changeReason && (
                          <span className="text-[10px] text-slate-500 block">Reason: {rev.changeReason}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => setInspectedRevId(rev.revId)}
                          className={`btn-secondary btn-sm text-[11px] cursor-pointer ${
                            isInspected ? 'border-cyan-500 text-cyan-400' : ''
                          }`}
                        >
                          View Snapshot
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleSetActiveRevision(rev.revId)}
                            className="btn-secondary btn-sm text-[11px] cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DOCUMENTS ================= */}
      {activeTab === 'documents' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Engineering Documents — Revision {inspectedRevId}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical files linked to {product.partNumber} ({inspectedRevId}). Stored persistently in PLM Document Vault.
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                disabled={isGeneratingPdf}
                onClick={handleGenerateAndAttachPdf}
                className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer text-cyan-400 hover:text-cyan-300"
                title="Automatically create and attach an official ISO/ASME 2D drawing PDF"
              >
                {isGeneratingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-rose-400" />}
                <span>Generate Blueprint PDF</span>
              </button>

              <button
                onClick={() => setIsUploadingDoc(true)}
                className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach New Document</span>
              </button>
            </div>
          </div>

          {/* Modal for Direct Document Upload */}
          {isUploadingDoc && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#0D1628] border-cyan-500/40' : 'bg-slate-50 border-cyan-300'
            }`}>
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-cyan-400 uppercase">Attach File to Revision {inspectedRevId}</strong>
                <button onClick={() => setIsUploadingDoc(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Document Title</label>
                  <input 
                    type="text" 
                    value={newDocTitle} 
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. 2D Drawing Sheet 1"
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#111B2E] border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Document Type</label>
                  <select 
                    value={newDocType} 
                    onChange={(e) => setNewDocType(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#111B2E] border-slate-700' : 'bg-white border-slate-300'}`}
                  >
                    <option value="2D Drawing PDF">2D Drawing PDF</option>
                    <option value="3D CAD Model">3D CAD Model</option>
                    <option value="Technical Specification">Technical Specification</option>
                    <option value="Inspection Plan">Inspection Plan</option>
                    <option value="DFMEA">DFMEA</option>
                    <option value="Material Certificate">Material Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Physical File</label>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewDocFile(file);
                        if (!newDocTitle) setNewDocTitle(file.name);
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-cyan-500/20 file:text-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setIsUploadingDoc(false)} className="btn-secondary btn-sm">Cancel</button>
                <button onClick={handleDirectDocUpload} disabled={!newDocFile} className="btn-primary btn-sm">Upload &amp; Link</button>
              </div>
            </div>
          )}

          {/* Documents Table */}
          {revisionDocuments.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border border-dashed space-y-4 ${
              isDark ? 'border-slate-700/80 bg-[#0E1729]/50' : 'border-slate-300 bg-slate-50'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-rose-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-200">No Documents Linked to Revision {inspectedRevId} Yet</h4>
                <p className="text-xs text-slate-400">
                  Attach PDF drawings, CAD models, or technical specifications, or generate an official blueprint PDF instantly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadingDoc(true)}
                  className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-cyan-500/20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF or File</span>
                </button>
                <button
                  disabled={isGeneratingPdf}
                  onClick={handleGenerateAndAttachPdf}
                  className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Generate Blueprint PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'bg-[#0D1628] text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2 px-3">Doc #</th>
                    <th className="py-2 px-3">Title</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Revision</th>
                    <th className="py-2 px-3">Size</th>
                    <th className="py-2 px-3">Uploaded</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {revisionDocuments.map(doc => (
                    <tr key={doc.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{doc.docNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{doc.title}</td>
                      <td className="py-2.5 px-3 text-purple-400">{doc.type}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">{doc.revision}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{doc.fileSize}</td>
                      <td className="py-2.5 px-3 text-slate-400">{doc.uploadDate}</td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="btn-secondary btn-sm text-[11px] cursor-pointer"
                          title="View / Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="btn-secondary btn-sm text-[11px] cursor-pointer"
                          title="Download Physical File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: CAD FILES ================= */}
      {activeTab === 'cad' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                CAD Geometry &amp; 3D Model Vault
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical CAD models and STEP files for {product.partNumber} ({inspectedRevId}).
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => {
                  onSelectPart(product.id);
                  onNavigateTab('cad');
                }}
                className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open in CAD Vault Module</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-cyan-400" />
                <strong className="text-white">Active 3D CAD Master</strong>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <div>File: <span className="text-cyan-400">{product.cadMetadata?.fileName || `${product.partNumber}.STEP`}</span></div>
                <div>Format: <span>{product.cadMetadata?.format || 'STEP'}</span></div>
                <div>Size: <span>{product.cadMetadata?.fileSize || '15.4 MB'}</span></div>
                <div>Bounding Box: <span>{product.cadMetadata?.boundingDimensionsMm?.join(' x ')} mm</span></div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setCadPreviewPart(product)}
                  className="btn-primary btn-sm flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview 3D Geometry</span>
                </button>
                <button
                  onClick={() => downloadCadVaultFile({ part: product, fileType: 'cad', logAction })}
                  className="btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download CAD</span>
                </button>
                <button
                  onClick={() => downloadCadVaultFile({ part: product, fileType: 'step', logAction })}
                  className="btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download STEP</span>
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <strong className="text-white">2D Engineering Drawing</strong>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <div>Drawing: <span className="text-rose-400">{`DWG-${product.partNumber}.PDF`}</span></div>
                <div>Format: <span>PDF (Vector B-Size Drawing)</span></div>
                <div>Revision: <span>{inspectedRevId}</span></div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadCadVaultFile({ part: product, fileType: 'pdf', logAction })}
                  className="btn-secondary btn-sm flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download Drawing PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: BOM ================= */}
      {activeTab === 'bom' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Bill of Materials (BOM) — Revision {inspectedRevId}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hierarchical multi-level engineering BOM snapshot for {product.partNumber}.
              </p>
            </div>

            <button
              onClick={() => {
                onSelectPart(product.id);
                onNavigateTab('bom');
              }}
              className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open in BOM Explorer</span>
            </button>
          </div>

          {bomComponents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No component items staged for this revision snapshot.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'bg-[#0D1628] text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3">Part Number</th>
                    <th className="py-2.5 px-3">Component Description</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3 text-right">Est. Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {bomComponents.map((comp, idx) => (
                    <tr key={comp.id || idx}>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{comp.partNumber}</td>
                      <td className="py-2.5 px-3 text-slate-200">{comp.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{comp.quantity}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{comp.unit || 'pcs'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{comp.material || 'Standard'}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-emerald-400">${comp.unitCost?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: ENGINEERING CHANGES ================= */}
      {activeTab === 'changes' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Engineering Change Orders &amp; Requests (ECR / ECN)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active and historic change orders linked to {product.partNumber}.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('eco')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open ECO Module</span>
            </button>
          </div>

          {productEcrs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No engineering change orders currently pending against {product.partNumber}.
            </div>
          ) : (
            <div className="space-y-2">
              {productEcrs.map(ecr => (
                <div 
                  key={ecr.id}
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-cyan-400">{ecr.id}</span>
                      <span className="font-bold text-slate-200">{ecr.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {ecr.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{ecr.description}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{ecr.dateCreated}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 7: DFMEA / RISK ================= */}
      {activeTab === 'dfmea' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Design Failure Mode and Effects Analysis (DFMEA)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Parametric failure modes and risk assessment for {product.partNumber}.
              </p>
            </div>
            <button onClick={() => onNavigateTab('dfmea')} className="btn-secondary btn-sm text-xs">
              Open DFMEA Manager
            </button>
          </div>

          {productDfmeas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No DFMEA risk rows mapped to {product.partNumber}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'bg-[#0D1628] text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2 px-3">System / Component</th>
                    <th className="py-2 px-3">Potential Failure Mode</th>
                    <th className="py-2 px-3">Severity</th>
                    <th className="py-2 px-3">Occurrence</th>
                    <th className="py-2 px-3">Detection</th>
                    <th className="py-2 px-3 text-right">RPN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {productDfmeas.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{row.component || row.system}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.potentialFailureMode}</td>
                      <td className="py-2.5 px-3 font-mono text-center">{row.severity}</td>
                      <td className="py-2.5 px-3 font-mono text-center">{row.occurrence}</td>
                      <td className="py-2.5 px-3 font-mono text-center">{row.detection}</td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-amber-400">{row.rpn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 8: DESIGN REVIEW ================= */}
      {activeTab === 'review' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Stage-Gate Design Reviews &amp; Peer Approvals
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review gates, signoffs, and release criteria for {product.partNumber} ({inspectedRevId}).
              </p>
            </div>
            <button onClick={() => onNavigateTab('gates')} className="btn-secondary btn-sm text-xs">
              Open Stage Gates
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <strong className="text-white">Gate 01: Concept Architecture</strong>
              </div>
              <p className="text-slate-400 text-[11px]">Approved by Alex Rivera, Lead Design Engineer</p>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-block">
                PASSED / SIGNED OFF
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <strong className="text-white">Gate 02: Detailed Engineering Review</strong>
              </div>
              <p className="text-slate-400 text-[11px]">Pending tolerance stackup and FEA validation</p>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-block">
                IN PROGRESS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 9: MANUFACTURING ================= */}
      {activeTab === 'mfg' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Manufacturing &amp; CAPP Process Planning
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Process routing, machine tooling, and work instructions for {product.partNumber}.
              </p>
            </div>
            <button onClick={() => onNavigateTab('capp')} className="btn-secondary btn-sm text-xs">
              Open CAPP Module
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <strong className="text-slate-200 block">Op 10: 5-Axis CNC Roughing &amp; Pocketing</strong>
                <span className="text-[11px] text-slate-400">Machine: DMG MORI DMU 50 &bull; Standard cycle time: 14.5 min</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                ROUTED
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <strong className="text-slate-200 block">Op 20: Hard Anodize Coating MIL-A-8625 Type III</strong>
                <span className="text-[11px] text-slate-400">Surface treatment: 50 micron clear anodize &bull; Outside supplier</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-500/30">
                ROUTED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 10: QUALITY ================= */}
      {activeTab === 'quality' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                Quality Management &amp; Non-Conformance Records (NCR)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quality inspection reports, CMM measurements, and active NCRs for {product.partNumber}.
              </p>
            </div>
            <button onClick={() => onNavigateTab('quality')} className="btn-secondary btn-sm text-xs">
              Open Quality Module
            </button>
          </div>

          {productNcrs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No quality non-conformances reported for {product.partNumber}. Quality compliance: 100%.
            </div>
          ) : (
            <div className="space-y-2">
              {productNcrs.map(ncr => (
                <div 
                  key={ncr.id}
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-rose-400">{ncr.ncrNumber}</span>
                      <strong className="text-slate-200">{ncr.title}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {ncr.severity}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">Status: {ncr.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 11: AUDIT HISTORY ================= */}
      {activeTab === 'audit' && (
        <div className={`rounded-2xl p-6 border shadow-sm space-y-4 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b pb-3 border-slate-700/30">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
              Enterprise Audit Trail &amp; Activity Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically verified audit trail for product {product.partNumber} and all revisions.
            </p>
          </div>

          {productAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {productAuditLogs.map((log, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-cyan-400">{log.action}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-300 font-medium">{log.user}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{log.details}</p>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {isCompareModalOpen && (
        <RevisionCompareModal
          product={product}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          documents={documents}
          bomTrees={bomTrees}
          initialRevA={product.revisionHistory?.[1]?.revId || product.revisionHistory?.[0]?.revId}
          initialRevB={inspectedRevId}
        />
      )}

      {isCreateRevModalOpen && (
        <CreateRevisionModal
          product={product}
          isOpen={isCreateRevModalOpen}
          onClose={() => setIsCreateRevModalOpen(false)}
          currentUser={currentUser}
          existingBom={rootBOM}
          documents={documents}
          logAction={logAction}
          onRevisionCreated={(updatedProduct, newDocs, updatedBOM) => {
            setAllProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            if (newDocs.length > 0) {
              setDocuments(prev => [...newDocs, ...prev]);
            }
            if (updatedBOM) {
              setBomTrees(prev => ({
                ...prev,
                [updatedProduct.id]: updatedBOM
              }));
            }
            setInspectedRevId(updatedProduct.currentRev);
          }}
        />
      )}

      {cadPreviewPart && (
        <CadPreviewModal
          part={cadPreviewPart}
          isOpen={true}
          onClose={() => setCadPreviewPart(null)}
          logAction={logAction}
        />
      )}

      {viewingDoc && (
        <DocumentViewerModal
          isOpen={true}
          document={viewingDoc}
          part={product}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};
