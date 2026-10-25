import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Layers, 
  Box, 
  FileText, 
  Cpu, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Image as ImageIcon,
  Edit,
  Tag,
  Building,
  Users,
  DollarSign
} from 'lucide-react';
import type { 
  PartItem, 
  PartType, 
  PartCategory, 
  LifecycleStage, 
  Project 
} from '../../types/plm';
import type { UserAccount } from '../../data/mockUsers';
import { useTheme } from '../../context/ThemeContext';
import { partsApi } from '../../services/api';
import { preparePartForBackend } from '../../utils/safeStorage';

interface EditProductModalProps {
  product: PartItem;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  projects?: Project[];
  existingParts?: PartItem[];
  onProductUpdated: (updatedProduct: PartItem) => void;
  logAction?: (action: string, category: any, targetId: string, details: string) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  currentUser,
  projects = [],
  existingParts = [],
  onProductUpdated,
  logAction
}) => {
  const { isDark } = useTheme();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'general' | 'lifecycle' | 'engineers' | 'specs' | 'image'>('general');

  // Form State
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PartCategory>('CNC Machined');
  const [type, setType] = useState<PartType>('Component');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('design');
  const [productStatus, setProductStatus] = useState<string>('IN PROGRESS');
  const [productFamily, setProductFamily] = useState('');
  const [projectId, setProjectId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [department, setDepartment] = useState('');
  
  // Engineers
  const [productOwner, setProductOwner] = useState('');
  const [designEngineer, setDesignEngineer] = useState('');
  const [manufacturingEngineer, setManufacturingEngineer] = useState('');
  const [qualityEngineer, setQualityEngineer] = useState('');

  // Technical Specs
  const [material, setMaterial] = useState('');
  const [weightKg, setWeightKg] = useState<number | string>(0);
  const [dimensions, setDimensions] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | string>(0);
  const [actualCost, setActualCost] = useState<number | string>(0);
  const [productImage, setProductImage] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync state when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      setName(product.name || '');
      setPartNumber(product.partNumber || '');
      setDescription(product.description || '');
      setCategory(product.category || 'CNC Machined');
      setType(product.type || 'Component');
      setLifecycleStage(product.lifecycleStage || 'design');
      setProductStatus(product.productStatus || 'IN PROGRESS');
      setProductFamily(product.productFamily || '');
      setProjectId(product.projectId || '');
      setCustomerName(product.customerName || '');
      setDepartment(product.department || 'Mechanical Engineering');

      setProductOwner(product.productOwner || product.createdBy || currentUser?.name || '');
      setDesignEngineer(product.designEngineer || 'Alex Rivera, PE');
      setManufacturingEngineer(product.manufacturingEngineer || 'Marcus Vance');
      setQualityEngineer(product.qualityEngineer || 'Dr. Elena Rostova');

      setMaterial(product.material || product.technicalSpecs?.material || 'Aluminum 6061-T6');
      setWeightKg(product.weightKg ?? product.technicalSpecs?.weightKg ?? 0);
      setDimensions(product.technicalSpecs?.dimensions || (product.envelopeDimensions ? `${product.envelopeDimensions.x} x ${product.envelopeDimensions.y} x ${product.envelopeDimensions.z} mm` : ''));
      setEstimatedCost(product.estimatedCost ?? 0);
      setActualCost(product.actualCost ?? 0);
      setProductImage(product.productImage || '');

      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, product, currentUser]);

  if (!isOpen || !product) return null;

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Product name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Product name must be at least 2 characters.';
    }

    if (!partNumber.trim()) {
      errs.partNumber = 'Part Number is required.';
    } else {
      // Check for duplicate part numbers (excluding current product)
      const duplicate = existingParts.some(
        (p) => p.id !== product.id && p.partNumber.toLowerCase() === partNumber.trim().toLowerCase()
      );
      if (duplicate) {
        errs.partNumber = `Part Number "${partNumber}" is already in use by another item.`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Image Upload handler
  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const selectedProj = projects.find((p) => p.id === projectId || p.code === projectId);

      // Parse dimensions for bounding box and envelope
      const dimNumbers = dimensions
        .split(/[xX*,\s]+/)
        .map((n) => parseFloat(n.trim()))
        .filter((n) => !isNaN(n));

      const updatedTechnicalSpecs = {
        ...(product.technicalSpecs || {}),
        material: material.trim(),
        dimensions: dimensions.trim() || undefined,
        weightKg: Number(weightKg) || 0,
      };

      const updatedRevHistory = (product.revisionHistory || []).map((r) => {
        if (r.revId === product.currentRev) {
          return {
            ...r,
            technicalSpecs: {
              ...(r.technicalSpecs || {}),
              ...updatedTechnicalSpecs,
            },
          };
        }
        return r;
      });

      // Build updated product object
      const updatedProduct: PartItem = {
        ...product,
        name: name.trim(),
        partNumber: partNumber.trim(),
        description: description.trim(),
        category,
        type,
        lifecycleStage,
        productStatus,
        productFamily: productFamily.trim() || undefined,
        projectId: projectId || undefined,
        projectName: selectedProj?.name || product.projectName || undefined,
        customerName: customerName.trim() || undefined,
        department: department.trim() || undefined,
        productOwner: productOwner.trim() || undefined,
        designEngineer: designEngineer.trim() || undefined,
        manufacturingEngineer: manufacturingEngineer.trim() || undefined,
        qualityEngineer: qualityEngineer.trim() || undefined,
        material: material.trim(),
        weightKg: Number(weightKg) || 0,
        estimatedCost: Number(estimatedCost) || 0,
        actualCost: Number(actualCost) || 0,
        productImage: productImage || undefined,
        envelopeDimensions:
          dimNumbers.length >= 3
            ? { x: dimNumbers[0], y: dimNumbers[1], z: dimNumbers[2] }
            : product.envelopeDimensions,
        cadMetadata: {
          ...product.cadMetadata,
          boundingDimensionsMm:
            dimNumbers.length >= 3 
              ? [dimNumbers[0], dimNumbers[1], dimNumbers[2]] as [number, number, number] 
              : product.cadMetadata?.boundingDimensionsMm,
        },
        technicalSpecs: updatedTechnicalSpecs,
        revisionHistory: updatedRevHistory.length > 0 ? updatedRevHistory : product.revisionHistory,
      };

      // 1. Update in local state via callback
      onProductUpdated(updatedProduct);

      // 2. Persist to MongoDB backend if available
      try {
        const payload = preparePartForBackend(updatedProduct);
        await partsApi.update(product.id, payload);
      } catch (backendErr: any) {
        console.warn('[EditProductModal] Backend update fallback to localStorage:', backendErr.message);
      }

      // 3. Log Audit Trail
      if (logAction) {
        logAction(
          'Updated Product Master',
          'ITEM_MASTER',
          updatedProduct.partNumber,
          `Updated specifications for "${updatedProduct.name}" (${updatedProduct.partNumber}) by ${currentUser.name}`
        );
      }

      onClose();
    } catch (err: any) {
      console.error('[EditProductModal] Error updating product:', err);
      setErrors({ form: err.message || 'Failed to update product specifications.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="plm-modal-backdrop">
      <div className="plm-modal-card max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border text-cyan-400 ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  {product.partNumber}
                </span>
                <span className="badge-status badge-active text-[10px]">
                  {product.currentRev || 'Rev 00'}
                </span>
                <span className="badge-status badge-draft text-[10px] uppercase">
                  {lifecycleStage}
                </span>
              </div>
              <h2 className={`text-base font-bold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Edit Product Master Specifications: <span className="text-cyan-400">{product.name}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center px-6 border-b text-xs font-semibold overflow-x-auto shrink-0 ${
          isDark ? 'bg-[#111B2E] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>1. General & Attributes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'lifecycle'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Classification & Lifecycle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engineers')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'engineers'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Engineers & Ownership</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>4. Technical Baseline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'image'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>5. Photo & Media</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* TAB 1: GENERAL & ATTRIBUTES */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Planetary Gearbox Casing"
                    className={`plm-input w-full text-xs font-semibold ${errors.name ? 'border-rose-500' : ''}`}
                  />
                  {errors.name && <span className="text-[11px] text-rose-500 mt-1 block">{errors.name}</span>}
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Product / Part Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder="e.g. PART-0001"
                    className={`plm-input w-full text-xs font-mono font-bold ${errors.partNumber ? 'border-rose-500' : ''}`}
                  />
                  {errors.partNumber && <span className="text-[11px] text-rose-500 mt-1 block">{errors.partNumber}</span>}
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description & Functional Scope
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of product assembly and operational specifications..."
                  className="plm-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Product Family
                  </label>
                  <input
                    type="text"
                    value={productFamily}
                    onChange={(e) => setProductFamily(e.target.value)}
                    placeholder="e.g. Electric Mobility"
                    className="plm-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Associated Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="plm-select w-full text-xs"
                  >
                    <option value="">Unassigned Project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.code || proj.id} — {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Customer / OEM
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Apex Mobility Global"
                    className="plm-input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Mechanical Engineering"
                  className="plm-input w-full text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CLASSIFICATION & LIFECYCLE */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Part Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PartType)}
                    className="plm-select w-full text-xs font-semibold"
                  >
                    <option value="Component">Component</option>
                    <option value="Assembly">Assembly</option>
                    <option value="Sub-Assembly">Sub-Assembly</option>
                    <option value="Fastener">Fastener / Hardware</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Tooling">Tooling</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Manufacturing Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PartCategory)}
                    className="plm-select w-full text-xs font-semibold"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Lifecycle Stage
                  </label>
                  <select
                    value={lifecycleStage}
                    onChange={(e) => setLifecycleStage(e.target.value as LifecycleStage)}
                    className="plm-select w-full text-xs font-semibold"
                  >
                    <option value="concept">Concept</option>
                    <option value="design">Design</option>
                    <option value="prototype">Prototype</option>
                    <option value="tooling">Tooling</option>
                    <option value="production">Production</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Product Status
                  </label>
                  <select
                    value={productStatus}
                    onChange={(e) => setProductStatus(e.target.value)}
                    className="plm-select w-full text-xs font-semibold"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON HOLD">ON HOLD</option>
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-xs text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Revision Control Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-secondary block">Permanent ID:</span>
                    <span className="font-bold text-primary">{product.id}</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Active Revision:</span>
                    <span className="font-bold text-emerald-400">{product.currentRev || 'Rev 00'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINEERS & OWNERSHIP */}
          {activeTab === 'engineers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Product Owner
                  </label>
                  <input
                    type="text"
                    value={productOwner}
                    onChange={(e) => setProductOwner(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="plm-input w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Lead Design Engineer
                  </label>
                  <input
                    type="text"
                    value={designEngineer}
                    onChange={(e) => setDesignEngineer(e.target.value)}
                    placeholder="e.g. Alex Rivera, PE"
                    className="plm-input w-full text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Manufacturing Engineer
                  </label>
                  <input
                    type="text"
                    value={manufacturingEngineer}
                    onChange={(e) => setManufacturingEngineer(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="plm-input w-full text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Quality Engineer
                  </label>
                  <input
                    type="text"
                    value={qualityEngineer}
                    onChange={(e) => setQualityEngineer(e.target.value)}
                    placeholder="e.g. Dr. Elena Rostova"
                    className="plm-input w-full text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL BASELINE */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Material
                  </label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Aluminum 6061-T6"
                    className="plm-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 24.5"
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Dimensions (L x W x H mm)
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="e.g. 450 x 680 x 1250 mm"
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 flex items-center space-x-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated Direct Cost ($)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0.00"
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 flex items-center space-x-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Actual Cost ($)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    placeholder="0.00"
                    className="plm-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PHOTO & MEDIA */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Product Master Photo
                  </h4>
                  <p className="text-[11px] text-secondary">
                    Attach rendered photograph, 3D render, or inspection photo.
                  </p>
                </div>
                {productImage && (
                  <button
                    type="button"
                    onClick={() => setProductImage('')}
                    className="text-rose-500 hover:text-rose-400 text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {productImage ? (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
                  isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <img
                    src={productImage}
                    alt={name}
                    className="w-48 h-36 object-cover rounded-xl border border-cyan-500/30 shadow-md"
                  />
                  <div className="space-y-2 flex-1">
                    <span className="badge-status badge-active text-[10px]">Active Product Photo</span>
                    <p className="text-xs text-secondary">
                      This photo is displayed in product directories, detail views, and engineering documentation summaries.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('edit-prod-file-input') as HTMLInputElement;
                        input?.click();
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => {
                    const input = document.getElementById('edit-prod-file-input') as HTMLInputElement;
                    input?.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : isDark
                      ? 'border-slate-800 hover:border-cyan-500/50 bg-[#0D1628]'
                      : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Click to upload photo or drag & drop here
                    </div>
                    <div className="text-[11px] text-secondary">
                      PNG, JPG, WEBP up to 5MB
                    </div>
                  </div>
                </div>
              )}

              <input
                id="edit-prod-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              <div>
                <label className={`block font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Or Paste Image URL directly:
                </label>
                <input
                  type="text"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="plm-input w-full text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#0D1628] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-secondary">
            Pressing Save will update item master specifications and audit trail immediately.
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="btn-primary btn-sm flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Product Changes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
