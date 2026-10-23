import React, { useState } from 'react';
import { 
  X, 
  GitCompare, 
  Layers, 
  FileText, 
  Cpu, 
  ArrowRight,
  Plus,
  Minus,
  Box
} from 'lucide-react';
import type { PartItem, Revision, BOMNode, EngineeringDocument } from '../../types/plm';
import { useTheme } from '../../context/ThemeContext';

interface RevisionCompareModalProps {
  product: PartItem;
  isOpen: boolean;
  onClose: () => void;
  documents?: EngineeringDocument[];
  bomTrees?: Record<string, BOMNode>;
  initialRevA?: string;
  initialRevB?: string;
}

export const RevisionCompareModal: React.FC<RevisionCompareModalProps> = ({
  product,
  isOpen,
  onClose,
  documents = [],
  bomTrees = {},
  initialRevA,
  initialRevB
}) => {
  const { isDark } = useTheme();

  // All revisions of this product
  const revisions = product.revisionHistory || [];
  
  const [revAId, setRevAId] = useState<string>(() => {
    if (initialRevA && revisions.some(r => r.revId === initialRevA)) return initialRevA;
    if (revisions.length >= 2) return revisions[revisions.length - 2].revId;
    return revisions[0]?.revId || product.currentRev;
  });

  const [revBId, setRevBId] = useState<string>(() => {
    if (initialRevB && revisions.some(r => r.revId === initialRevB)) return initialRevB;
    return revisions[revisions.length - 1]?.revId || product.currentRev;
  });

  const [activeDiffTab, setActiveDiffTab] = useState<'all' | 'specs' | 'docs' | 'bom'>('all');

  if (!isOpen) return null;

  const revA: Revision | undefined = revisions.find(r => r.revId === revAId) || {
    revId: revAId,
    date: '2026-08-01',
    author: product.productOwner || product.createdBy || 'Lead Engineer',
    changeSummary: 'Baseline release',
    status: 'Released',
    technicalSpecs: product.technicalSpecs
  };

  const revB: Revision | undefined = revisions.find(r => r.revId === revBId) || {
    revId: revBId,
    date: new Date().toISOString().split('T')[0],
    author: product.productOwner || product.createdBy || 'Lead Engineer',
    changeSummary: 'Current revision',
    status: 'Draft',
    technicalSpecs: product.technicalSpecs
  };

  // 1. Technical Specs Comparison
  const specsA = revA?.technicalSpecs || product.technicalSpecs || {};
  const specsB = revB?.technicalSpecs || product.technicalSpecs || {};

  const specKeys: { key: keyof typeof specsA; label: string; defaultVal?: string }[] = [
    { key: 'material', label: 'Material', defaultVal: product.material },
    { key: 'manufacturingProcess', label: 'Manufacturing Process', defaultVal: 'CNC Machining' },
    { key: 'dimensions', label: 'Dimensions (L x W x H)', defaultVal: `${product.cadMetadata?.boundingDimensionsMm?.join(' x ')} mm` },
    { key: 'weightKg', label: 'Weight (kg)', defaultVal: `${product.weightKg} kg` },
    { key: 'units', label: 'Engineering Units', defaultVal: 'Millimeters (mm)' },
    { key: 'cadFileFormat', label: 'CAD Format', defaultVal: product.cadMetadata?.format || 'STEP' },
    { key: 'cadSoftware', label: 'CAD Software', defaultVal: 'SolidWorks 2025' },
    { key: 'technicalSpecs', label: 'Technical Specifications', defaultVal: product.description },
    { key: 'designRequirements', label: 'Design Requirements', defaultVal: 'Standard ISO 2768-mK' },
    { key: 'safetyRequirements', label: 'Safety Requirements', defaultVal: 'CE / UL Compliant' },
    { key: 'qualityRequirements', label: 'Quality Requirements', defaultVal: 'CMM Inspection 100%' }
  ];

  // 2. Documents Comparison
  const docsForPart = documents.filter(d => 
    d.linkedPartId === product.id || 
    d.linkedPartId === product.partNumber ||
    d.docNumber?.includes(product.partNumber)
  );

  const docsA = docsForPart.filter(d => !d.revision || d.revision.includes(revAId) || d.revision === revAId);
  const docsB = docsForPart.filter(d => !d.revision || d.revision.includes(revBId) || d.revision === revBId);

  const docIdsA = new Set(docsA.map(d => d.title || d.docNumber));
  const docIdsB = new Set(docsB.map(d => d.title || d.docNumber));

  const allDocTitles = Array.from(new Set([...Array.from(docIdsA), ...Array.from(docIdsB)]));

  // 3. BOM Comparison
  const rootBOM = bomTrees[product.id] || bomTrees[product.partNumber];
  const bomItemsA: BOMNode[] = revA?.bomSnapshot || (rootBOM?.children || []);
  const bomItemsB: BOMNode[] = revB?.bomSnapshot || (rootBOM?.children || []);

  const bomPartNumsA = new Map(bomItemsA.map(item => [item.partNumber, item]));
  const bomPartNumsB = new Map(bomItemsB.map(item => [item.partNumber, item]));

  const allBomPartNumbers = Array.from(new Set([
    ...Array.from(bomPartNumsA.keys()),
    ...Array.from(bomPartNumsB.keys())
  ]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0D1628] border-slate-700/60 text-[#F1F5F9]' : 'bg-white border-slate-200 text-[#172033]'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-[#111B2E]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Revision Comparison Engine</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {product.partNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Side-by-side parametric diff between two engineering revisions for {product.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Revision Selectors Bar */}
        <div className={`px-6 py-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 ${
          isDark ? 'bg-[#131F35] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {/* Revision A Selector */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Baseline (Rev A):</span>
            <select
              value={revAId}
              onChange={(e) => setRevAId(e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer outline-none ${
                isDark ? 'bg-[#0D1628] border-slate-700 text-cyan-400' : 'bg-white border-slate-300 text-cyan-700'
              }`}
            >
              {revisions.map(r => (
                <option key={r.revId} value={r.revId}>
                  {r.revId} ({r.status}) &bull; {r.date}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-cyan-400 shrink-0">
            <span className="text-xs font-mono font-bold">COMPARING</span>
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Revision B Selector */}
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target (Rev B):</span>
            <select
              value={revBId}
              onChange={(e) => setRevBId(e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer outline-none ${
                isDark ? 'bg-[#0D1628] border-slate-700 text-purple-400' : 'bg-white border-slate-300 text-purple-700'
              }`}
            >
              {revisions.map(r => (
                <option key={r.revId} value={r.revId}>
                  {r.revId} ({r.status}) &bull; {r.date}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Tabs Filter */}
        <div className={`px-6 py-2.5 border-b flex items-center space-x-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-[#0D1628]' : 'border-slate-200 bg-white'
        }`}>
          {[
            { id: 'all', label: 'ALL CHANGES' },
            { id: 'specs', label: 'TECHNICAL SPECS' },
            { id: 'docs', label: 'DOCUMENTS' },
            { id: 'bom', label: 'BOM DELTA' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDiffTab(tab.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeDiffTab === tab.id
                  ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {/* Metadata Comparison */}
          {(activeDiffTab === 'all' || activeDiffTab === 'specs') && (
            <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-2 border-b pb-2 border-slate-700/30">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Revision Metadata &amp; Lifecycle</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">Baseline: {revAId}</span>
                  <div className="space-y-1 text-slate-300">
                    <div>Status: <span className="font-semibold text-emerald-400">{revA?.status}</span></div>
                    <div>Author: <span className="font-semibold">{revA?.author || product.productOwner || product.createdBy || 'Lead Engineer'}</span></div>
                    <div>Created Date: <span className="font-semibold">{revA?.date}</span></div>
                    <div>Change Summary: <span className="text-slate-400">{revA?.changeSummary || revA?.description || 'N/A'}</span></div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Target: {revBId}</span>
                  <div className="space-y-1 text-slate-300">
                    <div>Status: <span className="font-semibold text-amber-400">{revB?.status}</span></div>
                    <div>Author: <span className="font-semibold">{revB?.author || product.productOwner || product.createdBy || 'Lead Engineer'}</span></div>
                    <div>Created Date: <span className="font-semibold">{revB?.date}</span></div>
                    <div>Change Summary: <span className="text-slate-400">{revB?.changeSummary || revB?.description || 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Specifications Diff Table */}
          {(activeDiffTab === 'all' || activeDiffTab === 'specs') && (
            <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">Technical Specifications &amp; Parameters</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Geometric comparison engines available for CAD files
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <th className="py-2 px-3 w-1/4">Parameter</th>
                      <th className="py-2 px-3 w-1/3 text-cyan-400">Baseline ({revAId})</th>
                      <th className="py-2 px-3 w-1/3 text-purple-400">Target ({revBId})</th>
                      <th className="py-2 px-3 text-right">Delta Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {specKeys.map(spec => {
                      const valA = String(specsA[spec.key] || spec.defaultVal || 'Not specified');
                      const valB = String(specsB[spec.key] || spec.defaultVal || 'Not specified');
                      const isModified = valA !== valB;

                      return (
                        <tr 
                          key={spec.key}
                          className={`transition-colors ${
                            isModified 
                              ? isDark ? 'bg-amber-500/5' : 'bg-amber-50/50' 
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-300">
                            {spec.label}
                          </td>
                          <td className={`py-2.5 px-3 font-mono ${isModified ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                            {valA}
                          </td>
                          <td className={`py-2.5 px-3 font-mono ${isModified ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                            {valB}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isModified ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                MODIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">
                                MATCH
                              </span>
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

          {/* Documents Diff */}
          {(activeDiffTab === 'all' || activeDiffTab === 'docs') && (
            <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center space-x-2 border-b pb-2 border-slate-700/30">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Engineering Documents Delta</h3>
              </div>

              {allDocTitles.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No documents linked to revisions {revAId} or {revBId}.
                </div>
              ) : (
                <div className="space-y-2">
                  {allDocTitles.map(title => {
                    const inA = docIdsA.has(title);
                    const inB = docIdsB.has(title);

                    return (
                      <div 
                        key={title}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          !inA && inB
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : inA && !inB
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="font-medium text-slate-200">{title}</span>
                            <span className="text-[10px] text-slate-400 block">
                              Controlled engineering document linked to {product.partNumber}
                            </span>
                          </div>
                        </div>

                        <div>
                          {!inA && inB && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                              <Plus className="w-3 h-3" />
                              <span>ADDED IN {revBId}</span>
                            </span>
                          )}
                          {inA && !inB && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                              <Minus className="w-3 h-3" />
                              <span>REMOVED IN {revBId}</span>
                            </span>
                          )}
                          {inA && inB && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                              RETAINED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BOM Delta */}
          {(activeDiffTab === 'all' || activeDiffTab === 'bom') && (
            <div className={`rounded-xl border p-4 shadow-sm space-y-3 ${
              isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/30">
                <div className="flex items-center space-x-2">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">Bill of Materials (BOM) Delta</h3>
                </div>
                <span className="text-[10px] text-slate-400">
                  Revision-specific BOM structure comparison
                </span>
              </div>

              {allBomPartNumbers.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No BOM components defined for this assembly.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-2 px-3">Part Number</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-cyan-400">Qty ({revAId})</th>
                        <th className="py-2 px-3 text-purple-400">Qty ({revBId})</th>
                        <th className="py-2 px-3 text-right">BOM Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {allBomPartNumbers.map(partNum => {
                        const compA = bomPartNumsA.get(partNum);
                        const compB = bomPartNumsB.get(partNum);

                        const isAdded = !compA && Boolean(compB);
                        const isRemoved = Boolean(compA) && !compB;
                        const isQtyChanged = compA && compB && compA.quantity !== compB.quantity;

                        const name = compB?.name || compA?.name || 'Component';

                        return (
                          <tr 
                            key={partNum}
                            className={`transition-colors ${
                              isAdded ? 'bg-emerald-500/5' : isRemoved ? 'bg-rose-500/5' : isQtyChanged ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                              {partNum}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-cyan-400">
                              {compA ? `${compA.quantity} ${compA.unit || 'pcs'}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-purple-400">
                              {compB ? `${compB.quantity} ${compB.unit || 'pcs'}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isAdded && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  + ADDED
                                </span>
                              )}
                              {isRemoved && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  - REMOVED
                                </span>
                              )}
                              {isQtyChanged && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  QTY CHANGED
                                </span>
                              )}
                              {!isAdded && !isRemoved && !isQtyChanged && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">
                                  IDENTICAL
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-[#111B2E]' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className="text-[11px] text-slate-400 font-mono">
            Comparing Product Master: <strong className="text-cyan-400">{product.partNumber}</strong> (ID: {product.id})
          </span>
          <button
            onClick={onClose}
            className="btn-secondary btn-sm cursor-pointer"
          >
            Close Diff
          </button>
        </div>
      </div>
    </div>
  );
};
