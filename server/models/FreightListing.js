import mongoose from 'mongoose';
import { CARGO_TYPES, VEHICLE_TYPES } from './Lead.js';

export const LISTING_STATUSES = [
  'OPEN',
  'IN_NEGOTIATION',
  'ASSIGNED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
];

const freightListingSchema = new mongoose.Schema(
  {
    // Reference to Shipper User
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipper account ID is required'],
      index: true,
    },
    shipperName: {
      type: String,
      required: [true, 'Shipper contact name is required'],
      trim: true,
      maxlength: [100, 'Shipper name cannot exceed 100 characters'],
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [150, 'Business name cannot exceed 150 characters'],
      index: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    // Route Specifications
    origin: {
      type: String,
      required: [true, 'Origin location/corridor is required'],
      trim: true,
      minlength: [2, 'Origin must be at least 2 characters'],
      maxlength: [150, 'Origin cannot exceed 150 characters'],
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination location/corridor is required'],
      trim: true,
      minlength: [2, 'Destination must be at least 2 characters'],
      maxlength: [150, 'Destination cannot exceed 150 characters'],
      index: true,
    },

    // Cargo & Capacity Details
    cargoCategory: {
      type: String,
      required: [true, 'Cargo category is required'],
      enum: {
        values: CARGO_TYPES,
        message: '{VALUE} is not a supported cargo category',
      },
      index: true,
    },
    cargoDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Cargo description cannot exceed 500 characters'],
      default: '',
    },
    weight: {
      type: Number,
      required: [true, 'Weight / capacity is required'],
      min: [0.01, 'Weight must be greater than zero'],
      max: [1000, 'Weight cannot exceed 1000 tons per individual listing'],
    },
    weightUnit: {
      type: String,
      enum: ['Tons', 'Quintals', 'Kg'],
      default: 'Tons',
    },

    // Timing & Schedule
    pickupDate: {
      type: Date,
      required: [true, 'Pickup date is required'],
      index: true,
    },
    deliveryDate: {
      type: Date,
      default: null,
    },

    // Pricing
    offeredPrice: {
      type: Number,
      required: [true, 'Offered price is required'],
      min: [100, 'Offered price must be at least ₹100'],
      max: [5000000, 'Offered price cannot exceed ₹50,00,000'],
    },
    priceType: {
      type: String,
      enum: ['FIXED', 'NEGOTIABLE', 'PER_TON'],
      default: 'FIXED',
    },

    // Vehicle Specifications
    vehicleRequirements: {
      type: [String],
      default: [],
    },

    // Additional Shipper Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },

    // Lifecycle Status
    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: '{VALUE} is not a valid listing status',
      },
      default: 'OPEN',
      uppercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient corridor matching and status queries
freightListingSchema.index({ origin: 1, destination: 1, status: 1 });
freightListingSchema.index({ createdAt: -1 });

// Helper serialization method
freightListingSchema.methods.toSafeObject = function () {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(this.offeredPrice);

  return {
    id: this._id,
    shipperId: this.shipperId,
    shipperName: this.shipperName,
    businessName: this.businessName,
    contactPhone: this.contactPhone,
    contactEmail: this.contactEmail,
    origin: this.origin,
    destination: this.destination,
    route: `${this.origin} → ${this.destination}`,
    cargoCategory: this.cargoCategory,
    cargoDescription: this.cargoDescription,
    weight: this.weight,
    weightUnit: this.weightUnit,
    weightDisplay: `${this.weight} ${this.weightUnit}`,
    pickupDate: this.pickupDate ? this.pickupDate.toISOString() : null,
    deliveryDate: this.deliveryDate ? this.deliveryDate.toISOString() : null,
    offeredPrice: this.offeredPrice,
    offeredPriceFormatted: formattedPrice,
    priceType: this.priceType,
    vehicleRequirements: this.vehicleRequirements || [],
    notes: this.notes,
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

const FreightListing =
  mongoose.models.FreightListing || mongoose.model('FreightListing', freightListingSchema);

export default FreightListing;
