import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2,
  Loader2,
  FolderLock,
  Trash2,
  Upload,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  FileCheck2,
  Box,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import type { EngineeringDocument, PartItem } from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { DocumentViewerModal } from './DocumentViewerModal';
import { useTheme } from '../context/ThemeContext';

interface DocumentVaultProps {
  documents: EngineeringDocument[];
  partsMap: Record<string, PartItem>;
  onAddDocument: (doc: EngineeringDocument) => void;
  onDeleteDocument?: (docId: string) => void;
  onRefreshDocuments?: () => Promise<void>;
  currentUser?: UserAccount;
  onNavigateTab?: (tab: string) => void;
  onSelectPart?: (partId: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  partsMap,
  onAddDocument,
  onDeleteDocument,
  onRefreshDocuments,
  currentUser,
  onNavigateTab,
  onSelectPart
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [revisionFilter, setRevisionFilter] = useState('All');
  const [viewingDoc, setViewingDoc] = useState<{ doc: EngineeringDocument; part?: PartItem } | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadType, setUploadType] = useState('2D Drawing PDF');
  const [uploadLinkedPart, setUploadLinkedPart] = useState('');
  const [uploadRevision, setUploadRevision] = useState('A.1');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Extract available types, products, and revisions for filtering
  const availableTypes = Array.from(new Set(documents.map(d => d.type).filter(Boolean)));
  const availableProducts = Array.from(new Set(documents.map(d => {
    if (!d.linkedPartId) return null;
    const p = partsMap[d.linkedPartId];
    return p ? p.partNumber : d.linkedPartId;
  }).filter(Boolean))) as string[];
  const availableRevisions = Array.from(new Set(documents.map(d => d.revision).filter(Boolean)));

  const filteredDocs = documents.filter((doc) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      doc.title.toLowerCase().includes(s) ||
      doc.docNumber.toLowerCase().includes(s) ||
      (doc.author && doc.author.toLowerCase().includes(s)) ||
      (doc.linkedPartId && doc.linkedPartId.toLowerCase().includes(s)) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(s));
    
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    
    const linkedP = doc.linkedPartId ? partsMap[doc.linkedPartId] : undefined;
    const docPartNum = linkedP ? linkedP.partNumber : doc.linkedPartId;
    const matchesProduct = productFilter === 'All' || docPartNum === productFilter || doc.linkedPartId === productFilter;
    
    const matchesRevision = revisionFilter === 'All' || doc.revision === revisionFilter;

    return matchesSearch && matchesType && matchesProduct && matchesRevision;
  });

  const handleRefresh = async () => {
    if (onRefreshDocuments) {
      setIsRefreshing(true);
      try {
        await onRefreshDocuments();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Handle file selection in Upload Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds the 50 MB limit. Please select a smaller file.');
      return;
    }

    setUploadError(null);
    setUploadFile(file);
    setUploadTitle(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    
    // Auto-detect document type from extension
    if (ext === 'pdf') {
      setUploadType('2D Drawing PDF');
      setUploadDocNumber(`DWG-${randomSuffix}`);
    } else if (['step', 'stp', 'sldprt', 'sldasm', 'dwg', 'dxf', 'iges', 'igs', 'stl'].includes(ext)) {
      setUploadType('3D CAD Model');
      setUploadDocNumber(`CAD-${randomSuffix}`);
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      setUploadType('DFMEA');
      setUploadDocNumber(`DFMEA-${randomSuffix}`);
    } else if (['docx', 'doc'].includes(ext)) {
      setUploadType('Technical Specification');
      setUploadDocNumber(`SPEC-${randomSuffix}`);
    } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
      setUploadType('Inspection Plan');
      setUploadDocNumber(`INSP-${randomSuffix}`);
    } else {
      setUploadType('Technical Specification');
      setUploadDocNumber(`DOC-${randomSuffix}`);
    }
  };

  // Submit actual uploaded file to vault
  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const ext = uploadFile.name.split('.').pop()?.toLowerCase() || '';
    const fileSizeFormatted = uploadFile.size >= 1024 * 1024 
      ? (uploadFile.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (uploadFile.size / 1024).toFixed(1) + ' KB';

    const reader = new FileReader();

    reader.onload = () => {
      const fileDataUrl = reader.result as string;

      const newDoc: EngineeringDocument = {
        id: `DOC-${Date.now()}`,
        docNumber: uploadDocNumber.trim() || `DOC-${Date.now().toString().slice(-4)}`,
        title: uploadTitle.trim() || uploadFile.name,
        type: uploadType as any,
        linkedPartId: uploadLinkedPart || '',
        revision: uploadRevision.trim() || 'A.1',
        author: currentUser?.name || 'Engineering Author',
        uploadDate: new Date().toISOString().substring(0, 10),
        fileSize: fileSizeFormatted,
        status: 'Approved',
        fileUrl: fileDataUrl,
        fileName: uploadFile.name,
        fileExtension: ext,
        category: (ext === 'pdf' ? 'pdf' : ['xlsx', 'xls', 'csv'].includes(ext) ? 'fmea' : ['step', 'stp', 'sldprt'].includes(ext) ? 'cad' : 'doc') as any,
        description: uploadDescription.trim() || `Uploaded ${uploadFile.name}`
      };

      onAddDocument(newDoc);
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDocNumber('');
      setUploadDescription('');
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadError('Failed to read the file. Please try again.');
    };

    reader.readAsDataURL(uploadFile);
  };

  // Download exact original file
  const handleDownloadDoc = (doc: EngineeringDocument) => {
    if (!doc.fileUrl) {
      alert('No physical file data is associated with this document record.');
      return;
    }

    try {
      setDownloadingDocId(doc.id);

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
      alert('Failed to initiate download for this document.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl text-purple-500 border ${
            isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                Centralized Engineering Document Vault
              </h2>
              {onRefreshDocuments && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-1.5 rounded-lg border text-slate-400 hover:text-white transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Refresh from MongoDB database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Secure repository for 2D Drawings, DFMEA risk models, inspection reports, and ISO compliance specs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-60">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search Doc, Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input text-xs pl-9 pr-3 py-1.5 w-full"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="All">All Types ({documents.length})</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Product Filter */}
          {availableProducts.length > 0 && (
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="plm-select text-xs py-1.5 font-mono"
            >
              <option value="All">All Products</option>
              {availableProducts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}

          {/* Revision Filter */}
          {availableRevisions.length > 0 && (
            <select
              value={revisionFilter}
              onChange={(e) => setRevisionFilter(e.target.value)}
              className="plm-select text-xs py-1.5 font-mono"
            >
              <option value="All">All Revisions</option>
              {availableRevisions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {/* Upload Document Action Button */}
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="btn-primary btn-sm flex items-center space-x-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Grid of Documents or Empty State */}
      {documents.length === 0 ? (
        <div className={`text-center py-20 px-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center space-y-4 transition-colors ${
          isDark ? 'bg-[#111B2E]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FolderLock className="w-10 h-10" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No engineering documents uploaded yet
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              No engineering documents uploaded yet. Upload a drawing or engineering document to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="btn-primary btn-md flex items-center space-x-2 text-xs font-bold shadow-md cursor-pointer mt-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className={`text-center py-16 px-6 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#111B2E]/50 border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <p className="text-xs text-slate-400">
            No engineering documents match your search &quot;{searchTerm}&quot; or filter &quot;{typeFilter}&quot;.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setTypeFilter('All'); }}
            className="btn-secondary btn-sm mt-3 text-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const linkedPart = doc.linkedPartId ? partsMap[doc.linkedPartId] : undefined;
            const isDownloading = downloadingDocId === doc.id;
            const ext = doc.fileExtension || doc.fileName?.split('.').pop() || (doc.type === '2D Drawing PDF' ? 'pdf' : 'doc');

            return (
              <div
                key={doc.id}
                className={`rounded-[14px] p-5 border shadow-sm space-y-4 transition-all flex flex-col justify-between ${
                  isDark ? 'bg-[#111B2E] border-[#243149] hover:border-purple-500/50' : 'bg-white border-[#E2E8F0] hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-purple-500">
                      {doc.docNumber}
                    </span>
                    <span className="badge-status badge-active text-[10px]">
                      {doc.revision || 'Not specified'}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold leading-snug line-clamp-2 ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
                    {doc.title}
                  </h3>
                  
                  <div className="mt-2 space-y-0.5 text-xs font-mono">
                    <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                      Linked Part:{' '}
                      {linkedPart && onNavigateTab && onSelectPart ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPart(linkedPart.id);
                            onNavigateTab('products');
                          }}
                          className="font-bold text-cyan-400 hover:underline cursor-pointer inline-flex items-center space-x-1"
                          title="Open in Product Master"
                        >
                          <span>{linkedPart.partNumber} ({linkedPart.name})</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" />
                        </button>
                      ) : (
                        <strong className={linkedPart ? 'text-cyan-400' : 'text-slate-400'}>
                          {linkedPart ? `${linkedPart.partNumber} (${linkedPart.name})` : doc.linkedPartId || 'Not specified'}
                        </strong>
                      )}
                    </p>
                    {doc.fileSize && (
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Size: {doc.fileSize} &bull; Uploaded: {doc.uploadDate || 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`border-t pt-3 flex items-center justify-between text-xs ${
                  isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
                }`}>
                  <span className={`text-[11px] font-medium truncate max-w-[130px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`} title={doc.type}>
                    {doc.type}
                  </span>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingDoc({ doc, part: linkedPart })}
                      className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
                      title={`View ${doc.title}`}
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-500" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownloadDoc(doc)}
                      className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                      title={`Download actual file (${doc.fileName || doc.title})`}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-purple-500" />
                      )}
                      <span>Download</span>
                    </button>

                    {onDeleteDocument && (currentUser?.systemRole === 'ADMIN' || currentUser?.role === 'PLM Administrator') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Permanently delete document "${doc.title}" (${doc.docNumber}) from MongoDB database?`)) {
                            onDeleteDocument(doc.id || doc.docNumber);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Delete Document (Admin Only)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic File Viewer Modal (Displays genuine file content) */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc.doc}
          part={viewingDoc.part}
        />
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 ${
            isDark ? 'bg-[#0E1726] border-[#243149] text-white' : 'bg-white border-[#E2E8F0] text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Upload Engineering Document</h3>
                  <p className="text-xs text-slate-400">Securely store file and register metadata in database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
              {/* File Dropzone */}
              <div>
                <label className="block font-semibold mb-1.5">Select Physical File</label>
                <div className={`p-4 border-2 border-dashed rounded-xl text-center transition-colors ${
                  uploadFile 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : isDark ? 'border-slate-700 hover:border-purple-500/50 bg-slate-900/40' : 'border-slate-300 hover:border-purple-400 bg-slate-50'
                }`}>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.step,.stp,.sldprt,.sldasm,.dwg,.dxf,.docx,.doc,.xlsx,.xls,.csv,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer"
                  />
                  {uploadFile ? (
                    <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">
                      Supports PDF, STEP, CAD, XLSX, DOCX, PNG, JPG (up to 50 MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block font-semibold mb-1">Document Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Planetary Gearbox 2D Assembly Drawing.pdf"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="plm-input text-xs w-full py-2"
                />
              </div>

              {/* Grid: Doc Number & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DWG-1001"
                    value={uploadDocNumber}
                    onChange={(e) => setUploadDocNumber(e.target.value)}
                    className="plm-input text-xs w-full py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Document Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="plm-select text-xs w-full py-2"
                  >
                    <option value="2D Drawing PDF">2D Drawing PDF</option>
                    <option value="3D CAD Model">3D CAD Model</option>
                    <option value="DFMEA">DFMEA</option>
                    <option value="PFMEA">PFMEA</option>
                    <option value="Technical Specification">Technical Specification</option>
                    <option value="Inspection Plan">Inspection Plan</option>
                    <option value="RoHS/REACH Cert">RoHS/REACH Cert</option>
                    <option value="Statement of Work">Statement of Work</option>
                    <option value="Test Report">Test Report</option>
                  </select>
                </div>
              </div>

              {/* Grid: Linked Part & Revision */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Linked Part (Optional)</label>
                  <select
                    value={uploadLinkedPart}
                    onChange={(e) => setUploadLinkedPart(e.target.value)}
                    className="plm-select text-xs w-full py-2"
                  >
                    <option value="">Unlinked / General</option>
                    {Object.values(partsMap).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partNumber} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Revision</label>
                  <input
                    type="text"
                    value={uploadRevision}
                    onChange={(e) => setUploadRevision(e.target.value)}
                    placeholder="A.1"
                    className="plm-input text-xs w-full py-2 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes, manufacturing standards, or compliance remarks..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="plm-input text-xs w-full py-2 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-700/30">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary btn-sm cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Storing File...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload &amp; Save to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
