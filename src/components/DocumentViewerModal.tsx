import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Box,
  Eye,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  FolderLock,
  Layers,
  FileCode,
  Calendar,
  User,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { EngineeringDocument, PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EngineeringDocument;
  part?: PartItem;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  part
}) => {
  const { isDark } = useTheme();

  // Determine file extension
  const getFileExtension = (): string => {
    if (doc.fileExtension) return doc.fileExtension.toLowerCase().replace('.', '');
    if (doc.fileName && doc.fileName.includes('.')) {
      return doc.fileName.split('.').pop()?.toLowerCase() || '';
    }
    if (doc.title && doc.title.includes('.')) {
      return doc.title.split('.').pop()?.toLowerCase() || '';
    }
    if (doc.type === '2D Drawing PDF') return 'pdf';
    if (doc.type === '3D CAD Model') return 'step';
    if (doc.type === 'DFMEA' || doc.type === 'PFMEA') return 'xlsx';
    if (doc.type === 'Technical Specification' || doc.type === 'Statement of Work') return 'docx';
    return 'bin';
  };

  const ext = getFileExtension();

  // Viewer states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [parsedSheets, setParsedSheets] = useState<Record<string, any[][]>>({});
  const [textContent, setTextContent] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Parse file content when modal opens or document changes
  useEffect(() => {
    setParseError(null);
    setTextContent(null);
    setSheetNames([]);
    setParsedSheets({});
    setActiveSheet('');
    setZoomLevel(100);

    if (!doc.fileUrl) {
      return;
    }

    // Handle spreadsheet formats
    if (['xlsx', 'xls', 'csv'].includes(ext) || doc.type === 'DFMEA' || doc.type === 'PFMEA') {
      setIsParsing(true);
      try {
        if (doc.fileUrl.startsWith('data:')) {
          const base64Data = doc.fileUrl.split(',')[1];
          if (base64Data) {
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const sheetsMap: Record<string, any[][]> = {};
            workbook.SheetNames.forEach((name) => {
              const worksheet = workbook.Sheets[name];
              const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
              sheetsMap[name] = jsonRows;
            });
            setSheetNames(workbook.SheetNames);
            if (workbook.SheetNames.length > 0) {
              setActiveSheet(workbook.SheetNames[0]);
            }
            setParsedSheets(sheetsMap);
          }
        }
      } catch (err: any) {
        console.warn('Failed to parse spreadsheet in-browser:', err);
        setParseError('Unable to parse workbook data in-browser. Please download the file to view in Microsoft Excel.');
      } finally {
        setIsParsing(false);
      }
      return;
    }

    // Handle plain text formats
    if (['txt', 'json', 'log', 'xml', 'md'].includes(ext)) {
      try {
        if (doc.fileUrl.startsWith('data:')) {
          const base64Data = doc.fileUrl.split(',')[1];
          if (base64Data) {
            const decoded = decodeURIComponent(escape(atob(base64Data)));
            setTextContent(decoded);
          }
        } else {
          setTextContent(doc.content || null);
        }
      } catch (e) {
        setTextContent(doc.content || null);
      }
    }
  }, [doc, ext]);

  if (!isOpen) return null;

  // Direct download handler for the exact attached file
  const handleDownloadOriginalFile = () => {
    if (!doc.fileUrl) {
      alert('No physical file data is associated with this document record.');
      return;
    }

    const downloadFileName = doc.fileName || doc.title || `${doc.docNumber}.${ext}`;

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
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } else {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = downloadFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 1000);
    }
  };

  // Open in new tab handler (for PDF & Images)
  const handleOpenInNewTab = () => {
    if (!doc.fileUrl) return;

    if (doc.fileUrl.startsWith('data:')) {
      const parts = doc.fileUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } else {
      window.open(doc.fileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0E1726] border-[#243149] text-[#F1F5F9]' : 'bg-white border-[#E2E8F0] text-[#172033]'
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-50 border-[#E2E8F0]'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              ext === 'pdf' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
              ['xlsx', 'xls', 'csv'].includes(ext) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
              ['step', 'stp', 'sldprt', 'sldasm', 'dwg'].includes(ext) ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
              'bg-purple-500/10 text-purple-500 border border-purple-500/20'
            }`}>
              {ext === 'pdf' ? <FileText className="w-5 h-5" /> :
               ['xlsx', 'xls', 'csv'].includes(ext) ? <FileSpreadsheet className="w-5 h-5" /> :
               ['step', 'stp', 'sldprt', 'sldasm'].includes(ext) ? <Box className="w-5 h-5" /> :
               <FolderLock className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-purple-500">
                  {doc.docNumber}
                </span>
                <span className="badge-status badge-active text-[10px]">
                  {doc.revision || 'Rev A.1'}
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  {ext.toUpperCase()}
                </span>
                {doc.fileSize && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {doc.fileSize}
                  </span>
                )}
              </div>
              <h2 className={`text-base font-bold truncate mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {doc.title}
              </h2>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {(ext === 'pdf' || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) && doc.fileUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
                title="Open file in separate browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden sm:inline">New Tab</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadOriginalFile}
              className="btn-primary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
              title={`Download actual file (${doc.fileName || doc.title})`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {ext.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-500/20 text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Canvas */}
        <div className="flex-1 flex flex-col min-h-[500px] max-h-[78vh] overflow-hidden relative">
          
          {/* 1. PDF VIEWER (Direct Native Browser Embedded Iframe) */}
          {ext === 'pdf' && (
            <div className="flex-1 flex flex-col w-full h-full min-h-[550px] relative">
              {doc.fileUrl ? (
                <iframe
                  src={doc.fileUrl}
                  title={doc.title}
                  className="w-full h-full min-h-[550px] flex-1 border-0 rounded-b-2xl bg-slate-900"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                  <h3 className="text-sm font-bold">No Physical PDF File Attached</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    This document record does not contain raw PDF binary data in storage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. IMAGE VIEWER */}
          {['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) && (
            <div className="flex-1 flex flex-col">
              {/* Image Controls */}
              <div className={`px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-100 border-[#E2E8F0]'
              }`}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoomLevel(Math.max(40, zoomLevel - 20))}
                    className="p-1 rounded hover:bg-slate-500/20"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs w-12 text-center">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(250, zoomLevel + 20))}
                    className="p-1 rounded hover:bg-slate-500/20"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-0.5 rounded text-[11px] border border-slate-500/20"
                  >
                    Reset
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Original Image Preview
                </div>
              </div>

              <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-950/40">
                {doc.fileUrl ? (
                  <img
                    src={doc.fileUrl}
                    alt={doc.title}
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                    className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xl transition-transform"
                  />
                ) : (
                  <div className="text-slate-400 text-xs">No image data stored.</div>
                )}
              </div>
            </div>
          )}

          {/* 3. SPREADSHEET / EXCEL / DFMEA VIEWER */}
          {(['xlsx', 'xls', 'csv'].includes(ext) || doc.type === 'DFMEA' || doc.type === 'PFMEA') && (
            <div className="flex-1 flex flex-col h-full min-h-[500px]">
              {/* Sheet Navigation Bar if Multiple Sheets */}
              {sheetNames.length > 0 && (
                <div className={`px-4 py-2 border-b flex items-center space-x-2 overflow-x-auto shrink-0 ${
                  isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-slate-100 border-[#E2E8F0]'
                }`}>
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-2">Worksheets:</span>
                  {sheetNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setActiveSheet(name)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        activeSheet === name
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : isDark ? 'text-slate-300 hover:bg-slate-700/40' : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Spreadsheet Content Grid */}
              <div className="flex-1 p-4 sm:p-6 overflow-auto">
                {isParsing ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">Decoding workbook data...</span>
                  </div>
                ) : parseError ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 p-6 max-w-md mx-auto">
                    <Info className="w-10 h-10 text-amber-500" />
                    <h3 className="text-sm font-bold">In-App Spreadsheet Preview Unavailable</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {parseError}
                    </p>
                    <button
                      onClick={handleDownloadOriginalFile}
                      className="btn-primary btn-sm mt-2 flex items-center space-x-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Excel Workbook</span>
                    </button>
                  </div>
                ) : activeSheet && parsedSheets[activeSheet] && parsedSheets[activeSheet].length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-700/50 shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <tbody>
                        {parsedSheets[activeSheet].map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`border-b transition-colors ${
                              rIdx === 0
                                ? isDark ? 'bg-slate-800/90 font-bold text-white' : 'bg-slate-200 font-bold text-slate-900'
                                : isDark ? 'hover:bg-slate-800/40 border-slate-800' : 'hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <td className={`p-2 text-center text-[10px] font-mono border-r select-none ${
                              isDark ? 'bg-slate-900/60 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`p-2.5 border-r font-mono text-[11px] whitespace-pre-wrap ${
                                  isDark ? 'border-slate-800/60 text-slate-200' : 'border-slate-200 text-slate-800'
                                }`}
                              >
                                {cell !== undefined && cell !== null ? String(cell) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 p-6 max-w-md mx-auto">
                    <FileSpreadsheet className="w-12 h-12 text-emerald-500" />
                    <h3 className="text-sm font-bold">Genuine Workbook File Attached</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This {doc.type || 'DFMEA'} document is stored in the vault. Download the file to inspect the complete multi-sheet analysis in Excel.
                    </p>
                    <button
                      onClick={handleDownloadOriginalFile}
                      className="btn-primary btn-sm flex items-center space-x-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {doc.fileName || 'Spreadsheet.xlsx'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. 3D CAD MODEL VIEWER (STEP, SLDPRT, SLDASM, DWG) */}
          {['step', 'stp', 'sldprt', 'sldasm', 'dwg', 'dxf', 'iges', 'igs', 'stl', 'catpart'].includes(ext) && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Box className="w-14 h-14 mx-auto" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                  Parametric 3D CAD Model &bull; B-Rep Assembly
                </span>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                  In-app 3D solid geometry preview is not supported in web browsers for native CAD format <strong className="text-cyan-400">.{ext.toUpperCase()}</strong>. Download the original CAD master to open in SolidWorks, Siemens NX, Autodesk Inventor, or FreeCAD.
                </p>
              </div>

              {/* Genuine Metadata Card */}
              <div className={`w-full p-4 rounded-xl border text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 text-left ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div>
                  <span className="text-slate-500 block text-[10px]">FILE FORMAT</span>
                  <span className="font-bold text-cyan-400">{ext.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
                  <span className="font-bold">{doc.fileSize || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LINKED PART</span>
                  <span className="font-bold text-purple-400">{part?.partNumber || doc.linkedPartId || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">REVISION</span>
                  <span className="font-bold text-emerald-400">{doc.revision || 'A.1'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadOriginalFile}
                className="btn-primary btn-md flex items-center space-x-2 text-xs font-bold shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download CAD Master ({doc.fileName || doc.title})</span>
              </button>
            </div>
          )}

          {/* 5. WORD DOCUMENT VIEWER (DOC, DOCX) */}
          {['doc', 'docx', 'rtf', 'odt'].includes(ext) && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <FileText className="w-14 h-14 mx-auto" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-400 tracking-wider">
                  Technical Engineering Document
                </span>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                  Direct DOCX word processing is not rendered natively in web browsers without external cloud viewers. Download the document to open in Microsoft Word, LibreOffice, or Google Docs.
                </p>
              </div>

              {/* Genuine Metadata Card */}
              <div className={`w-full p-4 rounded-xl border text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-3 text-left ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div>
                  <span className="text-slate-500 block text-[10px]">FORMAT</span>
                  <span className="font-bold text-blue-400">{ext.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
                  <span className="font-bold">{doc.fileSize || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">AUTHOR</span>
                  <span className="font-bold">{doc.author || 'Engineering Author'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">UPLOAD DATE</span>
                  <span className="font-bold">{doc.uploadDate || 'N/A'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadOriginalFile}
                className="btn-primary btn-md flex items-center space-x-2 text-xs font-bold shadow-lg shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Word Document ({doc.fileName || doc.title})</span>
              </button>
            </div>
          )}

          {/* 6. PLAIN TEXT / CODE VIEWER */}
          {['txt', 'json', 'log', 'xml', 'md'].includes(ext) && (
            <div className="flex-1 p-6 overflow-auto bg-slate-950 font-mono text-xs text-slate-200">
              {textContent ? (
                <pre className="whitespace-pre-wrap break-all leading-relaxed">{textContent}</pre>
              ) : (
                <div className="text-center py-10 text-slate-500">No text content available.</div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Status Bar */}
        <div
          className={`px-6 py-3 border-t flex flex-wrap items-center justify-between text-xs font-mono shrink-0 ${
            isDark ? 'bg-[#111B2E] border-[#243149] text-slate-400' : 'bg-slate-50 border-[#E2E8F0] text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span>Author: <strong>{doc.author || 'Author Unspecified'}</strong></span>
            <span>&bull;</span>
            <span>Date: <strong>{doc.uploadDate || 'N/A'}</strong></span>
            <span>&bull;</span>
            <span>Part: <strong>{part?.partNumber || doc.linkedPartId || 'Unlinked'}</strong></span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AUTHENTICATED PLM VAULT ASSET</span>
          </div>
        </div>
      </div>
    </div>
  );
};
