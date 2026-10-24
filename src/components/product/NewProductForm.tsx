import React, { useState, useId } from 'react';
import { 
  Box, 
  Layers, 
  FileText, 
  Cpu, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  X,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import type { 
  PartItem, 
  PartType, 
  PartCategory, 
  LifecycleStage, 
  Revision, 
  BOMNode, 
  EngineeringDocument, 
  Project,
  StoredCadVaultFile
} from '../../types/plm';
import type { UserAccount } from '../../data/mockUsers';
import { useTheme } from '../../context/ThemeContext';
import { registerCadVaultFile } from '../../utils/cadVaultStorage';
import { preparePartForBackend, prepareDocumentForBackend } from '../../utils/safeStorage';
import { partsApi, bomApi, documentsApi } from '../../services/api';

interface NewProductFormProps {
  onCancel: () => void;
  onSuccess: (newProduct: PartItem, newDocs?: EngineeringDocument[], newBOM?: BOMNode) => void;
  existingParts: PartItem[];
  projects: Project[];
  currentUser: UserAccount;
  logAction: (action: string, category: any, targetId: string, details: string) => void;
}

interface StagedUploadFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: string;
  dataUrl: string;
  docType: string;
  description: string;
}

export const NewProductForm: React.FC<NewProductFormProps> = ({
  onCancel,
  onSuccess,
  existingParts,
  projects,
  currentUser,
  logAction
}) => {
  const { isDark } = useTheme();

  // Generate next permanent Product ID (e.g. PRD-0001, PRD-0002)
  const nextAutoPartId = React.useMemo(() => {
    const nums = existingParts.map(p => {
      const match = p.id.match(/(?:PRD|PN)-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const validNums = nums.filter(n => n > 0 && n < 1000);
    const max = validNums.length > 0 ? Math.max(...validNums) : 0;
    return `PRD-${String(max + 1).padStart(4, '0')}`;
  }, [existingParts]);

  // Generate next suggested Part Number (e.g. PART-0001)
  const nextSuggestedPartNumber = React.useMemo(() => {
    const nums = existingParts.map(p => {
      const match = p.partNumber.match(/(?:PART|PRD|PN)-?(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    });
    const validNums = nums.filter(n => n > 0 && n < 9000);
    const max = validNums.length > 0 ? Math.max(...validNums) : 0;
    return `PART-${String(max + 1).padStart(4, '0')}`;
  }, [existingParts]);

  // Section Navigation (0 = A, 1 = B, 2 = C, 3 = D, 4 = E, 5 = F)
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // SECTION A: BASIC PRODUCT INFORMATION
  const [productName, setProductName] = useState('');
  const [partNumber, setPartNumber] = useState(nextSuggestedPartNumber);
  const [productDescription, setProductDescription] = useState('High-performance engineered assembly designed for mission-critical reliability.');
  const [productCategory, setProductCategory] = useState<PartCategory>('CNC Machined');
  const [productType, setProductType] = useState<PartType>('Assembly');
  const [productFamily, setProductFamily] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [department, setDepartment] = useState('Mechanical Engineering');
  const [productOwner, setProductOwner] = useState(currentUser.name || '');
  const [designEngineer, setDesignEngineer] = useState(currentUser.name || '');
  const [manufacturingEngineer, setManufacturingEngineer] = useState('');
  const [qualityEngineer, setQualityEngineer] = useState('');
  const [productImage, setProductImage] = useState<string>('');
  const [tags, setTags] = useState('');

  // SECTION B: INITIAL REVISION (Rev 00 Draft)
  const [revisionNumber, setRevisionNumber] = useState('Rev 00');
  const [revisionDescription, setRevisionDescription] = useState('Initial baseline release');
  const [revisionStatus] = useState<'Draft'>('Draft');
  const [revisionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [createdBy] = useState(currentUser.name || 'Lead Engineer');
  const [changeReason, setChangeReason] = useState('Initial product release');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('design');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revisionNotes, setRevisionNotes] = useState('');

  // SECTION C: TECHNICAL INFORMATION
  const [material, setMaterial] = useState('');
  const [manufacturingProcess, setManufacturingProcess] = useState('');
  const [lengthMm, setLengthMm] = useState('450');
  const [widthMm, setWidthMm] = useState('680');
  const [heightMm, setHeightMm] = useState('1250');
  const [diameterMm, setDiameterMm] = useState('');
  const [weightKg, setWeightKg] = useState('24.5');
  const [units, setUnits] = useState('Millimeters (mm)');
  const [cadFileFormat, setCadFileFormat] = useState('STEP');
  const [cadSoftware, setCadSoftware] = useState('SolidWorks 2025 SP3');
  const [technicalSpecs, setTechnicalSpecs] = useState('Torque rating 180 Nm, IP67 ingress protection, operating temp -40C to 85C.');
  const [designRequirements, setDesignRequirements] = useState('Precision ISO 2768-mK geometric dimensioning & tolerancing.');
  const [safetyRequirements, setSafetyRequirements] = useState('UL 2271 battery enclosure containment and ISO 26262 ASIL-B compliance.');
  const [qualityRequirements, setQualityRequirements] = useState('100% CMM dimensional inspection and helium leak test.');

  // SECTION D: ENGINEERING DOCUMENTS
  const [stagedFiles, setStagedFiles] = useState<StagedUploadFile[]>([]);

  // SECTION E: BOM & COMPONENTS
  const [bomItems, setBomItems] = useState<Array<{
    partNumber: string;
    name: string;
    quantity: number;
    unit: string;
    findNumber: string;
    material: string;
    unitCost: number;
  }>>([
    { partNumber: 'PN-PGR-511', name: 'Precision Planet Gear 24T', quantity: 3, unit: 'pcs', findNumber: '10', material: '8620 Alloy Steel', unitCost: 85 },
    { partNumber: 'PN-SGN-520', name: 'Sun Gear Input Shaft 18T', quantity: 1, unit: 'pcs', findNumber: '20', material: '8620 Alloy Steel', unitCost: 110 },
    { partNumber: 'FST-M6-25-A4', name: 'Torx Flange Bolt M6x25mm Grade 10.9', quantity: 12, unit: 'pcs', findNumber: '30', material: 'Stainless 316', unitCost: 2.5 }
  ]);

  // Section List Definition
  const sections = [
    { id: 0, label: 'Section A', title: 'Basic Product Info', icon: Box },
    { id: 1, label: 'Section B', title: 'Initial Revision (Rev 0.0)', icon: Layers },
    { id: 2, label: 'Section C', title: 'Technical Specifications', icon: Cpu },
    { id: 3, label: 'Section D', title: `Documents (${stagedFiles.length})`, icon: FileText },
    { id: 4, label: 'Section E', title: `BOM Components (${bomItems.length})`, icon: FileSpreadsheet },
    { id: 5, label: 'Section F', title: 'Review & Save', icon: CheckCircle2 }
  ];

  // Document Upload Handler
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the maximum allowed 50MB limit.`);
        return;
      }

      const ext = file.name.split('.').pop()?.toUpperCase() || 'BIN';
      let docType = 'Technical Specification';
      if (['STEP', 'STP', 'SLDPRT', 'SLDASM', 'IGES'].includes(ext)) {
        docType = '3D CAD Model';
      } else if (ext === 'PDF') {
        docType = '2D Drawing PDF';
      } else if (['XLSX', 'CSV'].includes(ext)) {
        docType = file.name.toLowerCase().includes('fmea') ? 'DFMEA / PFMEA' : 'BOM File';
      } else if (['DOC', 'DOCX'].includes(ext)) {
        docType = 'Technical Specification';
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newStaged: StagedUploadFile = {
          id: `DOC-STG-${Date.now()}-${idx + 1}`,
          file,
          name: file.name,
          type: ext,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          dataUrl,
          docType,
          description: `Document uploaded during initial creation of ${partNumber}`
        };
        setStagedFiles(prev => [...prev, newStaged]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProductImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddBomItem = () => {
    setBomItems(prev => [
      ...prev,
      {
        partNumber: `CMP-${partNumber.replace(/[^a-zA-Z0-9]/g, '')}-${prev.length + 1}`,
        name: 'New Component Item',
        quantity: 1,
        unit: 'pcs',
        findNumber: String((prev.length + 1) * 10),
        material: 'Aluminum 6061-T6',
        unitCost: 25.0
      }
    ]);
  };

  const handleRemoveBomItem = (index: number) => {
    setBomItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleBomChange = (index: number, field: string, value: any) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Section Navigation Validation
  const handleNextSection = () => {
    setValidationError(null);
    if (currentSection === 0) {
      if (!productName.trim()) {
        setValidationError('Product Name is required.');
        return;
      }
      if (!partNumber.trim()) {
        setValidationError('Product Number / Part Number is required.');
        return;
      }
      // Check duplicate product number
      const duplicate = existingParts.some(p => p.partNumber.toLowerCase() === partNumber.trim().toLowerCase());
      if (duplicate) {
        setValidationError(`Product Number "${partNumber}" already exists in Product Master. Please enter a unique number.`);
        return;
      }
    } else if (currentSection === 1) {
      if (!revisionNumber.trim()) {
        setValidationError('Revision Number is required.');
        return;
      }
      if (!revisionDescription.trim()) {
        setValidationError('Revision Description is required.');
        return;
      }
    }
    setCurrentSection(prev => Math.min(prev + 1, 5));
  };

  const handlePrevSection = () => {
    setValidationError(null);
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  // SECTION F: SUBMIT & CREATE PRODUCT MASTER
  const handleFinalSubmit = async () => {
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const permanentProductId = nextAutoPartId;
      const today = new Date().toISOString().split('T')[0];
      const authorName = currentUser.name || 'Lead Engineer';
      const selectedProject = projects.find(p => p.id === projectId);

      // 1. Technical Specs Object
      const technicalSpecsObj = {
        material,
        manufacturingProcess,
        dimensions: `${lengthMm} x ${widthMm} x ${heightMm} mm`,
        length: lengthMm,
        width: widthMm,
        height: heightMm,
        diameter: diameterMm,
        weightKg: weightKg,
        units,
        cadFileFormat,
        cadSoftware,
        technicalSpecs,
        designRequirements,
        safetyRequirements,
        qualityRequirements
      };

      // 2. Process Staged Documents
      const newDocsToSave: EngineeringDocument[] = [];
      const newVaultFiles: StoredCadVaultFile[] = [];

      stagedFiles.forEach((f, idx) => {
        const docId = `DOC-${permanentProductId}-${Date.now()}-${idx + 1}`;
        const newDoc: EngineeringDocument = {
          id: docId,
          docNumber: `DOC-${revisionNumber.replace(/[^a-zA-Z0-9]/g, '')}-${partNumber.trim()}-${String(idx + 1).padStart(3, '0')}`,
          title: `${partNumber.trim()} — ${f.name}`,
          type: f.docType as any,
          linkedPartId: permanentProductId,
          revision: revisionNumber,
          author: authorName,
          uploadDate: today,
          fileSize: f.size,
          status: 'Approved',
          fileUrl: f.dataUrl,
          fileName: f.name,
          fileExtension: f.type.toLowerCase(),
          description: f.description || `Engineering document for ${partNumber} ${revisionNumber}`
        };
        newDocsToSave.push(newDoc);

        const vaultFile: StoredCadVaultFile = {
          id: `VAULT-${docId}`,
          productId: permanentProductId,
          partNumber: partNumber.trim(),
          projectId: projectId,
          projectName: selectedProject?.name || 'Unassigned Project',
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

      // 3. Assemble Initial Revision (Rev 0.0)
      const initialRevisionRecord: Revision = {
        revId: revisionNumber.trim(),
        date: today,
        author: authorName,
        changeSummary: revisionDescription.trim(),
        status: 'Draft',
        description: revisionDescription.trim(),
        changeReason: changeReason.trim(),
        lifecycleStage,
        effectiveDate,
        revisionNotes,
        technicalSpecs: technicalSpecsObj,
        attachedDocIds: newDocsToSave.map(d => d.id),
        attachedFiles: newVaultFiles,
        bomSnapshot: bomItems.map((item, idx) => ({
          id: `BOM-${permanentProductId}-C${idx + 1}`,
          partId: `PN-${permanentProductId}-${idx + 1}`,
          partNumber: item.partNumber,
          name: item.name,
          revision: revisionNumber.trim(),
          quantity: item.quantity,
          unit: item.unit,
          refDes: item.findNumber,
          material: item.material,
          unitCost: item.unitCost,
          weightKg: 1
        }))
      };

      // 4. Primary 3D & 2D Files Identification
      const primary3D = stagedFiles.find(f => ['STEP', 'STP', 'SLDPRT', 'SLDASM', 'IGES'].includes(f.type.toUpperCase()));
      const primary2D = stagedFiles.find(f => f.type.toUpperCase() === 'PDF');

      // 5. Build Complete ProductMaster Record
      const newProduct: PartItem = {
        id: permanentProductId,
        partNumber: partNumber.trim(),
        name: productName.trim(),
        description: productDescription.trim(),
        type: productType,
        category: productCategory,
        material: material,
        weightKg: parseFloat(weightKg) || 0,
        estimatedCost: bomItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0) + 150,
        actualCost: bomItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0) + 120,
        currentRev: revisionNumber.trim(),
        lifecycleStage: lifecycleStage,
        isCheckedOut: false,
        projectId: projectId,
        projectName: selectedProject?.name || 'Unassigned Project',
        completionPercent: 30,
        productStatus: 'DRAFT',
        productFamily,
        customerName,
        department,
        productOwner,
        designEngineer,
        manufacturingEngineer,
        qualityEngineer,
        productImage: productImage || undefined,
        technicalSpecs: technicalSpecsObj,
        initialRev: revisionNumber.trim(),
        activeRev: revisionNumber.trim(),
        cadMetadata: {
          fileName: primary3D?.name || `${partNumber.trim()}.${cadFileFormat.toLowerCase()}`,
          format: cadFileFormat as any,
          fileSize: primary3D?.size || '15.4 MB',
          surfaceAreaCm2: 1200,
          volumeCm3: 850,
          boundingDimensionsMm: [
            parseFloat(lengthMm) || 100,
            parseFloat(widthMm) || 100,
            parseFloat(heightMm) || 50
          ],
          geometryType: productType === 'Assembly' || productType === 'Sub-Assembly' ? 'ev_drivetrain' : 'structural_bracket',
          renderColor: '#0ea5e9',
          cadFile: primary3D?.dataUrl,
          stepFile: primary3D?.dataUrl,
          pdfFile: primary2D?.dataUrl,
          attachedFiles: newVaultFiles
        },
        revisionHistory: [initialRevisionRecord],
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      // 6. Build Initial BOM Root Node
      const newBOMRoot: BOMNode = {
        id: `BOM-${permanentProductId}`,
        partId: permanentProductId,
        partNumber: newProduct.partNumber,
        name: newProduct.name,
        revision: revisionNumber.trim(),
        quantity: 1,
        unit: 'EA',
        material: material,
        unitCost: newProduct.estimatedCost,
        weightKg: newProduct.weightKg,
        children: initialRevisionRecord.bomSnapshot
      };

      // 7. Optimistically notify parent and transition UI immediately (instant UX)
      onSuccess(newProduct, newDocsToSave, newBOMRoot);

      // 8. Record Enterprise Audit Log
      logAction(
        'Created Product Master',
        'ITEM_MASTER',
        newProduct.partNumber,
        `Created Product Master "${newProduct.name}" (${newProduct.partNumber}, ID: ${newProduct.id}) with initial revision ${revisionNumber} and ${newDocsToSave.length} attached documents.`
      );

      // 9. Persist lightweight sanitized metadata to MongoDB Atlas in background
      const backendProduct = preparePartForBackend(newProduct);
      const backendDocs = newDocsToSave.map(prepareDocumentForBackend);

      Promise.allSettled([
        partsApi.create(backendProduct),
        bomApi.save(permanentProductId, newBOMRoot, projectId),
        ...backendDocs.map(doc => documentsApi.create(doc))
      ]).then((results) => {
        const partResult = results[0];
        if (partResult.status === 'fulfilled' && (partResult.value as any)?.part) {
          const savedPart = (partResult.value as any).part;
          const finalId = savedPart.id || savedPart._id;
          if (finalId && finalId !== permanentProductId) {
            window.dispatchEvent(new CustomEvent('plm:part-id-update', {
              detail: { oldId: permanentProductId, newId: finalId }
            }));
          }
        }
      }).catch(err => {
        console.warn('Background MongoDB part save warning:', err);
      });
    } catch (err: any) {
      console.error('Failed to create product master:', err);
      setValidationError(err.message || 'Failed to create product master. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 font-sans">
      {/* Top Banner */}
      <div className={`rounded-2xl p-6 border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                CREATE NEW PRODUCT MASTER
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Permanent ID: {nextAutoPartId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise 6-Section Product Definition: Specifications, Rev 0.0 baseline, CAD files, and multi-level BOM.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary btn-sm flex items-center space-x-1.5 cursor-pointer text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Directory</span>
        </button>
      </div>

      {/* 6-Section Tab Navigation */}
      <div className={`rounded-xl border p-2 flex items-center space-x-1.5 overflow-x-auto shadow-sm ${
        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = currentSection === sec.id;
          const isPassed = currentSection > sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setValidationError(null);
                setCurrentSection(sec.id);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center space-x-2 transition-all ${
                isActive
                  ? isDark 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                    : 'bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm'
                  : isPassed
                  ? isDark 
                    ? 'text-emerald-400 hover:bg-slate-800/40' 
                    : 'text-emerald-700 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive 
                  ? 'bg-cyan-500 text-white' 
                  : isPassed 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {sec.id + 1}
              </div>
              <span className="hidden sm:inline">{sec.title}</span>
            </button>
          );
        })}
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 flex items-center space-x-2 text-xs animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className={`rounded-2xl p-6 border shadow-md space-y-6 transition-colors ${
        isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* ================= SECTION A: BASIC PRODUCT INFORMATION ================= */}
        {currentSection === 0 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section A — Basic Product Information
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  General identification, categorization, ownership, and project association.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 1 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={productName} 
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Electric Scooter Drivetrain & Frame Assembly"
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Number / Part Number <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={partNumber} 
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g. ASM-EV-9000 or PRD-EV-9001"
                  className={`w-full p-2.5 rounded-lg border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-300 text-cyan-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Category
                </label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value as PartCategory)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="CNC Machined">CNC Machined</option>
                  <option value="Sheet Metal">Sheet Metal</option>
                  <option value="Injection Molded">Injection Molded</option>
                  <option value="Cast Metal">Cast Metal</option>
                  <option value="Electrical/Sensors">Electrical / Sensors</option>
                  <option value="Fastener/Hardware">Fastener / Hardware</option>
                  <option value="Composite/Carbon">Composite / Carbon</option>
                  <option value="Composite Assembly">Composite Assembly</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as PartType)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Assembly">Assembly</option>
                  <option value="Sub-Assembly">Sub-Assembly</option>
                  <option value="Component">Component</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Fastener">Fastener</option>
                  <option value="Tooling">Tooling</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Family
                </label>
                <input 
                  type="text" 
                  value={productFamily} 
                  onChange={(e) => setProductFamily(e.target.value)}
                  placeholder="e.g. Electric Powertrain, Chassis, Battery"
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Project Association
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {projects.map(prj => (
                    <option key={prj.id} value={prj.id}>
                      {prj.code} — {prj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer or OEM Partner"
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input 
                  type="text" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Mechanical Design, R&D"
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Owner
                </label>
                <input 
                  type="text" 
                  value={productOwner} 
                  onChange={(e) => setProductOwner(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Design Engineer
                </label>
                <input 
                  type="text" 
                  value={designEngineer} 
                  onChange={(e) => setDesignEngineer(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Manufacturing Engineer
                </label>
                <input 
                  type="text" 
                  value={manufacturingEngineer} 
                  onChange={(e) => setManufacturingEngineer(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Quality Engineer
                </label>
                <input 
                  type="text" 
                  value={qualityEngineer} 
                  onChange={(e) => setQualityEngineer(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea 
                  rows={2}
                  value={productDescription} 
                  onChange={(e) => setProductDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tags &amp; Keywords (Comma separated)
                </label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Product Image (Optional)
                </label>
                <label className="btn-secondary btn-sm w-full flex items-center justify-center space-x-1 cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{productImage ? 'Image Loaded' : 'Upload Image'}</span>
                  <input type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION B: INITIAL REVISION ================= */}
        {currentSection === 1 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section B — Initial Revision Setup (Rev 0.0)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every product starts with Rev 0.0 in Draft status. Future revisions branch without destroying history.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 2 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Starting Revision Number <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={revisionNumber} 
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-300 text-amber-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Revision Status
                </label>
                <input 
                  type="text" 
                  value="Draft (Under Development)" 
                  disabled 
                  className={`w-full p-2.5 rounded-lg border text-xs font-semibold ${
                    isDark ? 'bg-slate-800/50 border-slate-700 text-amber-400' : 'bg-slate-200 border-slate-300 text-amber-700'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Created Date
                </label>
                <input 
                  type="text" 
                  value={revisionDate} 
                  disabled 
                  className={`w-full p-2.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Revision Description <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={revisionDescription} 
                  onChange={(e) => setRevisionDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Author / Created By
                </label>
                <input 
                  type="text" 
                  value={createdBy} 
                  disabled 
                  className={`w-full p-2.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Change Reason
                </label>
                <input 
                  type="text" 
                  value={changeReason} 
                  onChange={(e) => setChangeReason(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                  Effective Date
                </label>
                <input 
                  type="date" 
                  value={effectiveDate} 
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Revision Notes
                </label>
                <input 
                  type="text" 
                  value={revisionNotes} 
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION C: TECHNICAL INFORMATION ================= */}
        {currentSection === 2 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section C — Technical Information &amp; Engineering Parameters
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parametric attributes stored specifically for revision {revisionNumber}.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 3 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Material
                </label>
                <input 
                  type="text" 
                  value={material} 
                  onChange={(e) => setMaterial(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  CAD File Format
                </label>
                <select
                  value={cadFileFormat}
                  onChange={(e) => setCadFileFormat(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="STEP">STEP (ISO 10303 AP214/242)</option>
                  <option value="SLDASM">SolidWorks Assembly (SLDASM)</option>
                  <option value="SLDPRT">SolidWorks Part (SLDPRT)</option>
                  <option value="IGES">IGES</option>
                  <option value="CATPART">CATIA V5 Part</option>
                  <option value="NX">Siemens NX Part</option>
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Units
                </label>
                <select
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-pointer ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Millimeters (mm)">Millimeters (mm)</option>
                  <option value="Inches (in)">Inches (in)</option>
                  <option value="Meters (m)">Meters (m)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Technical Specifications
                </label>
                <textarea 
                  rows={2}
                  value={technicalSpecs} 
                  onChange={(e) => setTechnicalSpecs(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
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
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Safety Requirements
                </label>
                <input 
                  type="text" 
                  value={safetyRequirements} 
                  onChange={(e) => setSafetyRequirements(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Quality Requirements
                </label>
                <input 
                  type="text" 
                  value={qualityRequirements} 
                  onChange={(e) => setQualityRequirements(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION D: ENGINEERING DOCUMENTS ================= */}
        {currentSection === 3 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section D — Engineering Documents Upload
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach actual files (PDF drawings, CAD models, BOM sheets, DFMEA) linked directly to {partNumber} ({revisionNumber}).
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Step 4 of 6</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className={`p-8 rounded-2xl border-2 border-dashed text-center space-y-3 transition-colors ${
              isDark ? 'bg-[#0D1628] border-slate-700 hover:border-cyan-500/60' : 'bg-slate-50 border-slate-300 hover:border-cyan-500/60'
            }`}>
              <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">Select Engineering Files to Attach</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Supports 2D Drawings (PDF), 3D CAD (STEP, STP, SLDPRT, SLDASM), BOM spreadsheets (XLSX, CSV), DFMEA, and Inspection Reports.
                </p>
              </div>

              <label className="btn-primary btn-sm inline-flex items-center space-x-2 cursor-pointer shadow-md shadow-cyan-500/20">
                <Plus className="w-4 h-4" />
                <span>Browse Files</span>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFilesSelected} 
                  className="hidden" 
                  accept=".pdf,.step,.stp,.sldprt,.sldasm,.iges,.xlsx,.csv,.docx"
                />
              </label>
              <div className="text-[10px] text-slate-500 font-mono">Max file size: 50MB per document</div>
            </div>

            {/* List of Staged Files */}
            {stagedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Staged Documents ({stagedFiles.length})</span>
                  <span className="text-[10px] font-mono text-cyan-400">Linked to {revisionNumber}</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {stagedFiles.map((file) => (
                    <div 
                      key={file.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isDark ? 'bg-[#0D1628] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-slate-200 block text-xs">{file.name}</strong>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                              {file.type}
                            </span>
                            <span>{file.size}</span>
                            <span>&bull;</span>
                            <span className="text-purple-400 font-semibold">{file.docType}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStagedFile(file.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION E: BOM AND COMPONENTS ================= */}
        {currentSection === 4 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section E — BOM and Components
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define the components and sub-assemblies for {partNumber} ({revisionNumber}).
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
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'bg-[#0D1628] text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-2 px-3 w-16">Find #</th>
                    <th className="py-2 px-3">Component Part #</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 w-20">Qty</th>
                    <th className="py-2 px-3 w-20">Unit</th>
                    <th className="py-2 px-3">Material</th>
                    <th className="py-2 px-3 w-24">Unit Cost ($)</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {bomItems.map((item, idx) => (
                    <tr key={idx} className={isDark ? 'bg-[#111B2E]' : 'bg-white'}>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          value={item.findNumber} 
                          onChange={(e) => handleBomChange(idx, 'findNumber', e.target.value)}
                          className={`w-full p-1 rounded border text-xs font-mono text-center ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          value={item.partNumber} 
                          onChange={(e) => handleBomChange(idx, 'partNumber', e.target.value)}
                          className={`w-full p-1 rounded border text-xs font-mono ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleBomChange(idx, 'name', e.target.value)}
                          className={`w-full p-1 rounded border text-xs ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={(e) => handleBomChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className={`w-full p-1 rounded border text-xs font-mono text-center ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          value={item.unit} 
                          onChange={(e) => handleBomChange(idx, 'unit', e.target.value)}
                          className={`w-full p-1 rounded border text-xs font-mono text-center ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="text" 
                          value={item.material} 
                          onChange={(e) => handleBomChange(idx, 'material', e.target.value)}
                          className={`w-full p-1 rounded border text-xs ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.unitCost} 
                          onChange={(e) => handleBomChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                          className={`w-full p-1 rounded border text-xs font-mono ${
                            isDark ? 'bg-[#0D1628] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
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

        {/* ================= SECTION F: REVIEW AND SAVE ================= */}
        {currentSection === 5 && (
          <div className="space-y-5">
            <div className="border-b pb-3 border-slate-700/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Section F — Review and Save Product Master
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm all product specifications, initial revision, documents, and BOM before writing to PLM master database.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">READY TO RELEASE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Product Info Card */}
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block border-b pb-1 border-slate-700/30">
                  Product Master Identification
                </span>
                <div className="space-y-1 text-slate-300">
                  <div>Name: <strong className="text-white">{productName || 'Not specified'}</strong></div>
                  <div>Product Number: <strong className="font-mono text-cyan-400">{partNumber}</strong></div>
                  <div>Permanent ID: <span className="font-mono text-purple-400">{nextAutoPartId}</span></div>
                  <div>Category / Type: <span>{productCategory} &bull; {productType}</span></div>
                  <div>Family: <span>{productFamily}</span></div>
                  <div>Project: <span>{projects.find(p => p.id === projectId)?.name || projectId}</span></div>
                  <div>Product Owner: <span>{productOwner}</span></div>
                </div>
              </div>

              {/* Revision Card */}
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block border-b pb-1 border-slate-700/30">
                  Initial Revision Baseline
                </span>
                <div className="space-y-1 text-slate-300">
                  <div>Revision: <strong className="font-mono text-amber-400">{revisionNumber}</strong></div>
                  <div>Status: <span className="font-semibold text-amber-400">Draft</span></div>
                  <div>Stage: <span className="uppercase font-semibold">{lifecycleStage}</span></div>
                  <div>Author: <span>{createdBy}</span></div>
                  <div>Description: <span className="text-slate-400">{revisionDescription}</span></div>
                  <div>Change Reason: <span className="text-slate-400">{changeReason}</span></div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block border-b pb-1 border-slate-700/30">
                  Technical Specifications
                </span>
                <div className="space-y-1 text-slate-300">
                  <div>Material: <strong>{material}</strong></div>
                  <div>Process: <span>{manufacturingProcess}</span></div>
                  <div>Dimensions: <span className="font-mono">{lengthMm} x {widthMm} x {heightMm} mm</span></div>
                  <div>Weight: <span className="font-mono">{weightKg} kg</span></div>
                  <div>CAD Format &amp; Tool: <span>{cadFileFormat} ({cadSoftware})</span></div>
                </div>
              </div>

              {/* Staged Documents & BOM Summary */}
              <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block border-b pb-1 border-slate-700/30">
                  Associated Files &amp; BOM Summary
                </span>
                <div className="space-y-1 text-slate-300">
                  <div>Attached Documents: <strong className="text-cyan-400">{stagedFiles.length} files staged</strong></div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {stagedFiles.map(f => f.name).join(', ') || 'No files attached'}
                  </div>
                  <div className="pt-1">BOM Components: <strong className="text-purple-400">{bomItems.length} components</strong></div>
                  <div className="text-[11px] text-slate-400">
                    Est. Direct Material Cost: ${bomItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="border-t pt-4 border-slate-700/30 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSection === 0}
            className={`btn-secondary cursor-pointer flex items-center space-x-1.5 ${
              currentSection === 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Section</span>
          </button>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Section {currentSection + 1} of 6 &bull; {sections[currentSection].title}
          </span>

          {currentSection < 5 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="btn-primary cursor-pointer flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
            >
              <span>Next Section</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="btn-primary cursor-pointer flex items-center space-x-2 shadow-lg shadow-cyan-500/25 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Product Master...' : 'Save & Release Product Master'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
