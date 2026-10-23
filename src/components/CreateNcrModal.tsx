import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  UploadCloud, 
  FileText, 
  Paperclip, 
  Trash2, 
  Layers, 
  Wrench, 
  Cpu, 
  Calendar, 
  User, 
  Building2, 
  Plus, 
  Hash, 
  AlertCircle 
} from 'lucide-react';
import type { QualityNCR, PartItem, NcrSeverity, NcrStatus, NcrType, NcrAttachment } from '../types/plm';

interface CreateNcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNcrs: QualityNCR[];
  partsMap: Record<string, PartItem>;
  currentUser?: { name: string; email?: string; role?: string } | null;
  onSave: (ncr: QualityNCR) => void;
}

export const getNextNcrNumber = (existingNcrs: QualityNCR[]): string => {
  let highestNum = 88902;
  existingNcrs.forEach((ncr) => {
    const match = ncr.ncrNumber?.match(/NCR-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > highestNum) highestNum = num;
    }
  });
  return `NCR-${highestNum + 1}`;
};

export const CreateNcrModal: React.FC<CreateNcrModalProps> = ({
  isOpen,
  onClose,
  existingNcrs,
  partsMap,
  currentUser,
  onSave
}) => {
  const autoNcrNumber = getNextNcrNumber(existingNcrs);

  // Tab State for Multi-section Form
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'details' | 'rootCause' | 'quality' | 'attachments'>('general');

  // Form State
  const [ncrNumber] = useState<string>(autoNcrNumber);
  const [title, setTitle] = useState<string>('');
  const [ncrType, setNcrType] = useState<string>('In-Process Machining');
  const [severity, setSeverity] = useState<NcrSeverity>('Major');
  const [status, setStatus] = useState<NcrStatus>('Open');
  const [dateDetected, setDateDetected] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detectedBy, setDetectedBy] = useState<string>(currentUser?.name || 'Inspector J. Miller (CMM Lab)');
  const [department, setDepartment] = useState<string>('CNC Machining Shop');
  const [targetPartNumber, setTargetPartNumber] = useState<string>('PN-1004');
  const [productAssembly, setProductAssembly] = useState<string>('ASM-GBX-5000 Planetary Gearbox');
  const [workOrder, setWorkOrder] = useState<string>('WO-2026-0884');
  const [machineEquipment, setMachineEquipment] = useState<string>('Mazak INTEGREX e-420H CNC #01');

  // Non-conformance Details
  const [nonConformanceDescription, setNonConformanceDescription] = useState<string>('');
  const [specificationRequirement, setSpecificationRequirement] = useState<string>('Concentricity <= 12.0 µm, Ra < 1.6 µm');
  const [actualCondition, setActualCondition] = useState<string>('');
  const [expectedCondition, setExpectedCondition] = useState<string>('');
  const [quantityAffected, setQuantityAffected] = useState<number>(1);
  const [defectLocation, setDefectLocation] = useState<string>('Op 30 Bearing Seat Bore');

  // Root Cause
  const [rootCauseCategory, setRootCauseCategory] = useState<string>('Tooling Wear / Thermal Drift');
  const [rootCauseDescription, setRootCauseDescription] = useState<string>('');
  const [containmentAction, setContainmentAction] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');
  const [preventiveAction, setPreventiveAction] = useState<string>('');

  // Quality Info
  const [inspectionMethod, setInspectionMethod] = useState<string>('Zeiss Coordinate Measuring Machine (CMM)');
  const [inspectionResult, setInspectionResult] = useState<string>('NON-CONFORMING - Out of Tolerance');
  const [measurementValue, setMeasurementValue] = useState<string>('');
  const [specificationLimit, setSpecificationLimit] = useState<string>('18.000 ± 0.005 mm');
  const [inspector, setInspector] = useState<string>(currentUser?.name || 'Inspector J. Miller');
  const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attachments
  const [attachments, setAttachments] = useState<NcrAttachment[]>([
    {
      id: 'ATT-INIT-1',
      name: 'CMM_Dimensional_First_Article_Report.pdf',
      size: '1.4 MB',
      type: 'Inspection Report',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    }
  ]);
  const [newAttachmentName, setNewAttachmentName] = useState<string>('');
  const [newAttachmentType, setNewAttachmentType] = useState<string>('Inspection Report');

  // Validation Error Banner
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    const newAtt: NcrAttachment = {
      id: `ATT-${Date.now()}`,
      name: newAttachmentName.trim().endsWith('.pdf') || newAttachmentName.trim().endsWith('.png') ? newAttachmentName.trim() : `${newAttachmentName.trim()}.pdf`,
      size: '2.2 MB',
      type: newAttachmentType,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAttachments((prev) => [...prev, newAtt]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for all required fields
    if (
      !title.trim() ||
      !ncrType.trim() ||
      !severity ||
      !dateDetected ||
      !detectedBy.trim() ||
      !department.trim() ||
      !targetPartNumber.trim() ||
      !nonConformanceDescription.trim()
    ) {
      setValidationError('Please complete all required NCR fields marked with *.');
      return;
    }

    setValidationError(null);

    const targetPart = Object.values(partsMap).find(
      (p) => p.partNumber === targetPartNumber || p.id === targetPartNumber
    );

    const newNcr: QualityNCR = {
      id: `NCR-${Date.now()}`,
      ncrNumber,
      title: title.trim(),
      ncrType,
      severity,
      status: status || 'Open',
      linkedPartId: targetPart?.id || targetPartNumber,
      targetPartNumber: targetPart?.partNumber || targetPartNumber,
      productAssembly: productAssembly.trim(),
      workOrder: workOrder.trim(),
      machineEquipment: machineEquipment.trim(),
      defectCategory: ncrType,
      ppmImpact: severity === 'Critical' ? 250 : severity === 'Major' ? 140 : 45,
      reportedBy: detectedBy.trim(),
      detectedBy: detectedBy.trim(),
      dateReported: dateDetected,
      dateDetected,
      department: department.trim(),
      description: nonConformanceDescription.trim(),
      nonConformanceDescription: nonConformanceDescription.trim(),
      specificationRequirement: specificationRequirement.trim(),
      actualCondition: actualCondition.trim(),
      expectedCondition: expectedCondition.trim(),
      quantityAffected: Number(quantityAffected) || 1,
      defectLocation: defectLocation.trim(),
      rootCauseCategory: rootCauseCategory.trim(),
      rootCause5Why: rootCauseDescription.trim() || 'Pending 5-Why root cause investigation.',
      rootCauseDescription: rootCauseDescription.trim(),
      containmentAction: containmentAction.trim(),
      correctiveAction: correctiveAction.trim(),
      preventiveAction: preventiveAction.trim(),
      inspectionMethod: inspectionMethod.trim(),
      inspectionResult: inspectionResult.trim(),
      measurementValue: measurementValue.trim(),
      specificationLimit: specificationLimit.trim(),
      inspector: inspector.trim(),
      inspectionDate,
      attachments,
      history: [
        {
          action: 'NCR Created',
          user: currentUser?.name || detectedBy || 'Quality Engineer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          details: `Initial NCR logged with status "${status || 'Open'}" and severity "${severity}".`
        }
      ]
    };

    onSave(newNcr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#D9E1EA] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F172A] flex items-center space-x-2.5">
                <span>Create Non-Conformance Report</span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {ncrNumber}
                </span>
              </h3>
              <p className="text-xs text-[#64748B] font-mono">
                Log and route manufacturing deviations, out-of-spec dimensions, and material non-conformances.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="bg-[#F1F5F9] px-6 py-2 border-b border-[#E2E8F0] flex items-center space-x-2 font-mono text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFormTab('general')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFormTab === 'general' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            1. NCR Info *
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('details')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFormTab === 'details' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            2. Problem Details *
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('rootCause')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFormTab === 'rootCause' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            3. Root Cause & Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('quality')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFormTab === 'quality' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            4. Quality & CMM Inspection
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('attachments')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFormTab === 'attachments' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            5. Attachments ({attachments.length})
          </button>
        </div>

        {/* Validation Error Notice */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2 font-mono text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#0F172A]">
          
          {/* TAB 1: GENERAL NCR INFO */}
          {activeFormTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Auto-generated NCR Number */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold flex items-center space-x-1">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    <span>NCR Number</span>
                  </label>
                  <input
                    type="text"
                    value={ncrNumber}
                    disabled
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#D97706] font-bold focus:outline-none cursor-not-allowed"
                  />
                  <span className="text-[10px] text-[#64748B] block">System auto-incremented</span>
                </div>

                {/* NCR Title */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <span>NCR Title</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sun Gear Bore Concentricity Exceeds 12µm Limit"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NCR Type */}
                <div className="space-y-1.5">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <span>NCR Type</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={ncrType}
                    onChange={(e) => setNcrType(e.target.value)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0284C7] font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="In-Process Machining">In-Process Machining</option>
                    <option value="Incoming Supplier Quality">Incoming Supplier Quality</option>
                    <option value="Final Assembly Inspection">Final Assembly Inspection</option>
                    <option value="Customer Field Return">Customer Field Return</option>
                    <option value="Tooling Non-Conformance">Tooling Non-Conformance</option>
                    <option value="Material Defect">Material Defect</option>
                    <option value="Calibration & Gauge Error">Calibration & Gauge Error</option>
                  </select>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <span>Severity</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as NcrSeverity)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Critical" className="text-rose-600">Critical (Immediate Stop)</option>
                    <option value="Major" className="text-amber-600">Major (Requires CAPA)</option>
                    <option value="Minor" className="text-sky-600">Minor (Deviation / Rework)</option>
                  </select>
                </div>

                {/* Status (Default Open) */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <span>Initial Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as NcrStatus)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-emerald-700 font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Containment">Containment</option>
                    <option value="Corrective Action">Corrective Action</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Date Detected */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Date Detected</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateDetected}
                    onChange={(e) => setDateDetected(e.target.value)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Detected By */}
                <div className="space-y-1.5">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Detected By</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={detectedBy}
                    onChange={(e) => setDetectedBy(e.target.value)}
                    placeholder="Inspector name or engineer"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Department</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. CNC Machining Shop / CMM Lab"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Target Part Number */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#334155] font-bold flex items-center space-x-1">
                    <span>Target Part Number</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={targetPartNumber}
                    onChange={(e) => setTargetPartNumber(e.target.value)}
                    placeholder="e.g. PN-1004 or PN-ABC-520"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0284C7] font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Product / Assembly */}
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Product / Assembly</label>
                  <input
                    type="text"
                    value={productAssembly}
                    onChange={(e) => setProductAssembly(e.target.value)}
                    placeholder="e.g. ASM-GBX-5000 Planetary Gearbox"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Work Order / Production Order */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold">Work Order / Lot</label>
                  <input
                    type="text"
                    value={workOrder}
                    onChange={(e) => setWorkOrder(e.target.value)}
                    placeholder="e.g. WO-2026-0884"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Machine / Equipment */}
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Machine / Cell</label>
                  <input
                    type="text"
                    value={machineEquipment}
                    onChange={(e) => setMachineEquipment(e.target.value)}
                    placeholder="e.g. Mazak INTEGREX #01"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: NON-CONFORMANCE DETAILS */}
          {activeFormTab === 'details' && (
            <div className="space-y-4">
              
              {/* Non-conformance Description */}
              <div className="space-y-1.5">
                <label className="text-[#334155] font-bold flex items-center space-x-1">
                  <span>Non-Conformance Description</span>
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={nonConformanceDescription}
                  onChange={(e) => setNonConformanceDescription(e.target.value)}
                  placeholder="Detailed description of the physical defect, deviation from drawing tolerance, or assembly anomaly..."
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3.5 text-[#0F172A] font-sans focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Specification / Requirement</label>
                  <input
                    type="text"
                    value={specificationRequirement}
                    onChange={(e) => setSpecificationRequirement(e.target.value)}
                    placeholder="e.g. Bore Diameter: 18.000 ± 0.005 mm"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Defect Location / Operation</label>
                  <input
                    type="text"
                    value={defectLocation}
                    onChange={(e) => setDefectLocation(e.target.value)}
                    placeholder="e.g. Op 30 Inner Bearing Seat Bore"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Actual Condition (Measured)</label>
                  <input
                    type="text"
                    value={actualCondition}
                    onChange={(e) => setActualCondition(e.target.value)}
                    placeholder="e.g. 18.014 mm (+9 µm over limit)"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-rose-600 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Expected Condition (Nominal)</label>
                  <input
                    type="text"
                    value={expectedCondition}
                    onChange={(e) => setExpectedCondition(e.target.value)}
                    placeholder="e.g. 17.995 – 18.005 mm"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-emerald-700 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold">Quantity Affected (Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={quantityAffected}
                    onChange={(e) => setQuantityAffected(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ROOT CAUSE & ACTIONS */}
          {activeFormTab === 'rootCause' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Root Cause Category</label>
                  <select
                    value={rootCauseCategory}
                    onChange={(e) => setRootCauseCategory(e.target.value)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-amber-700 font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Tooling Wear / Thermal Drift">Tooling Wear / Thermal Drift</option>
                    <option value="Machine Fixture Clamping Drift">Machine Fixture Clamping Drift</option>
                    <option value="Operator Setup Error">Operator Setup Error</option>
                    <option value="Raw Material Inclusion / Hardness">Raw Material Inclusion / Hardness</option>
                    <option value="Coolant Flow / Pressure Drop">Coolant Flow / Pressure Drop</option>
                    <option value="CAD / CAM Toolpath Anomaly">CAD / CAM Toolpath Anomaly</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Root Cause Description (5-Why Summary)</label>
                  <input
                    type="text"
                    value={rootCauseDescription}
                    onChange={(e) => setRootCauseDescription(e.target.value)}
                    placeholder="Tool wear on CNC lathe reamer fixture caused thermal drift during batch..."
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Containment Action */}
              <div className="space-y-1.5">
                <label className="text-rose-700 font-bold flex items-center space-x-1">
                  <span>Immediate Containment Action</span>
                </label>
                <textarea
                  rows={2}
                  value={containmentAction}
                  onChange={(e) => setContainmentAction(e.target.value)}
                  placeholder="e.g. Quarantine all 24 units in Red Hold Bin; stop CNC Cell #01 finish cut operation..."
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] font-sans focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Corrective Action */}
              <div className="space-y-1.5">
                <label className="text-amber-700 font-bold flex items-center space-x-1">
                  <span>Corrective Action (CAPA)</span>
                </label>
                <textarea
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="e.g. Re-tool fixture with diamond PCD inserts and re-calibrate Renishaw touch probe..."
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] font-sans focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Preventive Action */}
              <div className="space-y-1.5">
                <label className="text-emerald-700 font-bold flex items-center space-x-1">
                  <span>Preventive Action (Kaizen / Poka-Yoke)</span>
                </label>
                <textarea
                  rows={2}
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  placeholder="e.g. Add automated Renishaw laser bore measuring cycle before finish pass in macro program..."
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] font-sans focus:border-amber-500 focus:outline-none"
                />
              </div>

            </div>
          )}

          {/* TAB 4: QUALITY & CMM INSPECTION */}
          {activeFormTab === 'quality' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Inspection Method</label>
                  <input
                    type="text"
                    value={inspectionMethod}
                    onChange={(e) => setInspectionMethod(e.target.value)}
                    placeholder="e.g. Zeiss Coordinate Measuring Machine (CMM)"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Inspection Result</label>
                  <input
                    type="text"
                    value={inspectionResult}
                    onChange={(e) => setInspectionResult(e.target.value)}
                    placeholder="e.g. NON-CONFORMING (Out of Spec)"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-rose-600 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold">Measurement Value</label>
                  <input
                    type="text"
                    value={measurementValue}
                    onChange={(e) => setMeasurementValue(e.target.value)}
                    placeholder="e.g. 18.014 mm"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold">Specification Limit</label>
                  <input
                    type="text"
                    value={specificationLimit}
                    onChange={(e) => setSpecificationLimit(e.target.value)}
                    placeholder="e.g. 18.000 ± 0.005 mm"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#475569] font-bold">Inspector Name</label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    placeholder="Inspector name"
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[#475569] font-bold">Inspection Date</label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ATTACHMENTS */}
          {activeFormTab === 'attachments' && (
            <div className="space-y-4">
              
              {/* Attachment Adder */}
              <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-3">
                <span className="text-[#334155] font-bold block text-xs font-mono">Add Attachment / CMM Scan / Photo</span>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="e.g. Zeiss_Scan_Report_Op30.pdf or Flange_Chatter_Photo.png"
                    className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[#0F172A] focus:border-amber-500 focus:outline-none"
                  />
                  <select
                    value={newAttachmentType}
                    onChange={(e) => setNewAttachmentType(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#475569] focus:outline-none cursor-pointer"
                  >
                    <option value="Inspection Report">Inspection Report (PDF)</option>
                    <option value="Measurement Data">Measurement Data (CSV/PDF)</option>
                    <option value="Defect Photo">Defect Photo (PNG/JPG)</option>
                    <option value="2D Drawing">2D Drawing (PDF)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Attach</span>
                  </button>
                </div>
              </div>

              {/* Attachments List */}
              <div className="space-y-2">
                <span className="text-[#475569] font-bold block text-xs font-mono">Linked Evidence & Files:</span>
                {attachments.map((att) => (
                  <div key={att.id} className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-[#0F172A] block">{att.name}</span>
                        <span className="text-[10px] text-[#64748B]">{att.type} • {att.size} • Uploaded {att.uploadedAt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Form Actions Footer */}
          <div className="border-t border-[#E2E8F0] pt-5 flex items-center justify-between font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-3">
              <span className="text-[#64748B] text-[11px]">
                Target Part: <b className="text-[#0284C7]">{targetPartNumber || 'None'}</b>
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-all cursor-pointer"
              >
                Create NCR
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
