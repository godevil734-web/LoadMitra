import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  File,
  Eye,
  RefreshCw,
  Info,
  Check,
  Building,
  Truck,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DOCUMENT_TYPES = [
  { value: 'BUSINESS_REGISTRATION', label: 'Business Registration / Trade License' },
  { value: 'GSTIN', label: 'GSTIN Certificate' },
  { value: 'PAN', label: 'Company / Business PAN' },
  { value: 'TRANSPORT_PERMIT', label: 'All India / State Goods Carriage Permit' },
  { value: 'VEHICLE_RC', label: 'Commercial Vehicle Registration (RC)' },
  { value: 'FITNESS_CERTIFICATE', label: 'Vehicle Fitness Certificate' },
  { value: 'INSURANCE', label: 'Commercial Vehicle Insurance Policy' },
  { value: 'DRIVER_LICENSE', label: 'Commercial Driver License' },
  { value: 'OTHER', label: 'Other Regulatory Compliance Document' },
];

export default function TransporterVerificationSection({
  authToken,
  currentTransporter,
  showToast,
}) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedDocType, setSelectedDocType] = useState('BUSINESS_REGISTRATION');
  const [docNumber, setDocNumber] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchVerificationStatus = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verification/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVerification(data.data);
      }
    } catch {
      if (showToast) showToast('error', 'Failed to retrieve verification status.');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (showToast) showToast('error', 'File size exceeds maximum allowed limit of 5 MB.');
      e.target.value = null;
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      if (showToast) showToast('error', 'Only JPEG, PNG, WEBP and PDF files are allowed.');
      e.target.value = null;
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      if (showToast) showToast('error', 'Please select a document file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('documents', selectedFile);
      formData.append('documentType', selectedDocType);
      if (docNumber.trim()) formData.append('documentNumber', docNumber.trim());
      if (submissionNotes.trim()) formData.append('submissionNotes', submissionNotes.trim());

      const res = await fetch(`${API_BASE}/api/verification/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setVerification(data.data);
        setSelectedFile(null);
        setDocNumber('');
        setSubmissionNotes('');
        const fileInput = document.getElementById('verification-file-input');
        if (fileInput) fileInput.value = null;
        if (showToast) showToast('success', 'Document submitted successfully! Waiting for review.');
      } else {
        if (showToast) showToast('error', data.message || 'Failed to submit document.');
      }
    } catch {
      if (showToast) showToast('error', 'Network error submitting verification document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (docId, fileName) => {
    try {
      const res = await fetch(`${API_BASE}/api/verification/documents/${docId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = fileName || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        if (showToast) showToast('error', 'Failed to retrieve document.');
      }
    } catch {
      if (showToast) showToast('error', 'Network error opening document.');
    }
  };

  const status = verification?.status || 'NOT_SUBMITTED';

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Status Card */}
      <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#262626] border border-[#333333] text-xs font-semibold text-[#F28C28]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transport Partner Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Carrier &amp; Fleet Verification
            </h2>
            <p className="text-sm text-stone-300 max-w-2xl">
              Verified carriers receive a <span className="text-emerald-400 font-semibold font-mono">✓ Verified Transport Partner</span> badge on freight proposals, establishing direct trust with enterprise shippers.
            </p>
          </div>

          {/* Current Status Pill */}
          <div className="shrink-0">
            {status === 'APPROVED' && (
              <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider font-mono">Status</div>
                  <div className="text-sm font-bold text-white">Verified Transport Partner ✓</div>
                </div>
              </div>
            )}
            {status === 'PENDING' && (
              <div className="px-5 py-3 rounded-xl bg-[#F28C28]/10 border border-[#F28C28]/30 text-[#F28C28] flex items-center space-x-3">
                <Clock className="w-6 h-6 text-[#F28C28] animate-pulse" />
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider font-mono">Status</div>
                  <div className="text-sm font-bold text-white">Under Dispatch Review</div>
                </div>
              </div>
            )}
            {status === 'CORRECTION_REQUIRED' && (
              <div className="px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider font-mono">Action Needed</div>
                  <div className="text-sm font-bold text-white">Please Update Documents</div>
                </div>
              </div>
            )}
            {status === 'REJECTED' && (
              <div className="px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider font-mono">Status</div>
                  <div className="text-sm font-bold text-white">Review Not Approved</div>
                </div>
              </div>
            )}
            {status === 'NOT_SUBMITTED' && (
              <div className="px-5 py-3 rounded-xl bg-[#262626] border border-[#2D2D2D] text-stone-300 flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-stone-400" />
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-stone-400 font-mono">Status</div>
                  <div className="text-sm font-bold text-white">Not Submitted Yet</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Correction or Rejection Reason Banner */}
        {(status === 'CORRECTION_REQUIRED' || status === 'REJECTED') && verification?.correctionReason && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start space-x-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-rose-300">
                {status === 'CORRECTION_REQUIRED' ? 'Update Requested:' : 'Reason:'}
              </span>
              <p className="text-rose-200/90 leading-relaxed">{verification.correctionReason}</p>
              <p className="text-[11px] text-rose-400 font-semibold pt-1">
                Please upload the requested document below to send for review again.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Checklist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Business Identity',
            desc: 'GSTIN / Trade Registration / Business PAN',
            icon: Building,
            submitted: verification?.documents?.some((d) =>
              ['BUSINESS_REGISTRATION', 'GSTIN', 'PAN'].includes(d.documentType)
            ),
          },
          {
            title: 'Vehicle RC',
            desc: 'Commercial vehicle registration certificate',
            icon: Truck,
            submitted: verification?.documents?.some((d) => d.documentType === 'VEHICLE_RC'),
          },
          {
            title: 'Fitness Certificate',
            desc: 'Fitness certificate for your commercial vehicle',
            icon: FileText,
            submitted: verification?.documents?.some((d) => d.documentType === 'FITNESS_CERTIFICATE'),
          },
          {
            title: 'Transport Permit',
            desc: 'State or national transport permit',
            icon: ShieldCheck,
            submitted: verification?.documents?.some((d) => d.documentType === 'TRANSPORT_PERMIT'),
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#1F1F1F] border border-[#2D2D2D] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-[#262626] border border-[#333333]">
                    <Icon className="w-4 h-4 text-[#F28C28]" />
                  </div>
                  {item.submitted ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 font-mono">
                      <Check className="w-3 h-3" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#171717] text-stone-400 border border-[#2D2D2D] font-mono">
                      Required
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-stone-400">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Document Upload Form & Uploaded Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#1F1F1F] border border-[#2D2D2D] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2D2D]">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Upload className="w-4 h-4 text-[#F28C28]" />
                <span>Upload Document</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">Max 5 MB (PDF/JPG/PNG)</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Type of Document *
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171717] border border-[#2D2D2D] rounded-xl text-xs text-white focus:outline-none focus:border-[#F28C28]"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Document or Registration Number (Optional)
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. GSTIN / RC Number / Permit #"
                  className="w-full px-3 py-2 bg-[#171717] border border-[#2D2D2D] rounded-xl text-xs text-white focus:outline-none focus:border-[#F28C28]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Choose Document File *
                </label>
                <div className="border-2 border-dashed border-[#2D2D2D] hover:border-[#F28C28]/50 rounded-xl p-4 text-center cursor-pointer bg-[#171717] transition-colors">
                  <input
                    id="verification-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="verification-file-input" className="cursor-pointer block space-y-2">
                    <FileText className="w-8 h-8 text-[#F28C28] mx-auto" />
                    <div className="text-xs text-stone-300">
                      {selectedFile ? (
                        <span className="font-bold text-[#F28C28] truncate block max-w-xs mx-auto font-mono">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-[#F28C28] hover:underline">Click to browse</span> or drag and drop file here
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500">Supports PDF, JPEG, PNG up to 5 MB</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="e.g. Valid until Dec 2026."
                  className="w-full px-3 py-2 bg-[#171717] border border-[#2D2D2D] rounded-xl text-xs text-white focus:outline-none focus:border-[#F28C28]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F28C28] hover:bg-[#E07A1E] text-black font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload &amp; Submit for Review</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Documents List & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Documents Table */}
          <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D2D2D]">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <File className="w-4 h-4 text-[#F28C28]" />
                <span>Uploaded Documents ({verification?.documents?.length || 0})</span>
              </h3>
              <button
                type="button"
                onClick={fetchVerificationStatus}
                className="text-xs text-stone-400 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone-400 text-xs">Loading documents...</div>
            ) : !verification?.documents || verification.documents.length === 0 ? (
              <div className="p-8 text-center text-stone-400 space-y-2">
                <FileText className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-xs">No documents uploaded yet. Add your business or vehicle documents using the form on the left.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2D2D2D] space-y-2">
                {verification.documents.map((doc) => (
                  <div key={doc.id} className="pt-2 pb-1 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 rounded-lg bg-[#171717] border border-[#2D2D2D] shrink-0">
                        <FileText className="w-4 h-4 text-[#F28C28]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{doc.originalName}</div>
                        <div className="text-[11px] text-stone-400 flex items-center space-x-2 mt-0.5">
                          <span className="text-[#F28C28] font-mono">{doc.documentType}</span>
                          <span>•</span>
                          <span className="font-tabular">{doc.fileSizeFormatted}</span>
                          {doc.documentNumberMasked && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{doc.documentNumberMasked}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          doc.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#F28C28]/20 text-[#F28C28] border border-[#F28C28]/30'
                        }`}
                      >
                        {doc.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc.id, doc.originalName)}
                        title="Download / Inspect Document"
                        className="p-1.5 text-stone-300 hover:text-[#F28C28] hover:bg-[#262626] rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review History */}
          {verification?.auditLog && verification.auditLog.length > 0 && (
            <div className="bg-[#1F1F1F] border border-[#2D2D2D] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#F28C28]" />
                <span>Review History</span>
              </h4>
              <div className="space-y-2 border-l-2 border-[#2D2D2D] pl-4 ml-1">
                {verification.auditLog.map((entry, i) => (
                  <div key={i} className="text-xs space-y-0.5 relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#F28C28]" />
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-stone-200">{entry.action}</span>
                      <span className="text-[10px] text-stone-400 font-tabular">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN') : ''}
                      </span>
                    </div>
                    {entry.notes && <p className="text-stone-400 text-[11px]">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
