import React, { useState } from 'react';
import { 
  Clock, 
  X, 
  Check, 
  Sliders, 
  Download, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  Tag, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { PartItem } from '../types/plm';

export interface DetailedRevisionRecord {
  revId: string;
  date: string;
  author: string;
  approver: string;
  status: 'Draft' | 'Released' | 'Superseded' | 'In Review';
  ecnNumber: string;
  changeSummary: string;
  detailedNotes: string[];
  dimensionsMm: [number, number, number];
  weightKg: number;
  volumeCm3: number;
  surfaceAreaCm2: number;
  estimatedCost: number;
  cadPlatform: string;
  cadFileName: string;
  material: string;
  toleranceClass: string;
  maxStressMpa: number;
  criticalFeatures: string[];
}

interface CadRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartItem;
  activeRevision: string;
  onSelectRevision: (revId: string) => void;
  onOpenCompare: (revA: string, revB: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CadRevisionHistoryModal: React.FC<CadRevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  part,
  activeRevision,
  onSelectRevision,
  onOpenCompare,
  onShowToast
}) => {
  const { isDark } = useTheme();
  const [selectedRevDetail, setSelectedRevDetail] = useState<string | null>(null);

  // Comprehensive revisions data for ASM-EV-9000
  const revisions: DetailedRevisionRecord[] = [
    {
      revId: 'A.4',
      date: '2026-08-22',
      author: 'Alex Rivera',
      approver: 'Marcus Vance, VP Eng (Pending)',
      status: 'Draft',
      ecnNumber: 'ECO-2026-0042',
      changeSummary: 'Planetary gear radius enlarged (16mm -> 18mm) for 750W high-torque motor',
      detailedNotes: [
        'Gearbox ring & planet gear pitch radius enlarged to support 750W peak torque (+12.5% tooth contact engagement)',
        'Rear dropout clearance expanded by +2.5mm for wider high-traction 10" tubeless tire fitment',
        'Integrated internal conduit channels inside downtube for brushless motor phase lines and sensor bus'
      ],
      dimensionsMm: [450, 680, 1250],
      weightKg: 28.40,
      volumeCm3: 8400,
      surfaceAreaCm2: 12400,
      estimatedCost: 1850.00,
      cadPlatform: 'SolidWorks 2025 SP3',
      cadFileName: 'ASM-EV-9000.SLDASM',
      material: 'Aluminium 7075-T6 & Carbon Composite',
      toleranceClass: 'ISO 2768-f (Fine Precision)',
      maxStressMpa: 310,
      criticalFeatures: ['18T Case-Hardened Gears', '+2.5mm Dropout Clearance', 'Internal Conduit Channeling']
    },
    {
      revId: 'A.3',
      date: '2026-08-20',
      author: 'Alex Rivera',
      approver: 'Marcus Vance, VP Engineering',
      status: 'Released',
      ecnNumber: 'ECO-2026-0036',
      changeSummary: 'Material upgrade to Aerospace 7075-T6 & hydraulic caliper relocation',
      detailedNotes: [
        'Frame material upgraded to Aerospace Grade Aluminium 7075-T6 (+35% yield strength increase over 6061)',
        'Relocated dual-piston hydraulic brake caliper for superior cooling air vortex and thermal dissipation',
        'Validated under ISO 4210 dynamic drop testing standards at 1500N continuous shock cycle'
      ],
      dimensionsMm: [450, 680, 1250],
      weightKg: 28.10,
      volumeCm3: 8320,
      surfaceAreaCm2: 12250,
      estimatedCost: 1810.00,
      cadPlatform: 'SolidWorks 2025 SP2',
      cadFileName: 'ASM-EV-9000-A3.SLDASM',
      material: 'Aluminium 7075-T6',
      toleranceClass: 'ISO 2768-m (Medium)',
      maxStressMpa: 285,
      criticalFeatures: ['7075-T6 Forged Links', 'Relocated Dual Caliper Mounts', 'Tested to ISO 4210']
    },
    {
      revId: 'A.2',
      date: '2026-08-18',
      author: 'Alex Rivera',
      approver: 'Marcus Vance, VP Engineering',
      status: 'Superseded',
      ecnNumber: 'ECO-2026-0028',
      changeSummary: 'DFM optimization pass & CNC extrusion pocketing',
      detailedNotes: [
        'Added structural gussets at steering head tube to withstand braking shock load',
        'Wall thickness adjusted from 3.2mm to 2.8mm with ribbed stiffeners for mass reduction',
        'Machined rear fork dropouts to accommodate standard 140mm SUS410 brake rotors'
      ],
      dimensionsMm: [445, 675, 1240],
      weightKg: 27.80,
      volumeCm3: 8250,
      surfaceAreaCm2: 12100,
      estimatedCost: 1720.00,
      cadPlatform: 'SolidWorks 2024 SP2',
      cadFileName: 'ASM-EV-9000-A2.SLDASM',
      material: 'Aluminium 6061-T6',
      toleranceClass: 'ISO 2768-m (Medium)',
      maxStressMpa: 210,
      criticalFeatures: ['Extruded Stiffening Ribs', 'Gusseted Steering Neck', 'Rear Dropout Machining']
    },
    {
      revId: 'A.1',
      date: '2026-08-01',
      author: 'Alex Rivera',
      approver: 'Marcus Vance, VP Engineering',
      status: 'Superseded',
      ecnNumber: 'ECO-2026-0012',
      changeSummary: 'Initial conceptual architecture & structural frame sizing',
      detailedNotes: [
        'Initial frame layout using 6061 aluminium alloy round tubular chassis',
        'Basic 500W planetary motor mount provision with external cable brackets',
        'Preliminary single disc brake interface for concept prototype build'
      ],
      dimensionsMm: [440, 670, 1230],
      weightKg: 27.20,
      volumeCm3: 8100,
      surfaceAreaCm2: 11800,
      estimatedCost: 1650.00,
      cadPlatform: 'SolidWorks 2024 SP1',
      cadFileName: 'ASM-EV-9000-A1.SLDASM',
      material: 'Aluminium 6061-T6',
      toleranceClass: 'ISO 2768-c (Coarse)',
      maxStressMpa: 185,
      criticalFeatures: ['Concept Tubular Truss', '500W Hub Pocket', 'External Cable Routing']
    }
  ];

  const handleExportAuditTrail = () => {
    const headers = ['Revision', 'Release Date', 'Author', 'Approver', 'ECO Number', 'Status', 'Change Summary', 'Weight (kg)', 'CAD Platform', 'Material'];
    const rows = revisions.map(r => [
      r.revId,
      r.date,
      `"${r.author}"`,
      `"${r.approver}"`,
      r.ecnNumber,
      r.status,
      `"${r.changeSummary}"`,
      r.weightKg.toFixed(2),
      `"${r.cadPlatform}"`,
      `"${r.material}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${part.partNumber || 'ASM-EV-9000'}_Revision_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast?.('Exported revision history ledger to CSV', 'success');
  };

  const selectedRevData = revisions.find(r => r.revId === selectedRevDetail);

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
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Revision History</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
                  {revisions.length} Revisions Recorded
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Part Number: <strong className="font-mono text-cyan-400">{part.partNumber}</strong> &bull; {part.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportAuditTrail}
              className={`btn-sm flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Export Revision History to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>

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

        {/* ALIGNED STATUS BANNER */}
        <div className={`px-5 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-[#0a0f1d] border-slate-800/80' : 'bg-blue-50/60 border-blue-100'
        }`}>
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Current Active Revision:</span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30">
                Rev {activeRevision}
              </span>
            </div>
            <span className="text-slate-400">&bull;</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Baseline Release:</span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
                Rev A.3 (Released)
              </span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            Click any row below for technical specs or click actions to activate / compare.
          </span>
        </div>

        {/* ALIGNED REVISION TABLE */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="plm-table-container">
            <table className="plm-table text-xs">
              <thead>
                <tr>
                  <th className="w-28">Revision</th>
                  <th className="w-32">ECO Order</th>
                  <th className="w-28">Release Date</th>
                  <th className="w-36">Author</th>
                  <th>Change Summary &amp; Description</th>
                  <th className="w-36">Material &amp; Weight</th>
                  <th className="w-28 text-center">Status</th>
                  <th className="w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((rev) => {
                  const isActive = activeRevision === rev.revId;
                  const isExpanded = selectedRevDetail === rev.revId;
                  return (
                    <tr 
                      key={rev.revId} 
                      onClick={() => setSelectedRevDetail(isExpanded ? null : rev.revId)}
                      className={`cursor-pointer transition-colors ${
                        isActive 
                          ? isDark ? 'bg-cyan-500/15 font-semibold' : 'bg-cyan-50 font-semibold'
                          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      {/* Revision */}
                      <td>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            Rev {rev.revId}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans font-bold">
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ECO Order */}
                      <td className="font-mono text-purple-400 text-[11px] font-semibold">
                        {rev.ecnNumber}
                      </td>

                      {/* Release Date */}
                      <td className="font-mono text-[11px] text-slate-300">
                        {rev.date}
                      </td>

                      {/* Author */}
                      <td>
                        <div className="text-[11px]">
                          <strong className="block text-slate-200">{rev.author}</strong>
                          <span className="text-[10px] text-slate-400 truncate block">{rev.approver}</span>
                        </div>
                      </td>

                      {/* Change Summary */}
                      <td>
                        <div className="max-w-md">
                          <strong className="block text-slate-200 text-xs mb-0.5">{rev.changeSummary}</strong>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {rev.detailedNotes[0]}
                          </span>
                        </div>
                      </td>

                      {/* Material & Weight */}
                      <td className="font-mono text-[11px]">
                        <strong className="text-cyan-400 block truncate" title={rev.material}>
                          {rev.material}
                        </strong>
                        <span className="text-slate-400 block">{rev.weightKg.toFixed(2)} kg</span>
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span className={`badge-status ${
                          rev.status === 'Released' ? 'badge-active' : rev.status === 'Draft' ? 'badge-progress' : 'badge-draft'
                        }`}>
                          {rev.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isActive ? (
                            <button
                              onClick={() => {
                                onSelectRevision(rev.revId);
                                onShowToast?.(`Loaded Rev ${rev.revId} into CAD Vault`, 'success');
                              }}
                              className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/30 text-[11px] font-semibold cursor-pointer transition-colors"
                              title="Set as active vault revision"
                            >
                              Set Active
                            </button>
                          ) : (
                            <span className="text-[11px] text-cyan-400 font-semibold px-2 py-1">
                              Loaded
                            </span>
                          )}

                          <button
                            onClick={() => {
                              onClose();
                              onOpenCompare(rev.revId, activeRevision);
                            }}
                            className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 text-[11px] font-semibold cursor-pointer transition-colors"
                            title={`Compare Rev ${rev.revId} with active Rev ${activeRevision}`}
                          >
                            Compare
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* EXPANDABLE REVISION SPEC DETAIL DRAWER */}
          {selectedRevData && (
            <div className={`mt-4 p-4 rounded-xl border text-xs space-y-3 animate-fadeIn ${
              isDark ? 'bg-[#0c1424] border-blue-500/30' : 'bg-blue-50/50 border-blue-300'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/20">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <strong className="text-blue-400 font-mono text-sm">Rev {selectedRevData.revId} Specifications</strong>
                  <span className="text-slate-400">&bull; {selectedRevData.changeSummary}</span>
                </div>
                <button
                  onClick={() => setSelectedRevDetail(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  Close Spec
                </button>
              </div>

              {/* Technical Parameter Chips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Bounding Dimensions:</span>
                  <strong className="text-slate-200 font-mono">{selectedRevData.dimensionsMm.join(' × ')} mm</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Enclosed Volume / Area:</span>
                  <strong className="text-slate-200 font-mono">{selectedRevData.volumeCm3.toLocaleString()} cm³ &bull; {selectedRevData.surfaceAreaCm2.toLocaleString()} cm²</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">CAD Platform / File:</span>
                  <strong className="text-slate-200 font-mono">{selectedRevData.cadPlatform} &bull; {selectedRevData.cadFileName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tolerance &amp; Stress:</span>
                  <strong className="text-slate-200 font-mono">{selectedRevData.toleranceClass} &bull; {selectedRevData.maxStressMpa} MPa</strong>
                </div>
              </div>

              {/* Detailed Modification Bullets */}
              <div className="pt-1">
                <span className="text-slate-400 block mb-1 font-semibold text-[11px]">Detailed Technical Modifications:</span>
                <ul className="space-y-1 text-slate-300 pl-4 list-disc text-[11px]">
                  {selectedRevData.detailedNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-[#0c1322]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="text-slate-400 text-[11px] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Digital thread cryptographically signed &bull; ISO 9001 / AS9100 revision tracking</span>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary btn-sm cursor-pointer"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
};
