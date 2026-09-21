import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2,
  Loader2,
  FolderLock,
  Trash2
} from 'lucide-react';
import type { EngineeringDocument, PartItem } from '../types/plm';
import type { UserAccount } from '../data/mockUsers';
import { DocumentViewerModal } from './DocumentViewerModal';
import { EngineeringDrawingModal } from './EngineeringDrawingModal';
import { generateEngineeringDrawingPdf } from '../utils/engineeringDrawingPdf';
import { useTheme } from '../context/ThemeContext';

interface DocumentVaultProps {
  documents: EngineeringDocument[];
  partsMap: Record<string, PartItem>;
  onAddDocument: (doc: EngineeringDocument) => void;
  onDeleteDocument?: (docId: string) => void;
  currentUser?: UserAccount;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  partsMap,
  onDeleteDocument,
  currentUser
}) => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewingDoc, setViewingDoc] = useState<{ doc: EngineeringDocument; part?: PartItem } | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDownloadDocPdf = async (doc: EngineeringDocument, part: PartItem) => {
    try {
      setDownloadingDocId(doc.id);

      if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
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
        link.download = doc.title.includes('.') ? doc.title : `${doc.docNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        return;
      }

      const { blob, filename } = await generateEngineeringDrawingPdf({
        part,
        revision: doc.revision || part.currentRev,
        authorName: doc.author
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
    } catch (err) {
      console.error('Failed to download drawing PDF:', err);
    } finally {
      setDownloadingDocId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
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
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Centralized Engineering Document Vault
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Secure repository for 2D Drawings, DFMEA risk models, inspection reports, and ISO compliance specs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
            <input
              type="text"
              placeholder="Search Doc, Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="plm-input text-xs pl-9 pr-3 py-1.5 w-full"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="plm-select text-xs py-1.5"
          >
            <option value="All">All Types</option>
            <option value="3D CAD Model">3D CAD Model</option>
            <option value="2D Drawing PDF">2D Drawing PDF</option>
            <option value="Technical Specification">Technical Specification</option>
            <option value="DFMEA">DFMEA</option>
            <option value="Inspection Plan">Inspection Plan</option>
            <option value="RoHS/REACH Cert">RoHS/REACH Cert</option>
            <option value="Statement of Work">Statement of Work</option>
          </select>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const linkedPart = partsMap[doc.linkedPartId] || Object.values(partsMap)[0];
          const isDownloading = downloadingDocId === doc.id;

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
                    {doc.revision}
                  </span>
                </div>

                <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{doc.title}</h3>
                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Linked Part: {linkedPart?.partNumber || doc.linkedPartId}
                </p>
              </div>

              <div className={`border-t pt-3 flex items-center justify-between text-xs ${
                isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
              }`}>
                <span className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>{doc.type}</span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewingDoc({ doc, part: linkedPart })}
                    className="btn-secondary btn-sm"
                    title={`View ${doc.title}`}
                  >
                    <Eye className="w-3 h-3 text-cyan-500" />
                    <span>View</span>
                  </button>

                  <button
                    disabled={isDownloading}
                    onClick={() => handleDownloadDocPdf(doc, linkedPart)}
                    className="btn-secondary btn-sm disabled:opacity-50"
                    title="Download PDF Engineering Drawing"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                    ) : (
                      <Download className="w-3 h-3 text-purple-500" />
                    )}
                    <span>PDF</span>
                  </button>

                  {onDeleteDocument && (currentUser?.systemRole === 'ADMIN' || currentUser?.role === 'PLM Administrator') && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Permanently delete document "${doc.title}" (${doc.docNumber}) from MongoDB database?`)) {
                          onDeleteDocument(doc.id || doc.docNumber);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
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

      {/* Dynamic File Viewer Modal based on file type and content */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc.doc}
          part={viewingDoc.part}
        />
      )}
    </div>
  );
};

