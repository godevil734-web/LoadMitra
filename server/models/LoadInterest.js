import mongoose from 'mongoose';

export const LOAD_INTEREST_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

const loadInterestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreightListing',
      required: [true, 'Listing ID is required'],
      index: true,
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipper ID is required'],
      index: true,
    },
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transporter ID is required'],
      index: true,
    },
    transporterName: {
      type: String,
      required: [true, 'Transporter contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    fleetName: {
      type: String,
      required: [true, 'Fleet or company name is required'],
      trim: true,
      maxlength: [150, 'Fleet name cannot exceed 150 characters'],
    },
    transporterPhone: {
      type: String,
      required: [true, 'Transporter contact phone is required'],
      trim: true,
    },
    transporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    // Commercial & Operational Proposal
    proposedRate: {
      type: Number,
      required: [true, 'Proposed quote / rate is required'],
      min: [100, 'Proposed rate must be at least ₹100'],
      max: [5000000, 'Proposed rate cannot exceed ₹50,00,000'],
    },
    proposedVehicle: {
      type: String,
      trim: true,
      maxlength: [100, 'Vehicle specification cannot exceed 100 characters'],
      default: '',
    },
    availableFromDate: {
      type: Date,
      default: null,
    },
    vehicleAvailabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleAvailability',
      default: null,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },

    // Status & Workflow Transitions
    status: {
      type: String,
      enum: {
        values: LOAD_INTEREST_STATUSES,
        message: '{VALUE} is not a valid load interest status',
      },
      default: 'PENDING',
      uppercase: true,
      index: true,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
loadInterestSchema.index({ listingId: 1, transporterId: 1, status: 1 });
loadInterestSchema.index({ transporterId: 1, createdAt: -1 });
loadInterestSchema.index({ shipperId: 1, createdAt: -1 });

loadInterestSchema.methods.toSafeObject = function () {
  const formattedRate = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(this.proposedRate);

  return {
    id: this._id,
    listingId: this.listingId,
    shipperId: this.shipperId,
    transporterId: this.transporterId,
    transporterName: this.transporterName,
    fleetName: this.fleetName,
    transporterPhone: this.transporterPhone,
    transporterEmail: this.transporterEmail,
    proposedRate: this.proposedRate,
    proposedRateFormatted: formattedRate,
    proposedVehicle: this.proposedVehicle,
    vehicleAvailabilityId: this.vehicleAvailabilityId ? this.vehicleAvailabilityId.toString() : null,
    availableFromDate: this.availableFromDate ? this.availableFromDate.toISOString() : null,
    message: this.message,
    status: this.status,
    reviewNotes: this.reviewNotes,
    reviewedAt: this.reviewedAt ? this.reviewedAt.toISOString() : null,
    withdrawnAt: this.withdrawnAt ? this.withdrawnAt.toISOString() : null,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

const LoadInterest =
  mongoose.models.LoadInterest || mongoose.model('LoadInterest', loadInterestSchema);

export default LoadInterest;
