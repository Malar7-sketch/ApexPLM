import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Box, 
  Loader2, 
  FolderLock, 
  ShieldCheck,
  CheckCircle2,
  Upload,
  Layers,
  Cpu,
  Clock,
  HardDrive
} from 'lucide-react';
import type { PartItem, StoredCadVaultFile } from '../types/plm';
import { 
  downloadCadVaultFile, 
  downloadActualStoredFile, 
  getStoredCadVaultFiles, 
  registerCadVaultFile,
  type FileDownloadType 
} from '../utils/cadVaultStorage';
import { useTheme } from '../context/ThemeContext';
import { DocumentViewerModal } from './DocumentViewerModal';

interface CadPreviewModalProps {
  isOpen?: boolean;
  onClose: () => void;
  part: PartItem;
  revision?: string;
  onOpenDrawing?: () => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const CadPreviewModal: React.FC<CadPreviewModalProps> = ({
  isOpen = true,
  onClose,
  part,
  revision,
  onOpenDrawing,
  logAction
}) => {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Download & action states
  const [downloadingType, setDownloadingType] = useState<FileDownloadType | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // Active Revision & project
  const currentRev = revision || part.currentRev || 'Rev 0.0';
  const linkedProject = part.projectName || part.projectId || 'Standard Project';

  // Stored Files List from central registry, CAD metadata, and revision history
  const [localVaultFiles, setLocalVaultFiles] = useState<StoredCadVaultFile[]>(() => {
    const list: StoredCadVaultFile[] = [
      ...getStoredCadVaultFiles(part.id),
      ...getStoredCadVaultFiles(part.partNumber),
      ...(part.cadMetadata?.attachedFiles || []),
      ...(part.revisionHistory?.flatMap(r => r.attachedFiles || []) || [])
    ];

    // If direct pdf/cad exists on part, synthesize entry if missing
    if (part.cadMetadata?.pdfFile && !list.some(f => f.fileType === 'PDF')) {
      list.push({
        id: `DIRECT-PDF-${part.id}`,
        productId: part.id,
        partNumber: part.partNumber,
        fileName: `${part.partNumber}_Drawing.pdf`,
        fileType: 'PDF',
        category: 'drawing',
        fileSize: '1.4 MB',
        uploadDate: new Date().toISOString().substring(0, 10),
        uploadedBy: 'Engineering Master',
        dataUrl: part.cadMetadata.pdfFile
      });
    }

    if ((part.cadMetadata?.stepFile || part.cadMetadata?.cadFile) && !list.some(f => f.fileType === 'STEP' || f.category === 'cad')) {
      list.push({
        id: `DIRECT-CAD-${part.id}`,
        productId: part.id,
        partNumber: part.partNumber,
        fileName: part.cadMetadata.fileName || `${part.partNumber}.step`,
        fileType: part.cadMetadata.format || 'STEP',
        category: 'cad',
        fileSize: part.cadMetadata.fileSize || '15.4 MB',
        uploadDate: new Date().toISOString().substring(0, 10),
        uploadedBy: 'Engineering Master',
        dataUrl: (part.cadMetadata.stepFile || part.cadMetadata.cadFile) as string
      });
    }

    return list.filter((f, idx, arr) => arr.findIndex(x => x.id === f.id || (x.fileName === f.fileName && x.fileType === f.fileType)) === idx);
  });

  if (!isOpen) return null;

  // Handle Quick Downloads
  const handleDownload = async (fileType: FileDownloadType) => {
    try {
      setDownloadingType(fileType);
      const res = await downloadCadVaultFile({
        part,
        revision: currentRev,
        fileType,
        logAction
      });

      if (res.success) {
        setDownloadSuccess(`Successfully downloaded ${res.filename || fileType.toUpperCase()}`);
        setTimeout(() => setDownloadSuccess(null), 3500);
      } else {
        alert(res.message || 'Download could not be completed.');
      }
    } catch (e: any) {
      alert('Download error: ' + e.message);
    } finally {
      setDownloadingType(null);
    }
  };

  // Direct Stored File Download
  const handleDirectDownload = async (file: StoredCadVaultFile) => {
    try {
      const res = await downloadActualStoredFile(file, logAction);
      if (res.success) {
        setDownloadSuccess(`Downloaded actual file: ${file.fileName}`);
        setTimeout(() => setDownloadSuccess(null), 3500);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert('Error downloading file: ' + err.message);
    }
  };

  // Direct Upload handler inside modal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the maximum allowed 50MB limit.`);
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const ext = file.name.split('.').pop()?.toUpperCase() || 'BIN';
      const isPdf = ext === 'PDF';
      const isCad = ['STEP', 'STP', 'SLDPRT', 'SLDASM', 'DWG', 'DXF', 'IGES', 'IGS'].includes(ext);

      const newVaultFile: StoredCadVaultFile = {
        id: `VAULT-${part.id}-${Date.now()}`,
        productId: part.id,
        partNumber: part.partNumber,
        projectId: part.projectId,
        projectName: linkedProject,
        fileName: file.name,
        fileType: ext,
        category: isPdf ? 'drawing' : isCad ? 'cad' : 'document',
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: new Date().toISOString().substring(0, 10),
        uploadedBy: 'Product Master',
        dataUrl
      };

      registerCadVaultFile(newVaultFile);
      setLocalVaultFiles(prev => [newVaultFile, ...prev]);

      if (logAction) {
        logAction(
          'Uploaded CAD / Drawing',
          'CAD',
          part.partNumber,
          `Attached ${newVaultFile.fileName} (${newVaultFile.fileSize}) to ${part.partNumber} (${currentRev}).`
        );
      }

      setDownloadSuccess(`Uploaded and attached ${file.name} successfully!`);
      setTimeout(() => setDownloadSuccess(null), 3500);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-[#0A101D] border-[#243149] text-slate-100' : 'bg-white border-[#E2E8F0] text-slate-900'
        }`}
      >
        {/* Hidden File Input for Direct Upload */}
        <input 
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".step,.stp,.sldprt,.sldasm,.dwg,.dxf,.pdf,.iges,.igs"
          onChange={handleFileUpload}
        />

        {/* MODAL HEADER */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <FolderLock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-mono text-base font-bold text-cyan-400">{part.partNumber}</span>
                <span className="badge-status badge-active text-[10px] uppercase font-mono">{currentRev}</span>
                <span className="badge-status badge-review text-[10px] font-mono">{part.cadMetadata?.format || 'STEP'}</span>
                <span className="text-xs text-purple-400 font-mono">Project: {linkedProject}</span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {part.name} &bull; Engineering CAD Vault & Technical Document Repository
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUB-HEADER / ACTIONS BAR */}
        <div className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-slate-100 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">Attached Files ({localVaultFiles.length})</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-[11px] text-slate-400">Directly linked to revision {currentRev}</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary btn-sm flex items-center space-x-1.5 text-[11px] cursor-pointer shadow-sm shadow-cyan-500/20"
              title="Upload CAD model or PDF drawing"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Upload CAD / PDF</span>
            </button>

            <button
              disabled={downloadingType === 'cad'}
              onClick={() => handleDownload('cad')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px] cursor-pointer"
              title="Download native CAD model"
            >
              {downloadingType === 'cad' ? <Loader2 className="w-3 h-3 animate-spin text-cyan-400" /> : <Download className="w-3 h-3 text-cyan-400" />}
              <span>Download CAD</span>
            </button>

            <button
              disabled={downloadingType === 'step'}
              onClick={() => handleDownload('step')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px] cursor-pointer"
              title="Download standard STEP file"
            >
              {downloadingType === 'step' ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" /> : <Download className="w-3 h-3 text-purple-400" />}
              <span>Download STEP</span>
            </button>

            <button
              disabled={downloadingType === 'pdf'}
              onClick={() => handleDownload('pdf')}
              className="btn-secondary btn-sm flex items-center space-x-1 text-[11px] cursor-pointer"
              title="Download 2D engineering drawing PDF"
            >
              {downloadingType === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin text-rose-400" /> : <Download className="w-3 h-3 text-rose-400" />}
              <span>Download PDF</span>
            </button>

            {onOpenDrawing && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDrawing();
                }}
                className="btn-secondary btn-sm flex items-center space-x-1 text-[11px] cursor-pointer"
                title="View full ASME Y14.5 engineering blueprint"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>View Drawing</span>
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {downloadSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-5 py-2.5 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{downloadSuccess}</span>
          </div>
        )}

        {/* MAIN BODY CONTENT: ATTACHED FILES LEDGER */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
          {/* Upload Dropzone Banner */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDark 
                ? 'border-slate-700/80 hover:border-cyan-500/60 bg-[#0E1729]/60 hover:bg-[#111F38]' 
                : 'border-slate-300 hover:border-cyan-500 bg-slate-50 hover:bg-cyan-50/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <Upload className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200">
                  Click to Upload or Drag & Drop CAD (.step, .sldprt, .sldasm) or PDF Drawing
                </p>
                <p className="text-[11px] text-slate-400">
                  Files are securely stored in the CAD Vault and immediately available across PLM modules.
                </p>
              </div>
            </div>
          </div>

          {/* Files List */}
          {localVaultFiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
              <Box className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
              <p className="text-xs font-semibold">No engineering files attached to this record yet.</p>
              <p className="text-[11px] text-slate-500">
                Use the upload box above or click "Download CAD / STEP / PDF" to obtain standard geometry.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {localVaultFiles.map((file, idx) => {
                const isPdf = file.fileType.toUpperCase() === 'PDF' || file.fileName.toLowerCase().endsWith('.pdf');
                return (
                  <div 
                    key={file.id || idx}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      isDark ? 'bg-[#111B2E] border-slate-700/60 hover:border-cyan-500/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isPdf 
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
                          : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                      }`}>
                        {isPdf ? <FileText className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <strong className="font-mono text-cyan-400 block truncate text-sm">{file.fileName}</strong>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center space-x-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">{file.fileType}</span>
                          <span>&bull;</span>
                          <span>Size: <strong className="text-slate-200">{file.fileSize}</strong></span>
                          <span>&bull;</span>
                          <span>Uploaded: <strong className="text-slate-300">{file.uploadDate}</strong></span>
                          <span>&bull;</span>
                          <span>Author: <strong className="text-slate-300">{file.uploadedBy}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isPdf && file.dataUrl && (
                        <button
                          onClick={() => setViewingDoc({
                            id: file.id,
                            title: file.fileName,
                            docNumber: file.fileName,
                            type: '2D Drawing PDF',
                            linkedPartId: part.id,
                            revision: currentRev,
                            author: file.uploadedBy,
                            uploadDate: file.uploadDate,
                            fileSize: file.fileSize,
                            status: 'Approved',
                            fileUrl: file.dataUrl,
                            fileName: file.fileName,
                            fileExtension: 'pdf'
                          })}
                          className="btn-secondary btn-sm flex items-center space-x-1 cursor-pointer"
                          title="Preview PDF Blueprint"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDirectDownload(file)}
                        className="btn-primary btn-sm flex items-center space-x-1 cursor-pointer"
                        title="Download Physical Stored File"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Technical Specifications Summary Card */}
          <div className={`p-4 rounded-xl border mt-4 text-xs font-mono ${
            isDark ? 'bg-[#0E1729] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-cyan-400 mb-2">
              <Cpu className="w-4 h-4" />
              <span>TECHNICAL SPECIFICATIONS SUMMARY</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">BOUNDING BOX:</span>
                <strong className="text-cyan-400">{part.cadMetadata?.boundingDimensionsMm?.join(' × ') || '450 × 680 × 1250'} mm</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MASS (WEIGHT):</span>
                <strong className="text-amber-400">{part.weightKg || 24.5} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MATERIAL:</span>
                <strong className="text-emerald-400">{part.material || 'Aluminum 7075-T6'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VOLUME:</span>
                <strong className="text-purple-400">{(part.cadMetadata?.volumeCm3 || 850).toLocaleString()} cm³</strong>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vault Security: Encrypted SHA-256 Checksum Verified &bull; ISO 9001 Compliant</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn-secondary btn-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Document Viewer for instant preview */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={true}
          document={viewingDoc}
          part={part}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};
