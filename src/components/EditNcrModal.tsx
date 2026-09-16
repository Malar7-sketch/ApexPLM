import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Calendar, 
  User, 
  Building2, 
  Hash, 
  Paperclip, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import type { QualityNCR, PartItem, NcrSeverity, NcrStatus, NcrAttachment } from '../types/plm';

interface EditNcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  ncr: QualityNCR | null;
  partsMap: Record<string, PartItem>;
  currentUser?: { name: string; email?: string } | null;
  onSave: (updatedNcr: QualityNCR) => void;
}

export const EditNcrModal: React.FC<EditNcrModalProps> = ({
  isOpen,
  onClose,
  ncr,
  partsMap,
  currentUser,
  onSave
}) => {
  if (!isOpen || !ncr) return null;

  const [title, setTitle] = useState(ncr.title);
  const [ncrType, setNcrType] = useState(ncr.ncrType || 'In-Process Machining');
  const [severity, setSeverity] = useState<NcrSeverity>(ncr.severity);
  const [status, setStatus] = useState<NcrStatus>(ncr.status);
  const [dateDetected, setDateDetected] = useState(ncr.dateDetected || ncr.dateReported || '2026-08-25');
  const [detectedBy, setDetectedBy] = useState(ncr.detectedBy || ncr.reportedBy || '');
  const [department, setDepartment] = useState(ncr.department || 'CNC Machining Shop');
  const [targetPartNumber, setTargetPartNumber] = useState(ncr.targetPartNumber || ncr.linkedPartId || '');
  const [productAssembly, setProductAssembly] = useState(ncr.productAssembly || '');
  const [workOrder, setWorkOrder] = useState(ncr.workOrder || '');
  const [machineEquipment, setMachineEquipment] = useState(ncr.machineEquipment || '');

  // Details
  const [nonConformanceDescription, setNonConformanceDescription] = useState(ncr.nonConformanceDescription || ncr.description || '');
  const [specificationRequirement, setSpecificationRequirement] = useState(ncr.specificationRequirement || ncr.specificationLimit || '');
  const [actualCondition, setActualCondition] = useState(ncr.actualCondition || ncr.measurementValue || '');
  const [expectedCondition, setExpectedCondition] = useState(ncr.expectedCondition || '');
  const [quantityAffected, setQuantityAffected] = useState(ncr.quantityAffected || 1);
  const [defectLocation, setDefectLocation] = useState(ncr.defectLocation || '');

  // Root Cause
  const [rootCauseCategory, setRootCauseCategory] = useState(ncr.rootCauseCategory || 'Tooling Wear / Thermal Drift');
  const [rootCauseDescription, setRootCauseDescription] = useState(ncr.rootCauseDescription || ncr.rootCause5Why || '');
  const [containmentAction, setContainmentAction] = useState(ncr.containmentAction || '');
  const [correctiveAction, setCorrectiveAction] = useState(ncr.correctiveAction || '');
  const [preventiveAction, setPreventiveAction] = useState(ncr.preventiveAction || '');

  // Quality Info
  const [inspectionMethod, setInspectionMethod] = useState(ncr.inspectionMethod || '');
  const [inspectionResult, setInspectionResult] = useState(ncr.inspectionResult || '');
  const [measurementValue, setMeasurementValue] = useState(ncr.measurementValue || '');
  const [specificationLimit, setSpecificationLimit] = useState(ncr.specificationLimit || '');

  // Attachments
  const [attachments, setAttachments] = useState<NcrAttachment[]>(ncr.attachments || []);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    const newAtt: NcrAttachment = {
      id: `ATT-${Date.now()}`,
      name: newAttachmentName.trim().endsWith('.pdf') ? newAttachmentName.trim() : `${newAttachmentName.trim()}.pdf`,
      size: '1.9 MB',
      type: 'Inspection Report',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAttachments((prev) => [...prev, newAtt]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !detectedBy.trim() || !targetPartNumber.trim() || !nonConformanceDescription.trim()) {
      setValidationError('Please complete all required fields marked with *.');
      return;
    }

    const updated: QualityNCR = {
      ...ncr,
      title: title.trim(),
      ncrType,
      severity,
      status,
      dateDetected,
      dateReported: dateDetected,
      detectedBy: detectedBy.trim(),
      reportedBy: detectedBy.trim(),
      department: department.trim(),
      targetPartNumber: targetPartNumber.trim(),
      linkedPartId: targetPartNumber.trim(),
      productAssembly: productAssembly.trim(),
      workOrder: workOrder.trim(),
      machineEquipment: machineEquipment.trim(),
      nonConformanceDescription: nonConformanceDescription.trim(),
      description: nonConformanceDescription.trim(),
      specificationRequirement: specificationRequirement.trim(),
      actualCondition: actualCondition.trim(),
      expectedCondition: expectedCondition.trim(),
      quantityAffected: Number(quantityAffected) || 1,
      defectLocation: defectLocation.trim(),
      rootCauseCategory: rootCauseCategory.trim(),
      rootCauseDescription: rootCauseDescription.trim(),
      rootCause5Why: rootCauseDescription.trim() || ncr.rootCause5Why,
      containmentAction: containmentAction.trim(),
      correctiveAction: correctiveAction.trim(),
      preventiveAction: preventiveAction.trim(),
      inspectionMethod: inspectionMethod.trim(),
      inspectionResult: inspectionResult.trim(),
      measurementValue: measurementValue.trim(),
      specificationLimit: specificationLimit.trim(),
      attachments,
      history: [
        ...(ncr.history || []),
        {
          action: 'NCR Edited',
          user: currentUser?.name || 'Engineer',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          details: `Updated NCR information, severity: ${severity}, status: ${status}.`
        }
      ]
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#D9E1EA] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-[#F8FAFC] px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0F172A] flex items-center space-x-2">
                <span>Edit Non-Conformance Report</span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {ncr.ncrNumber}
                </span>
              </h3>
              <p className="text-xs text-[#64748B] font-mono">
                Update root cause investigation, severity level, containment actions, and resolution records.
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

        {/* Validation Notice */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2 font-mono text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#0F172A]">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 font-mono">
              <label className="text-[#475569] font-bold">NCR Number</label>
              <input
                type="text"
                value={ncr.ncrNumber}
                disabled
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#D97706] font-bold cursor-not-allowed"
              />
            </div>

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
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[#334155] font-bold">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as NcrSeverity)}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0F172A] font-bold focus:border-amber-500 focus:outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#334155] font-bold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NcrStatus)}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-emerald-700 font-bold focus:border-amber-500 focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Containment">Containment</option>
                <option value="Corrective Action">Corrective Action</option>
                <option value="Verification">Verification</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="space-y-1.5 font-mono">
              <label className="text-[#334155] font-bold">Target Part</label>
              <input
                type="text"
                value={targetPartNumber}
                onChange={(e) => setTargetPartNumber(e.target.value)}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[#0284C7] font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[#334155] font-bold">Non-Conformance Description *</label>
            <textarea
              required
              rows={3}
              value={nonConformanceDescription}
              onChange={(e) => setNonConformanceDescription(e.target.value)}
              className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Root Cause & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-amber-700 font-bold">Root Cause Summary</label>
              <textarea
                rows={2}
                value={rootCauseDescription}
                onChange={(e) => setRootCauseDescription(e.target.value)}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-rose-700 font-bold">Immediate Containment</label>
              <textarea
                rows={2}
                value={containmentAction}
                onChange={(e) => setContainmentAction(e.target.value)}
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-emerald-700 font-bold">Corrective & Preventive Action (CAPA)</label>
            <textarea
              rows={2}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="w-full bg-[#F8FAFC] focus:bg-white border border-[#CBD5E1] rounded-xl p-3 text-[#0F172A] focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <label className="text-[#334155] font-bold font-mono">Linked Attachments</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="Add attachment name..."
                className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[#0F172A] focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3.5 py-2 bg-white hover:bg-[#F1F5F9] text-[#0284C7] border border-[#CBD5E1] font-bold rounded-xl flex items-center space-x-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {attachments.map((att) => (
                <div key={att.id} className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-between font-mono text-xs">
                  <span className="text-[#0F172A]">{att.name} ({att.size})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="text-rose-600 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#E2E8F0] pt-5 flex items-center justify-between font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
