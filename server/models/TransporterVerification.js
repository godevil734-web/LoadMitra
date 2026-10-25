import mongoose from 'mongoose';

export const VERIFICATION_STATUSES = [
  'NOT_SUBMITTED',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CORRECTION_REQUIRED',
];

export const DOCUMENT_TYPES = [
  'GSTIN',
  'PAN',
  'BUSINESS_REGISTRATION',
  'TRANSPORT_PERMIT',
  'VEHICLE_RC',
  'FITNESS_CERTIFICATE',
  'INSURANCE',
  'DRIVER_LICENSE',
  'OTHER',
];

const documentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
    },
    documentNumber: {
      type: String,
      trim: true,
      default: '',
    },
    originalName: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { _id: true }
);

const auditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
    },
    performedByRole: {
      type: String,
      default: 'ADMIN',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const transporterVerificationSchema = new mongoose.Schema(
  {
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    operatingCorridor: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleAvailability',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'PENDING',
      index: true,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    submissionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    reviewerUsername: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewerNotes: {
      type: String,
      trim: true,
      default: '',
    },
    correctionReason: {
      type: String,
      trim: true,
      default: '',
    },
    auditLog: {
      type: [auditEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

transporterVerificationSchema.index({ transporterId: 1, createdAt: -1 });

// Safe object representation preventing leak of private storage keys to unauthorized users
transporterVerificationSchema.methods.toSafeObject = function (canViewPrivateDocs = false) {
  return {
    id: this._id,
    transporterId: this.transporterId,
    businessName: this.businessName,
    contactName: this.contactName,
    contactPhone: this.contactPhone,
    contactEmail: this.contactEmail,
    operatingCorridor: this.operatingCorridor,
    vehicleId: this.vehicleId,
    status: this.status,
    documentsCount: this.documents.length,
    documents: this.documents.map((d) => ({
      id: d._id,
      documentType: d.documentType,
      // Mask document number if present (show only last 4 digits)
      documentNumberMasked: d.documentNumber
        ? `••••${d.documentNumber.slice(-4)}`
        : null,
      originalName: d.originalName,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      fileSizeFormatted: `${(d.fileSize / 1024).toFixed(1)} KB`,
      uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString() : null,
      status: d.status,
      // Storage key is only provided if caller has authorization to request private download
      accessUrl: canViewPrivateDocs
        ? `/api/verification/documents/${d._id}`
        : null,
    })),
    submissionNotes: this.submissionNotes,
    reviewedAt: this.reviewedAt ? this.reviewedAt.toISOString() : null,
    reviewerNotes: this.reviewerNotes,
    correctionReason: this.correctionReason,
    auditLog: (this.auditLog || []).map((a) => ({
      action: a.action,
      performedBy: a.performedBy,
      performedByRole: a.performedByRole,
      timestamp: a.timestamp ? a.timestamp.toISOString() : null,
      notes: a.notes,
    })),
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

const TransporterVerification =
  mongoose.models.TransporterVerification ||
  mongoose.model('TransporterVerification', transporterVerificationSchema);

export default TransporterVerification;
