import mongoose from 'mongoose';

export const BOOKING_STATUSES = [
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedByRole: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    // References
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreightListing',
      required: [true, 'Freight listing ID is required'],
    },
    interestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoadInterest',
      required: [true, 'Accepted load interest ID is required'],
      index: true,
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipper user ID is required'],
      index: true,
    },
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transporter user ID is required'],
      index: true,
    },
    vehicleAvailabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleAvailability',
      required: [true, 'Vehicle availability ID is required'],
    },

    // Shipper Snapshot (for immutable reference & contact upon authorization)
    shipperName: {
      type: String,
      required: true,
      trim: true,
    },
    shipperBusinessName: {
      type: String,
      required: true,
      trim: true,
    },
    shipperPhone: {
      type: String,
      required: true,
      trim: true,
    },
    shipperEmail: {
      type: String,
      trim: true,
      default: null,
    },

    // Transporter Snapshot
    transporterName: {
      type: String,
      required: true,
      trim: true,
    },
    transporterFleetName: {
      type: String,
      required: true,
      trim: true,
    },
    transporterPhone: {
      type: String,
      required: true,
      trim: true,
    },
    transporterEmail: {
      type: String,
      trim: true,
      default: null,
    },

    // Route & Cargo Specifications
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    cargoCategory: {
      type: String,
      required: true,
    },
    cargoDescription: {
      type: String,
      trim: true,
      default: '',
    },
    weight: {
      type: Number,
      required: true,
    },
    weightUnit: {
      type: String,
      default: 'Tons',
    },
    vehicleType: {
      type: String,
      required: true,
    },
    vehicleCapacity: {
      type: Number,
      default: null,
    },

    // Financial Agreement
    agreedPrice: {
      type: Number,
      required: true,
      min: [100, 'Agreed price must be at least ₹100'],
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // Operational Dates & Milestones
    scheduledPickupDate: {
      type: Date,
      required: true,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualPickupAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Operational Tracking Notes
    transitLocation: {
      type: String,
      trim: true,
      default: '',
    },
    transitNotes: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: '',
    },
    recipientName: {
      type: String,
      trim: true,
      default: '',
    },
    proofNotes: {
      type: String,
      trim: true,
      default: '',
    },
    completionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Phase 6: Delivery Proof & Dispute State Machine
    deliveryProof: {
      recipientName: {
        type: String,
        trim: true,
        default: '',
      },
      recipientContact: {
        type: String,
        trim: true,
        default: '',
      },
      deliveryNotes: {
        type: String,
        trim: true,
        default: '',
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      evidenceStatus: {
        type: String,
        enum: ['NOT_SUBMITTED', 'SUBMITTED', 'VERIFIED', 'DISPUTED'],
        default: 'NOT_SUBMITTED',
      },
      documents: [
        {
          originalName: { type: String, required: true },
          storageKey: { type: String, required: true },
          mimeType: { type: String, required: true },
          fileSize: { type: Number, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      disputeReason: {
        type: String,
        trim: true,
        default: '',
      },
      disputedAt: {
        type: Date,
        default: null,
      },
      disputeResolvedAt: {
        type: Date,
        default: null,
      },
    },

    // Status & Audit Trail
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: '{VALUE} is not a valid booking status',
      },
      default: 'CONFIRMED',
      uppercase: true,
      index: true,
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Database-enforced Uniqueness Strategies
// 1. Exactly one active (non-cancelled) booking per freight listing
bookingSchema.index(
  { listingId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'CANCELLED' } } }
);

// 2. Exactly one active (in-progress) assignment per vehicle availability record
bookingSchema.index(
  { vehicleAvailabilityId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['COMPLETED', 'CANCELLED'] } },
  }
);

// Compound querying indexes
bookingSchema.index({ shipperId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ transporterId: 1, status: 1, createdAt: -1 });

// Helper to sanitize and format output with role-based privacy
bookingSchema.methods.toSafeObject = function (requestingUserId = null, requestingRole = null) {
  const isShipper = requestingUserId && this.shipperId && this.shipperId.toString() === requestingUserId.toString();
  const isTransporter = requestingUserId && this.transporterId && this.transporterId.toString() === requestingUserId.toString();
  const isAdmin = requestingRole === 'admin';
  const isAuthorizedParticipant = isShipper || isTransporter || isAdmin;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR',
    maximumFractionDigits: 0,
  }).format(this.agreedPrice);

  return {
    id: this._id,
    bookingNumber: `RW-BK-${this._id.toString().slice(-6).toUpperCase()}`,
    listingId: this.listingId,
    interestId: this.interestId,
    shipperId: this.shipperId,
    transporterId: this.transporterId,
    vehicleAvailabilityId: this.vehicleAvailabilityId,

    // Route & Cargo
    origin: this.origin,
    destination: this.destination,
    cargoCategory: this.cargoCategory,
    cargoDescription: this.cargoDescription,
    weight: this.weight,
    weightUnit: this.weightUnit,
    vehicleType: this.vehicleType,
    vehicleCapacity: this.vehicleCapacity,

    // Financial
    agreedPrice: this.agreedPrice,
    agreedPriceFormatted: formattedPrice,
    currency: this.currency,

    // Timing
    scheduledPickupDate: this.scheduledPickupDate ? this.scheduledPickupDate.toISOString() : null,
    expectedDeliveryDate: this.expectedDeliveryDate ? this.expectedDeliveryDate.toISOString() : null,
    actualPickupAt: this.actualPickupAt ? this.actualPickupAt.toISOString() : null,
    deliveredAt: this.deliveredAt ? this.deliveredAt.toISOString() : null,
    completedAt: this.completedAt ? this.completedAt.toISOString() : null,
    cancelledAt: this.cancelledAt ? this.cancelledAt.toISOString() : null,

    // Tracking
    transitLocation: this.transitLocation,
    transitNotes: this.transitNotes,
    deliveryNotes: this.deliveryNotes,
    recipientName: this.recipientName,
    proofNotes: this.proofNotes,
    completionNotes: this.completionNotes,
    cancellationReason: this.cancellationReason,

    // Lifecycle Status
    status: this.status,
    statusHistory: (this.statusHistory || []).map((h) => ({
      status: h.status,
      changedAt: h.changedAt ? h.changedAt.toISOString() : null,
      changedByRole: h.changedByRole,
      note: h.note,
    })),

    // Delivery Proof & Evidence (Accessible to authorized participants: shipper, transporter, admin)
    deliveryProof: isAuthorizedParticipant && this.deliveryProof
      ? {
          recipientName: this.deliveryProof.recipientName || this.recipientName || '',
          recipientContact: this.deliveryProof.recipientContact || '',
          deliveryNotes: this.deliveryProof.deliveryNotes || this.deliveryNotes || '',
          submittedAt: this.deliveryProof.submittedAt ? this.deliveryProof.submittedAt.toISOString() : null,
          evidenceStatus: this.deliveryProof.evidenceStatus || 'NOT_SUBMITTED',
          documents: (this.deliveryProof.documents || []).map((d) => ({
            id: d._id,
            originalName: d.originalName,
            mimeType: d.mimeType,
            fileSize: d.fileSize,
            fileSizeFormatted: `${(d.fileSize / 1024).toFixed(1)} KB`,
            uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString() : null,
            accessUrl: `/api/bookings/${this._id}/proof/${d._id}`,
          })),
          disputeReason: this.deliveryProof.disputeReason || '',
          disputedAt: this.deliveryProof.disputedAt ? this.deliveryProof.disputedAt.toISOString() : null,
          disputeResolvedAt: this.deliveryProof.disputeResolvedAt ? this.deliveryProof.disputeResolvedAt.toISOString() : null,
        }
      : {
          evidenceStatus: this.deliveryProof?.evidenceStatus || 'NOT_SUBMITTED',
          hasProof: Boolean(this.deliveryProof?.documents?.length),
        },

    // Contact Details — Protected by Participant Authorization
    shipper: isAuthorizedParticipant
      ? {
          name: this.shipperName,
          businessName: this.shipperBusinessName,
          phone: this.shipperPhone,
          email: this.shipperEmail,
        }
      : {
          businessName: this.shipperBusinessName,
        },
    transporter: isAuthorizedParticipant
      ? {
          name: this.transporterName,
          fleetName: this.transporterFleetName,
          phone: this.transporterPhone,
          email: this.transporterEmail,
        }
      : {
          fleetName: this.transporterFleetName,
        },

    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
