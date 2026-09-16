import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Printer, 
  FileText, 
  Compass, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import type { PartItem, BOMNode } from '../types/plm';
import { generateEngineeringDrawingPdf, getDrawingNumber, sanitizeRevName } from '../utils/engineeringDrawingPdf';
import { getStoredFileForPart, downloadActualStoredFile } from '../utils/cadVaultStorage';
import { useTheme } from '../context/ThemeContext';

interface EngineeringDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartItem;
  revision?: string;
  bomTree?: BOMNode;
  userRole?: string;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const EngineeringDrawingModal: React.FC<EngineeringDrawingModalProps> = ({
  isOpen,
  onClose,
  part,
  revision: userRev,
  bomTree,
  logAction
}) => {
  const { isDark } = useTheme();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeSheet, setActiveSheet] = useState<number>(1);
  const [projectionAngle, setProjectionAngle] = useState<'third' | 'first'>('third');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRev = userRev || part.currentRev || 'A.4';
  const cleanRev = sanitizeRevName(currentRev);
  const drawingNo = getDrawingNumber(part.partNumber);
  const dateStr = new Date().toISOString().split('T')[0];

  // Derive BOM list
  const bomList: { item: number; partNo: string; name: string; qty: number; mat: string }[] = [];
  if (bomTree && bomTree.children && bomTree.children.length > 0) {
    bomTree.children.forEach((child, idx) => {
      bomList.push({
        item: idx + 1,
        partNo: child.partNumber,
        name: child.name,
        qty: child.quantity,
        mat: child.material || 'Standard Alloy'
      });
    });
  } else {
    bomList.push(
      { item: 1, partNo: part.partNumber, name: part.name, qty: 1, mat: part.material },
      { item: 2, partNo: 'PN-FAS-102', name: 'M8x25 Hex Flange Screw ISO 4017', qty: 6, mat: 'Class 10.9 Steel' },
      { item: 3, partNo: 'PN-WSH-08', name: 'M8 Spring Lock Washer DIN 127', qty: 6, mat: 'Spring Steel' },
      { item: 4, partNo: 'PN-BRG-6204', name: 'Deep Groove Ball Bearing 6204-2RS', qty: 2, mat: 'Chrome Steel 52100' }
    );
  }

  // Handle Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      // Check if actual uploaded PDF exists in vault
      const actualPdf = getStoredFileForPart(part, 'pdf');
      if (actualPdf && actualPdf.dataUrl) {
        downloadActualStoredFile(actualPdf);
        if (logAction) {
          logAction(
            'Downloaded PDF Drawing',
            'CAD',
            `${part.partNumber} (Rev ${currentRev})`,
            `File: ${actualPdf.fileName} (Actual Uploaded Vault Document)`
          );
        }
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        return;
      }

      const { blob, filename } = await generateEngineeringDrawingPdf({
        part,
        revision: currentRev,
        bomTree,
        projectionAngle,
        authorName: 'Alex Rivera, PE',
        checkerName: 'Marcus Vance',
        approverName: 'Dr. Elena Rostova'
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

      if (logAction) {
        logAction(
          'Downloaded PDF Drawing',
          'CAD',
          `${part.partNumber} (Rev ${currentRev})`,
          `File: ${filename} | Standard: ASME Y14.5 | Sheet: A3`
        );
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* TOOLBAR CONTROLS */}
      <div className={`border-b px-6 py-3 flex items-center justify-between shadow-md shrink-0 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg text-amber-500 border ${
              isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold flex items-center space-x-2 ${
                isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
              }`}>
                <span>{drawingNo}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded font-bold text-amber-500 border border-amber-500/30">
                  REV {currentRev}
                </span>
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                {part.name} • {part.partNumber}
              </p>
            </div>
          </div>

          <div className={`h-6 w-px ${isDark ? 'bg-[#243149]' : 'bg-[#E2E8F0]'}`} />

          {/* Sheet Selector */}
          <div className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-medium ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setActiveSheet(1)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSheet === 1
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Sheet 1: Views & BOM
            </button>
            <button
              onClick={() => setActiveSheet(2)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSheet === 2
                  ? 'btn-primary btn-sm'
                  : isDark ? 'text-[#94A3B8] hover:text-[#F1F5F9]' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Sheet 2: Specs & GD&T
            </button>
          </div>
        </div>

        {/* Center Projection Angle Selector & Zoom Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-1 border rounded-xl px-3 py-1.5 ${
            isDark ? 'bg-[#0D1628] border-[#243149] text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
          }`}>
            <Compass className="w-3.5 h-3.5 text-cyan-500 mr-1" />
            <span className="font-medium">Projection:</span>
            <select
              value={projectionAngle}
              onChange={(e) => setProjectionAngle(e.target.value as 'third' | 'first')}
              className="bg-transparent text-amber-500 font-bold border-none focus:outline-none cursor-pointer ml-1 text-xs"
            >
              <option value="third">3rd Angle (ANSI / ASME)</option>
              <option value="first">1st Angle (ISO Standard)</option>
            </select>
          </div>

          {/* Zoom Buttons */}
          <div className={`flex items-center space-x-1 border rounded-xl p-1 ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#151F32] text-[#94A3B8]' : 'hover:bg-slate-200 text-[#64748B]'
              }`}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-cyan-500 min-w-[42px] text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#151F32] text-[#94A3B8]' : 'hover:bg-slate-200 text-[#64748B]'
              }`}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#151F32] text-[#94A3B8]' : 'hover:bg-slate-200 text-[#64748B]'
              }`}
              title="Fit to Sheet"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="btn-secondary btn-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-500" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="btn-primary btn-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded ✓</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary cursor-pointer p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* DRAWING CANVAS VIEWPORT */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-slate-950">
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 ease-out shadow-2xl shrink-0 my-4"
        >
          {/* A3 SHEET CONTAINER (Ratio 420mm x 297mm -> 1190px x 840px) */}
          <div className="w-[1190px] h-[840px] bg-white text-slate-900 p-4 relative font-mono select-none border border-slate-300 shadow-2xl">
            
            {/* Outer Border (10mm margin) */}
            <div className="w-full h-full border border-slate-900 relative p-3 flex flex-col justify-between">
              
              {/* Inner Border (Thick CAD line) */}
              <div className="w-full h-full border-2 border-slate-900 relative flex flex-col justify-between">
                
                {/* Zone Grid Reference Markers */}
                {/* Top Grid Numbers: 1 to 8 */}
                <div className="absolute -top-3.5 left-0 right-0 flex justify-between px-6 text-[10px] font-bold text-slate-700 pointer-events-none">
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                {/* Bottom Grid Numbers */}
                <div className="absolute -bottom-3.5 left-0 right-0 flex justify-between px-6 text-[10px] font-bold text-slate-700 pointer-events-none">
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                {/* Left Grid Letters: A to D */}
                <div className="absolute -left-3.5 top-0 bottom-0 flex flex-col justify-between py-12 text-[10px] font-bold text-slate-700 pointer-events-none">
                  {['A', 'B', 'C', 'D'].map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                {/* Right Grid Letters */}
                <div className="absolute -right-3.5 top-0 bottom-0 flex flex-col justify-between py-12 text-[10px] font-bold text-slate-700 pointer-events-none">
                  {['A', 'B', 'C', 'D'].map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>

                {/* REVISION TABLE (Top-Right) */}
                <div className="absolute top-0 right-0 w-[420px] border-b border-l border-slate-900 bg-white z-10">
                  <div className="grid grid-cols-12 text-[9px] font-bold bg-slate-100 border-b border-slate-900 p-1 text-center">
                    <span className="col-span-2">REV</span>
                    <span className="col-span-6 text-left pl-2">REVISION DESCRIPTION</span>
                    <span className="col-span-2">DATE</span>
                    <span className="col-span-2">APPROVED</span>
                  </div>
                  {(part.revisionHistory || [
                    { revId: 'A.0', date: '2026-01-10', author: 'Alex Rivera', changeSummary: 'Initial Concept Draft', status: 'Superseded' },
                    { revId: currentRev, date: dateStr, author: 'Alex Rivera', changeSummary: 'Official DFM Engineering Release Update', status: 'Released' }
                  ]).slice(0, 2).map((r, i) => (
                    <div key={i} className="grid grid-cols-12 text-[8px] p-1 border-t border-slate-200 text-center">
                      <span className="col-span-2 font-bold">{r.revId}</span>
                      <span className="col-span-6 text-left pl-2 truncate">{r.changeSummary}</span>
                      <span className="col-span-2">{r.date}</span>
                      <span className="col-span-2 font-bold text-emerald-800">{r.status}</span>
                    </div>
                  ))}
                </div>

                {/* PARTS / BOM TABLE (Sheet 1 Right Side) */}
                {activeSheet === 1 && (
                  <div className="absolute top-[68px] right-0 w-[420px] border-b border-l border-slate-900 bg-white z-10">
                    <div className="grid grid-cols-12 text-[9px] font-bold bg-slate-100 border-b border-slate-900 p-1 text-center">
                      <span className="col-span-1">ITEM</span>
                      <span className="col-span-3 text-left pl-1">PART NO</span>
                      <span className="col-span-6 text-left pl-1">DESCRIPTION</span>
                      <span className="col-span-2">QTY</span>
                    </div>
                    {bomList.slice(0, 6).map((b) => (
                      <div key={b.item} className="grid grid-cols-12 text-[8px] p-1 border-t border-slate-200">
                        <span className="col-span-1 text-center font-bold">{b.item}</span>
                        <span className="col-span-3 text-left pl-1 font-mono font-bold">{b.partNo}</span>
                        <span className="col-span-6 text-left pl-1 truncate">{b.name}</span>
                        <span className="col-span-2 text-center font-bold">{b.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ========================================================= */}
                {/* SHEET 1 GRAPHICS (ORTHOGRAPHIC & ISOMETRIC VIEWS)        */}
                {/* ========================================================= */}
                {activeSheet === 1 ? (
                  <div className="w-full h-full relative p-6">
                    {/* SVG Vector Orthographic & Isometric CAD Views */}
                    <svg viewBox="0 0 1000 580" className="w-full h-[560px] stroke-slate-900 fill-none stroke-[1.8]">
                      
                      {/* 1. TOP VIEW (Top-Left) */}
                      <g transform="translate(100, 20)">
                        <rect x="0" y="0" width="260" height="110" rx="3" className="stroke-slate-900 stroke-[2.2]" />
                        <line x1="35" y1="0" x2="35" y2="110" className="stroke-slate-500 stroke-[1.2] stroke-dasharray-4" />
                        <line x1="225" y1="0" x2="225" y2="110" className="stroke-slate-500 stroke-[1.2] stroke-dasharray-4" />
                        <line x1="-20" y1="55" x2="280" y2="55" className="stroke-slate-400 stroke-1 stroke-dasharray-6" />

                        <text x="130" y="130" className="fill-slate-900 text-xs font-bold font-sans stroke-none text-center" textAnchor="middle">
                          TOP VIEW
                        </text>

                        <line x1="275" y1="0" x2="275" y2="110" className="stroke-emerald-700 stroke-[1.2]" />
                        <line x1="270" y1="0" x2="280" y2="0" className="stroke-emerald-700 stroke-1" />
                        <line x1="270" y1="110" x2="280" y2="110" className="stroke-emerald-700 stroke-1" />
                        <text x="295" y="60" className="fill-emerald-800 text-[10px] font-mono font-bold stroke-none text-center" textAnchor="middle">
                          680.00
                        </text>
                      </g>

                      {/* 2. FRONT VIEW (Bottom-Left) */}
                      <g transform="translate(100, 220)">
                        <rect x="0" y="0" width="260" height="200" rx="3" className="stroke-slate-900 stroke-[2.5]" />
                        <rect x="35" y="25" width="190" height="150" rx="3" className="stroke-slate-800 stroke-[1.5]" />
                        <circle cx="130" cy="100" r="50" className="stroke-slate-900 stroke-[2]" />
                        <circle cx="130" cy="100" r="24" className="stroke-amber-600 stroke-[1.5] stroke-dasharray-4" />
                        
                        {/* Centerlines */}
                        <line x1="130" y1="-15" x2="130" y2="215" className="stroke-slate-400 stroke-1 stroke-dasharray-6" />
                        <line x1="-15" y1="100" x2="275" y2="100" className="stroke-slate-400 stroke-1 stroke-dasharray-6" />
                        
                        {/* View Title */}
                        <text x="130" y="228" className="fill-slate-900 text-xs font-bold font-sans stroke-none text-center" textAnchor="middle">
                          FRONT VIEW (PRIMARY)
                        </text>
                        <text x="130" y="242" className="fill-slate-600 text-[10px] font-mono stroke-none text-center" textAnchor="middle">
                          SCALE 1:2.5
                        </text>

                        {/* Dimensions */}
                        <line x1="0" y1="-12" x2="260" y2="-12" className="stroke-emerald-700 stroke-[1.2]" />
                        <line x1="0" y1="-18" x2="0" y2="-6" className="stroke-emerald-700 stroke-1" />
                        <line x1="260" y1="-18" x2="260" y2="-6" className="stroke-emerald-700 stroke-1" />
                        <text x="130" y="-16" className="fill-emerald-800 text-[11px] font-mono font-bold stroke-none text-center" textAnchor="middle">
                          450.00 ±0.10 mm
                        </text>

                        <line x1="130" y1="100" x2="210" y2="40" className="stroke-blue-700 stroke-1" />
                        <text x="215" y="38" className="fill-blue-800 text-[10px] font-mono font-bold stroke-none">
                          Ø80 H7
                        </text>
                      </g>

                      {/* 3. RIGHT SIDE VIEW */}
                      <g transform="translate(420, 220)">
                        <rect x="0" y="0" width="130" height="200" rx="3" className="stroke-slate-900 stroke-[2.2]" />
                        <rect x="20" y="25" width="90" height="150" rx="3" className="stroke-slate-800 stroke-[1.5]" />
                        <line x1="65" y1="-15" x2="65" y2="215" className="stroke-slate-400 stroke-1 stroke-dasharray-6" />

                        <text x="65" y="228" className="fill-slate-900 text-xs font-bold font-sans stroke-none text-center" textAnchor="middle">
                          RIGHT SIDE VIEW
                        </text>
                      </g>

                      {/* 4. ISOMETRIC VIEW (3D) */}
                      <g transform="translate(440, 20)">
                        <polygon points="0,40 75,0 150,40 150,140 75,180 0,140" className="stroke-purple-700 stroke-[2.2]" />
                        <line x1="75" y1="0" x2="75" y2="180" className="stroke-purple-700 stroke-[1.5]" />
                        <line x1="0" y1="40" x2="75" y2="85" className="stroke-purple-700 stroke-[1.5]" />
                        <line x1="150" y1="40" x2="75" y2="85" className="stroke-purple-700 stroke-[1.5]" />
                        <ellipse cx="75" cy="85" rx="30" ry="15" className="stroke-purple-600 stroke-[1.5]" />

                        <text x="75" y="202" className="fill-purple-900 text-xs font-bold font-sans stroke-none text-center" textAnchor="middle">
                          ISOMETRIC VIEW (3D)
                        </text>

                        {/* Balloon Callouts */}
                        <g>
                          <line x1="20" y1="65" x2="-20" y2="40" className="stroke-slate-900 stroke-1" />
                          <circle cx="-20" cy="40" r="12" className="fill-white stroke-slate-900 stroke-2" />
                          <text x="-20" y="44" className="fill-slate-900 text-xs font-bold stroke-none text-center" textAnchor="middle">1</text>

                          <line x1="120" y1="65" x2="180" y2="40" className="stroke-slate-900 stroke-1" />
                          <circle cx="180" cy="40" r="12" className="fill-white stroke-slate-900 stroke-2" />
                          <text x="180" y="44" className="fill-slate-900 text-xs font-bold stroke-none text-center" textAnchor="middle">2</text>

                          <line x1="90" y1="120" x2="180" y2="135" className="stroke-slate-900 stroke-1" />
                          <circle cx="180" cy="135" r="12" className="fill-white stroke-slate-900 stroke-2" />
                          <text x="180" y="139" className="fill-slate-900 text-xs font-bold stroke-none text-center" textAnchor="middle">3</text>
                        </g>
                      </g>

                    </svg>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* SHEET 2 GRAPHICS (SECTION VIEW & SPECIFICATIONS)         */
                  /* ========================================================= */
                  <div className="w-full h-full relative p-6 font-mono space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 border-b border-slate-900 pb-1">
                      SHEET 2: DETAILED SECTION A-A & COMPREHENSIVE MANUFACTURING SPECIFICATION MATRIX
                    </h3>

                    {/* Top Row: Section View A-A + GD&T Table */}
                    <div className="grid grid-cols-12 gap-4">
                      {/* Section View Box */}
                      <div className="col-span-5 border border-slate-900 p-3 bg-white space-y-2">
                        <span className="text-[10px] font-bold block">SECTION VIEW A-A (CROSS SECTION & HATCHING)</span>
                        <svg viewBox="0 0 320 140" className="w-full h-28 stroke-slate-900 fill-none stroke-[1.5]">
                          <rect x="10" y="10" width="300" height="120" className="stroke-slate-900 stroke-2" />
                          <rect x="40" y="30" width="240" height="80" className="stroke-slate-800 stroke-1" />
                          {/* 45 Degree Cross Hatching */}
                          {[...Array(20)].map((_, idx) => (
                            <line key={idx} x1={10 + idx * 18} y1="10" x2={10 + idx * 18 + 35} y2="130" className="stroke-slate-400 stroke-[0.8]" />
                          ))}
                        </svg>
                      </div>

                      {/* GD&T Feature Control Table */}
                      <div className="col-span-7 border border-slate-900 bg-white">
                        <div className="bg-slate-100 text-[9px] font-bold p-1.5 border-b border-slate-900 flex items-center justify-between">
                          <span>GEOMETRIC DIMENSIONING & TOLERANCING (ASME Y14.5-2018)</span>
                          <span className="text-[8px] text-slate-600">STANDARD DATUM: A-B-C</span>
                        </div>
                        <div className="text-[8.5px] p-2 space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-slate-800">Housing Bearing Seat</span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-mono">
                              ⌖ Ø 0.05 Ⓜ | A | B | C
                            </span>
                            <span className="text-slate-600">Positional Tolerance</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-slate-800">Mounting Flange Face</span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-mono">
                              ⏥ 0.03 | Primary A
                            </span>
                            <span className="text-slate-600">Flatness</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-slate-800">Carrier Pin Bores</span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-mono">
                              ∥ 0.04 | Datum A
                            </span>
                            <span className="text-slate-600">Parallelism</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Input Shaft Centerline</span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-mono">
                              ↗ 0.02 | Datum A-B
                            </span>
                            <span className="text-slate-600">Radial Runout</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Full Manufacturing & Specification Table */}
                    <div className="border border-slate-900 bg-white">
                      <div className="bg-slate-100 text-[9px] font-bold p-1.5 grid grid-cols-12 border-b border-slate-900">
                        <span className="col-span-1 text-center">ITEM</span>
                        <span className="col-span-3">PARAMETER / REQUIREMENT</span>
                        <span className="col-span-5">ENGINEERING SPECIFICATION & MATERIAL STANDARD</span>
                        <span className="col-span-3">VERIFICATION & QA TEST METHOD</span>
                      </div>
                      {[
                        { item: 1, param: 'Base Material Specification', spec: part.material || 'Aluminium 7075-T6 (AMS 4045)', method: 'Spectrometry & Mill Test Cert' },
                        { item: 2, param: 'Calculated Mass & Density', spec: `${part.weightKg || 28.4} kg (Derived from 3D CAD B-Rep Model)`, method: 'Precision Digital Load-Cell Scale' },
                        { item: 3, param: 'Surface Treatment & Coating', spec: 'Type III Hard Anodize (MIL-A-8625), Class 2 Black 50µm', method: 'Eddy Current Thickness Gauge' },
                        { item: 4, param: 'Thermal & Heat Treatment', spec: 'T6 Solution Heat Treated & Artificially Peak Aged', method: 'Rockwell Hardness (150 HRB)' },
                        { item: 5, param: 'Threaded Locking Inserts', spec: 'Helicoil STI M8x1.25 Self-Locking Wire Inserts (304 SS)', method: 'Go / No-Go Plug Gauge (ISO 1502)' },
                        { item: 6, param: 'Non-Destructive Testing (NDT)', spec: '100% Ultrasonic Flaw Detection & Fluorescent Penetrant', method: 'ASTM E1417 Level 2' }
                      ].map((sp) => (
                        <div key={sp.item} className="grid grid-cols-12 text-[8px] p-1.5 border-t border-slate-200">
                          <span className="col-span-1 text-center font-bold">{sp.item}</span>
                          <span className="col-span-3 font-bold">{sp.param}</span>
                          <span className="col-span-5">{sp.spec}</span>
                          <span className="col-span-3 text-slate-700">{sp.method}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* ========================================================= */}
                {/* GENERAL NOTES (Bottom-Left)                               */}
                {/* ========================================================= */}
                <div className="absolute bottom-0 left-0 w-[420px] p-3 border-t border-r border-slate-900 bg-white z-10 text-[8px] space-y-0.5">
                  <span className="font-bold block text-[9px] text-slate-900">GENERAL NOTES (UNLESS SPECIFIED OTHERWISE):</span>
                  <p>1. ALL DIMENSIONS ARE IN MILLIMETERS (mm). ASME Y14.5-2018 STANDARD.</p>
                  <p>2. REMOVE ALL BURRS AND SHARP EDGES (R0.5 MAX). BREAK INTERNAL CORNERS R0.3.</p>
                  <p>3. GENERAL TOLERANCES: LINEAR ±0.15 mm, ANGULAR ±0°30' PER ISO 2768-mK.</p>
                  <p>4. DO NOT SCALE DRAWING. WORK STRICTLY TO STATED DIMENSIONS & CAD GEOMETRY.</p>
                  <p>5. ALL MACHINED SURFACES SHALL BE FREE FROM SCRATCHES, TOOL MARKS, AND POROSITY.</p>
                </div>

                {/* ========================================================= */}
                {/* STRUCTURED TITLE BLOCK (Bottom-Right)                     */}
                {/* ========================================================= */}
                <div className="absolute bottom-0 right-0 w-[500px] h-[140px] border-t-2 border-l-2 border-slate-900 bg-white z-20 flex flex-col text-[8.5px]">
                  
                  {/* Row 1: Company Logo | Title | Part & Dwg No */}
                  <div className="h-[48px] border-b border-slate-900 grid grid-cols-12 items-center">
                    {/* Company */}
                    <div className="col-span-4 p-2 border-r border-slate-900">
                      <div className="font-black text-xs text-slate-900 font-sans tracking-tight">
                        APEXPLM STUDIO
                      </div>
                      <div className="text-[7px] text-slate-500 font-mono">AUTOMOTIVE & AEROSPACE</div>
                      <div className="text-[7px] text-slate-500 font-mono">ENGINEERING SYSTEMS</div>
                    </div>

                    {/* Title */}
                    <div className="col-span-5 p-2 border-r border-slate-900">
                      <span className="text-[6.5px] text-slate-500 block font-bold">TITLE:</span>
                      <span className="text-[9.5px] font-bold text-slate-900 uppercase line-clamp-2 block leading-tight">
                        {part.name}
                      </span>
                    </div>

                    {/* Part & Dwg No */}
                    <div className="col-span-3 p-1.5 space-y-1">
                      <div>
                        <span className="text-[6.5px] text-slate-500 block font-bold">PART NO:</span>
                        <span className="font-bold text-slate-900 text-[8.5px] truncate block">{part.partNumber}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] text-slate-500 block font-bold">DWG NO:</span>
                        <span className="font-bold text-slate-900 text-[8px] truncate block">{drawingNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Material | Finish | Scale/Units | Tolerance | Rev */}
                  <div className="h-[38px] border-b border-slate-900 grid grid-cols-12 items-center text-[7.5px]">
                    <div className="col-span-4 p-1.5 border-r border-slate-900">
                      <span className="text-[6.5px] text-slate-500 block font-bold">MATERIAL:</span>
                      <span className="font-bold text-slate-900 truncate block">{part.material || 'Aluminium 7075-T6'}</span>
                    </div>
                    <div className="col-span-3 p-1.5 border-r border-slate-900">
                      <span className="text-[6.5px] text-slate-500 block font-bold">FINISH:</span>
                      <span className="font-bold text-slate-900">AS MACHINED</span>
                    </div>
                    <div className="col-span-2 p-1.5 border-r border-slate-900 text-center">
                      <span className="text-[6.5px] text-slate-500 block font-bold">SCALE / UNITS:</span>
                      <span className="font-bold text-slate-900">1:2.5 (mm)</span>
                    </div>
                    <div className="col-span-2 p-1.5 border-r border-slate-900 text-center">
                      <span className="text-[6.5px] text-slate-500 block font-bold">TOLERANCE:</span>
                      <span className="font-bold text-slate-900">ISO 2768-mK</span>
                    </div>
                    <div className="col-span-1 p-1 text-center">
                      <span className="text-[6.5px] text-slate-500 block font-bold">REV:</span>
                      <span className="font-black text-amber-700 text-[10px]">{currentRev}</span>
                    </div>
                  </div>

                  {/* Row 3: Approvals | Dedicated Projection Symbol | Sheet Size & Number */}
                  <div className="h-[54px] grid grid-cols-12 items-center text-[7.5px]">
                    {/* Drawn / Approvals */}
                    <div className="col-span-4 p-1.5 border-r border-slate-900 space-y-0.5">
                      <div>DRAWN: <b>Alex Rivera, PE</b></div>
                      <div>CHECKED: <b>Marcus Vance</b></div>
                      <div>APPROVED: <b>Dr. Elena Rostova</b></div>
                    </div>

                    {/* Dedicated Projection Symbol Box */}
                    <div className="col-span-4 p-1 border-r border-slate-900 flex flex-col items-center justify-center">
                      <span className="text-[6.5px] font-bold text-slate-600 block mb-0.5">
                        {projectionAngle === 'third' ? 'THIRD ANGLE PROJECTION' : 'FIRST ANGLE PROJECTION'}
                      </span>
                      {/* Projection SVG */}
                      <svg viewBox="0 0 80 24" className="w-18 h-6 stroke-slate-900 fill-none stroke-[1.2]">
                        <circle cx="18" cy="12" r="4" />
                        <circle cx="18" cy="12" r="8" />
                        {projectionAngle === 'third' ? (
                          <>
                            <line x1="38" y1="8" x2="38" y2="16" />
                            <line x1="58" y1="4" x2="58" y2="20" />
                            <line x1="38" y1="8" x2="58" y2="4" />
                            <line x1="38" y1="16" x2="58" y2="20" />
                          </>
                        ) : (
                          <>
                            <line x1="38" y1="4" x2="38" y2="20" />
                            <line x1="58" y1="8" x2="58" y2="16" />
                            <line x1="38" y1="4" x2="58" y2="8" />
                            <line x1="38" y1="20" x2="58" y2="16" />
                          </>
                        )}
                        <line x1="4" y1="12" x2="72" y2="12" className="stroke-slate-400 stroke-1 stroke-dasharray-2" />
                      </svg>
                    </div>

                    {/* Sheet Size & Number */}
                    <div className="col-span-4 p-2 text-right space-y-0.5 pr-3">
                      <div className="text-[7px] text-slate-500">SIZE: A3 LANDSCAPE</div>
                      <div className="font-black text-sm text-slate-900">SHEET {activeSheet} OF 2</div>
                      <div className="text-[6.5px] text-slate-500">DATE: {dateStr}</div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
