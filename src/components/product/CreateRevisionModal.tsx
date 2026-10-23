import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  UploadCloud, 
  FileText, 
  Cpu, 
  Box, 
  Layers, 
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import type { 
  PartItem, 
  Revision, 
  BOMNode, 
  EngineeringDocument, 
  StoredCadVaultFile,
  LifecycleStage 
} from '../../types/plm';
import type { UserAccount } from '../../data/mockUsers';
import { useTheme } from '../../context/ThemeContext';
import { registerCadVaultFile } from '../../utils/cadVaultStorage';
import { partsApi, bomApi, documentsApi } from '../../services/api';

interface CreateRevisionModalProps {
  product: PartItem;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onRevisionCreated: (updatedProduct: PartItem, newDocs: EngineeringDocument[], updatedBOM?: BOMNode) => void;
  logAction: (action: string, category: any, targetId: string, details: string) => void;
  existingBom?: BOMNode;
  documents?: EngineeringDocument[];
}

export const CreateRevisionModal: React.FC<CreateRevisionModalProps> = ({
  product,
  isOpen,
  onClose,
  currentUser,
  onRevisionCreated,
  logAction,
  existingBom,
  documents = []
}) => {
  const { isDark } = useTheme();

  // Determine intelligent next revision number
  const computeNextRev = (current: string): string => {
    const trimmed = (current || '').trim();
    // Case 1: "Rev 0.0" -> "Rev 1.0"
    const matchRevDot = trimmed.match(/Rev\s*(\d+)\.(\d+)/i);
    if (matchRevDot) {
      const major = parseInt(matchRevDot[1], 10);
      return `Rev ${major + 1}.0`;
    }
    // Case 2: "0.0" -> "1.0"
    const matchNumDot = trimmed.match(/^(\d+)\.(\d+)$/);
    if (matchNumDot) {
      const major = parseInt(matchNumDot[1], 10);
      return `Rev ${major + 1}.0`;
    }
    // Case 3: "A.4" -> "Rev B.0" or "Rev 1.0"
    if (trimmed.startsWith('A') || trimmed.includes('A.')) {
      return 'Rev 1.0';
    }
    return `Rev ${trimmed ? trimmed + '.1' : '1.0'}`;
  };

  const prevRev: Revision | undefined = product.revisionHistory?.[0];
  const prevSpecs = prevRev?.technicalSpecs || product.technicalSpecs || {};

  // Form State
  const [newRevNumber, setNewRevNumber] = useState(() => computeNextRev(product.currentRev));
  const [revDescription, setRevDescription] = useState('Design optimization and engineering parameter revision');
  const [changeReason, setChangeReason] = useState('Engineering Change Order / DFM Improvement');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('design');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Editable Technical Specs (Cloned from previous)
  const [material, setMaterial] = useState(prevSpecs.material || product.material || 'Aluminium 7075-T6');
  const [manufacturingProcess, setManufacturingProcess] = useState(prevSpecs.manufacturingProcess || '5-Axis CNC Milling');
  const [lengthMm, setLengthMm] = useState(String(prevSpecs.length || product.cadMetadata?.boundingDimensionsMm?.[0] || '450'));
  const [widthMm, setWidthMm] = useState(String(prevSpecs.width || product.cadMetadata?.boundingDimensionsMm?.[1] || '680'));
  const [heightMm, setHeightMm] = useState(String(prevSpecs.height || product.cadMetadata?.boundingDimensionsMm?.[2] || '1250'));
  const [weightKg, setWeightKg] = useState(String(prevSpecs.weightKg || product.weightKg || '28.4'));
  const [cadFormat, setCadFormat] = useState(prevSpecs.cadFileFormat || product.cadMetadata?.format || 'STEP');
  const [cadSoftware, setCadSoftware] = useState(prevSpecs.cadSoftware || 'SolidWorks 2025');
  const [designRequirements, setDesignRequirements] = useState(prevSpecs.designRequirements || 'Precision ISO 2768-mK');

  // Editable BOM Components
  const [bomComponents, setBomComponents] = useState<Array<{
    partNumber: string;
    name: string;
    quantity: number;
    unit: string;
    material: string;
  }>>(() => {
    if (existingBom?.children && existingBom.children.length > 0) {
      return existingBom.children.map(c => ({
        partNumber: c.partNumber,
        name: c.name,
        quantity: c.quantity || 1,
        unit: c.unit || 'pcs',
        material: c.material || 'Standard'
      }));
    }
    return [
      { partNumber: 'PN-PGR-511', name: 'Precision Planet Gear 24T', quantity: 3, unit: 'pcs', material: '8620 Alloy Steel' },
      { partNumber: 'PN-SGN-520', name: 'Sun Gear Input Shaft 18T', quantity: 1, unit: 'pcs', material: '8620 Alloy Steel' },
      { partNumber: 'FST-M6-25-A4', name: 'Torx Flange Bolt M6x25mm Grade 10.9', quantity: 8, unit: 'pcs', material: 'High Tensile Steel' }
    ];
  });

  // Newly Uploaded Files for this Revision
  const [uploadedRevisionFiles, setUploadedRevisionFiles] = useState<Array<{
    file: File;
    name: string;
    type: string;
    size: string;
    dataUrl: string;
    docType: string;
  }>>([]);

  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'docs' | 'bom'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 50MB limit.`);
        return;
      }
      const ext = file.name.split('.').pop()?.toUpperCase() || 'BIN';
      let docType = 'Other Document';
      if (['STEP', 'STP', 'SLDPRT', 'SLDASM', 'IGES'].includes(ext)) docType = '3D CAD Model';
      else if (ext === 'PDF') docType = '2D Drawing PDF';
      else if (['XLSX', 'CSV'].includes(ext)) docType = 'BOM File';
      else if (['DOC', 'DOCX'].includes(ext)) docType = 'Technical Specification';

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedRevisionFiles(prev => [
          ...prev,
          {
            file,
            name: file.name,
            type: ext,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            dataUrl,
            docType
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveUploadedFile = (idx: number) => {
    setUploadedRevisionFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddBomItem = () => {
    setBomComponents(prev => [
      ...prev,
      {
        partNumber: `CMP-${product.partNumber.replace(/[^a-zA-Z0-9]/g, '')}-${prev.length + 1}`,
        name: 'New Component',
        quantity: 1,
        unit: 'pcs',
        material: 'Aluminum 6061-T6'
      }
    ]);
  };

  const handleRemoveBomItem = (idx: number) => {
    setBomComponents(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBomChange = (idx: number, field: string, value: any) => {
    setBomComponents(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!newRevNumber.trim()) {
      setErrorMessage('Revision Number is required.');
      return;
    }
    if (!revDescription.trim()) {
      setErrorMessage('Revision Description is required.');
      return;
    }
    if (!changeReason.trim()) {
      setErrorMessage('Change Reason is required.');
      return;
    }

    // Check if revision number already exists for this product
    const exists = product.revisionHistory?.some(r => r.revId.toLowerCase() === newRevNumber.trim().toLowerCase());
    if (exists) {
      setErrorMessage(`Revision "${newRevNumber}" already exists in the revision history of this product.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const authorName = currentUser.name || 'Alex Rivera, PE';

      // 1. Technical Specs for this Revision
      const newSpecs = {
        material,
        manufacturingProcess,
        dimensions: `${lengthMm} x ${widthMm} x ${heightMm} mm`,
        length: lengthMm,
        width: widthMm,
        height: heightMm,
        weightKg,
        units: 'mm',
        cadFileFormat: cadFormat,
        cadSoftware,
        designRequirements
      };

      // 2. Prepare uploaded documents
      const newDocsToSave: EngineeringDocument[] = [];
      const newVaultFiles: StoredCadVaultFile[] = [];

      uploadedRevisionFiles.forEach((f, idx) => {
        const docId = `DOC-${product.partNumber.replace(/[^a-zA-Z0-9]/g, '')}-${newRevNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${idx + 1}`;
        const newDoc: EngineeringDocument = {
          id: docId,
          docNumber: `DOC-${newRevNumber.replace(/[^a-zA-Z0-9]/g, '')}-${product.partNumber}-${String(idx + 1).padStart(3, '0')}`,
          title: `${product.partNumber} ${f.name}`,
          type: f.docType as any,
          linkedPartId: product.id,
          revision: newRevNumber,
          author: authorName,
          uploadDate: today,
          fileSize: f.size,
          status: 'Approved',
          fileUrl: f.dataUrl,
          fileName: f.name,
          fileExtension: f.type.toLowerCase(),
          description: `Document uploaded for ${product.partNumber} ${newRevNumber}`
        };
        newDocsToSave.push(newDoc);

        const vaultFile: StoredCadVaultFile = {
          id: `VAULT-${docId}`,
          productId: product.id,
          partNumber: product.partNumber,
          revision: newRevNumber,
          projectId: product.projectId,
          projectName: product.projectName,
          fileName: f.name,
          fileType: f.type,
          category: f.type === 'PDF' ? 'drawing' : 'cad',
          fileSize: f.size,
          uploadDate: today,
          uploadedBy: authorName,
          dataUrl: f.dataUrl
        };
        newVaultFiles.push(vaultFile);
        registerCadVaultFile(vaultFile);
      });

      // 3. Assemble new Revision record (immutable history preserved)
      const newRevisionRecord: Revision = {
        revId: newRevNumber.trim(),
        date: today,
        author: authorName,
        changeSummary: revDescription.trim(),
        status: 'Draft',
        description: revDescription.trim(),
        changeReason: changeReason.trim(),
        lifecycleStage,
        effectiveDate,
        revisionNotes,
        technicalSpecs: newSpecs,
        attachedDocIds: newDocsToSave.map(d => d.id),
        attachedFiles: newVaultFiles,
        bomSnapshot: bomComponents.map((c, i) => ({
          id: `BOM-${product.id}-${newRevNumber}-${i + 1}`,
          partId: `PN-${product.id}-${i + 1}`,
          partNumber: c.partNumber,
          name: c.name,
          revision: newRevNumber,
          quantity: c.quantity,
          unit: c.unit,
          material: c.material,
          unitCost: 50,
          weightKg: 1
        }))
      };

      // 4. Update the Product Master record
      // Keep previous revisions unchanged! Prepend or append new revision
      const updatedRevisionHistory = [newRevisionRecord, ...(product.revisionHistory || [])];

      const updatedProduct: PartItem = {
        ...product,
        currentRev: newRevNumber.trim(),
        lifecycleStage: lifecycleStage,
        material: material,
        weightKg: parseFloat(weightKg) || product.weightKg,
        technicalSpecs: newSpecs,
        revisionHistory: updatedRevisionHistory,
        cadMetadata: {
          ...product.cadMetadata,
          format: cadFormat as any,
          boundingDimensionsMm: [
            parseFloat(lengthMm) || 100,
            parseFloat(widthMm) || 100,
            parseFloat(heightMm) || 50
          ]
        }
      };

      // 5. Update BOM Tree
      const updatedBOMRoot: BOMNode = {
        id: `BOM-${product.id}`,
        partId: product.id,
        partNumber: product.partNumber,
        name: product.name,
        revision: newRevNumber.trim(),
        quantity: 1,
        unit: 'EA',
        material: material,
        unitCost: product.estimatedCost || 100,
        weightKg: parseFloat(weightKg) || product.weightKg,
        children: newRevisionRecord.bomSnapshot
      };

      // 6. Persist to MongoDB Atlas via backend APIs
      await Promise.allSettled([
        partsApi.update(product.id, updatedProduct),
        bomApi.save(product.id, updatedBOMRoot, product.projectId),
        ...newDocsToSave.map(doc => documentsApi.create(doc))
      ]);

      // 7. Record Audit Log
      logAction(
        'Created Product Revision',
        'ITEM_MASTER',
        product.partNumber,
        `Created revision ${newRevNumber} (Draft) for Product Master ${product.partNumber} with reason: "${changeReason}".`
      );

      // 8. Invoke parent callback
      onRevisionCreated(updatedProduct, newDocsToSave, updatedBOMRoot);
      window.dispatchEvent(new CustomEvent('plm:part-sync'));
      onClose();
    } catch (err: any) {
      console.error('Failed to create new revision:', err);
      setErrorMessage(err.message || 'Failed to create revision. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0D1628] border-slate-700/60 text-[#F1F5F9]' : 'bg-white border-slate-200 text-[#172033]'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-[#111B2E]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Create New Engineering Revision</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Permanent ID: {product.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clones baseline information from {product.currentRev}. Previous revisions remain immutable.
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

        {/* Tab Switcher */}
        <div className={`px-6 py-2.5 border-b flex items-center space-x-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-[#131F35]' : 'border-slate-200 bg-slate-100'
        }`}>
          {[
            { id: 'info', label: '1. Revision Control', icon: RefreshCw },
            { id: 'specs', label: '2. Technical Specs', icon: Layers },
            { id: 'docs', label: `3. Documents (${uploadedRevisionFiles.length})`, icon: FileText },
            { id: 'bom', label: `4. BOM Components (${bomComponents.length})`, icon: Box }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition-colors ${
                  activeTab === tab.id
                    ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white text-cyan-800 shadow-sm border border-slate-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-center space-x-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: REVISION CONTROL */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Permanent Product Number
                    </label>
                    <input 
                      type="text" 
                      value={product.partNumber} 
                      disabled 
                      className={`w-full p-2.5 rounded-lg border text-xs font-mono font-bold ${
                        isDark ? 'bg-slate-800/50 border-slate-700 text-cyan-400' : 'bg-slate-200 border-slate-300 text-cyan-700'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Product ID is permanent and never changes.</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      New Revision Number <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={newRevNumber} 
                      onChange={(e) => setNewRevNumber(e.target.value)}
                      placeholder="e.g. Rev 1.0, Rev 1.1, Rev 2.0"
                      className={`w-full p-2.5 rounded-lg border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Previous revision: {product.currentRev}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Revision Description <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={revDescription} 
                      onChange={(e) => setRevDescription(e.target.value)}
                      placeholder="Brief description of the changes made in this revision"
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reason for Change <span className="text-rose-400">*</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={changeReason} 
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder="Why is this revision required? (e.g. ECR-2026-042 DFM weight reduction)"
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lifecycle Stage
                    </label>
                    <select
                      value={lifecycleStage}
                      onChange={(e) => setLifecycleStage(e.target.value as LifecycleStage)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="concept">Concept</option>
                      <option value="design">Design</option>
                      <option value="prototype">Prototype</option>
                      <option value="tooling">Tooling</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Initial Status
                    </label>
                    <input 
                      type="text" 
                      value="Draft (Under Engineering Control)" 
                      disabled 
                      className={`w-full p-2.5 rounded-lg border text-xs font-semibold ${
                        isDark ? 'bg-slate-800/50 border-slate-700 text-amber-400' : 'bg-slate-200 border-slate-300 text-amber-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Effective Date
                    </label>
                    <input 
                      type="date" 
                      value={effectiveDate} 
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Created By
                    </label>
                    <input 
                      type="text" 
                      value={currentUser.name || 'Alex Rivera, PE'} 
                      disabled
                      className={`w-full p-2.5 rounded-lg border text-xs font-semibold ${
                        isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                  Revision-Specific Technical Attributes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Material
                    </label>
                    <input 
                      type="text" 
                      value={material} 
                      onChange={(e) => setMaterial(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Manufacturing Process
                    </label>
                    <input 
                      type="text" 
                      value={manufacturingProcess} 
                      onChange={(e) => setManufacturingProcess(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={weightKg} 
                      onChange={(e) => setWeightKg(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Length (mm)
                    </label>
                    <input 
                      type="number" 
                      value={lengthMm} 
                      onChange={(e) => setLengthMm(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Width (mm)
                    </label>
                    <input 
                      type="number" 
                      value={widthMm} 
                      onChange={(e) => setWidthMm(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Height (mm)
                    </label>
                    <input 
                      type="number" 
                      value={heightMm} 
                      onChange={(e) => setHeightMm(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      CAD File Format
                    </label>
                    <select
                      value={cadFormat}
                      onChange={(e) => setCadFormat(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="STEP">STEP (ISO 10303)</option>
                      <option value="SLDASM">SolidWorks Assembly (SLDASM)</option>
                      <option value="SLDPRT">SolidWorks Part (SLDPRT)</option>
                      <option value="IGES">IGES</option>
                      <option value="CATPART">CATIA V5</option>
                      <option value="NX">Siemens NX</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      CAD Software
                    </label>
                    <input 
                      type="text" 
                      value={cadSoftware} 
                      onChange={(e) => setCadSoftware(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Design Requirements
                    </label>
                    <input 
                      type="text" 
                      value={designRequirements} 
                      onChange={(e) => setDesignRequirements(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border border-dashed text-center space-y-3 ${
                isDark ? 'bg-[#111B2E] border-slate-700' : 'bg-slate-50 border-slate-300'
              }`}>
                <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-xs">Upload New Revision Engineering Documents</h4>
                  <p className="text-[11px] text-slate-400">
                    Upload updated 2D drawings (PDF), CAD models (STEP, SLDASM), or test reports for {newRevNumber}.
                  </p>
                </div>
                <label className="btn-primary btn-sm inline-flex items-center space-x-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Files to Upload</span>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.step,.stp,.sldprt,.sldasm,.iges,.xlsx,.csv,.docx"
                  />
                </label>
              </div>

              {uploadedRevisionFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Staged Files for {newRevNumber} ({uploadedRevisionFiles.length})
                  </h4>
                  {uploadedRevisionFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <div>
                          <strong className="text-slate-200 block text-xs">{file.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {file.docType} &bull; {file.size} &bull; Linked to {product.partNumber} ({newRevNumber})
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveUploadedFile(idx)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BOM COMPONENTS */}
          {activeTab === 'bom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400">
                    Revision BOM Components
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Adjust component quantities or add parts specific to revision {newRevNumber}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBomItem}
                  className="btn-secondary btn-sm cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Component</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                      isDark ? 'bg-[#111B2E] text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <th className="py-2 px-3">Part Number</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 w-20">Qty</th>
                      <th className="py-2 px-3 w-20">Unit</th>
                      <th className="py-2 px-3">Material</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {bomComponents.map((comp, idx) => (
                      <tr key={idx} className={isDark ? 'bg-[#0D1628]' : 'bg-white'}>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={comp.partNumber} 
                            onChange={(e) => handleBomChange(idx, 'partNumber', e.target.value)}
                            className={`w-full p-1 rounded border text-xs font-mono ${
                              isDark ? 'bg-[#111B2E] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={comp.name} 
                            onChange={(e) => handleBomChange(idx, 'name', e.target.value)}
                            className={`w-full p-1 rounded border text-xs ${
                              isDark ? 'bg-[#111B2E] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            min="1"
                            value={comp.quantity} 
                            onChange={(e) => handleBomChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className={`w-full p-1 rounded border text-xs font-mono ${
                              isDark ? 'bg-[#111B2E] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={comp.unit} 
                            onChange={(e) => handleBomChange(idx, 'unit', e.target.value)}
                            className={`w-full p-1 rounded border text-xs font-mono ${
                              isDark ? 'bg-[#111B2E] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="text" 
                            value={comp.material} 
                            onChange={(e) => handleBomChange(idx, 'material', e.target.value)}
                            className={`w-full p-1 rounded border text-xs ${
                              isDark ? 'bg-[#111B2E] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveBomItem(idx)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-[#111B2E]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Product ID: {product.id}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-cyan-400 font-bold font-mono">Next Rev: {newRevNumber}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary btn-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary btn-sm flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating Revision...' : `Release ${newRevNumber} (Draft)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
