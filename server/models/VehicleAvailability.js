import mongoose from 'mongoose';
import { VEHICLE_TYPES } from './Lead.js';

export const VEHICLE_AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'MATCHED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
];

const vehicleAvailabilitySchema = new mongoose.Schema(
  {
    // Owning Transporter Reference
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transporter account ID is required'],
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

    // Vehicle Specifications
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: VEHICLE_TYPES,
        message: '{VALUE} is not a valid vehicle type',
      },
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [0.1, 'Capacity must be at least 0.1'],
      max: [1000, 'Capacity cannot exceed 1000 tons'],
    },
    capacityUnit: {
      type: String,
      enum: ['Tons', 'Quintals', 'Kg'],
      default: 'Tons',
    },

    // Location & Corridor
    currentLocation: {
      type: String,
      required: [true, 'Current location is required'],
      trim: true,
      minlength: [2, 'Current location must be at least 2 characters'],
      maxlength: [150, 'Current location cannot exceed 150 characters'],
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination or corridor is required'],
      trim: true,
      minlength: [2, 'Destination must be at least 2 characters'],
      maxlength: [150, 'Destination cannot exceed 150 characters'],
      index: true,
    },
    operatingCorridor: {
      type: String,
      trim: true,
      maxlength: [200, 'Operating corridor cannot exceed 200 characters'],
      default: '',
    },

    // Schedule & Return-trip Details
    availabilityDate: {
      type: Date,
      required: [true, 'Availability date is required'],
      index: true,
    },
    availableUntilDate: {
      type: Date,
      default: null,
    },
    isReturnTrip: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Pricing & Notes
    rateExpectation: {
      type: Number,
      min: [0, 'Rate expectation cannot be negative'],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },

    // Status & Verification
    status: {
      type: String,
      enum: {
        values: VEHICLE_AVAILABILITY_STATUSES,
        message: '{VALUE} is not a valid vehicle availability status',
      },
      default: 'AVAILABLE',
      uppercase: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
vehicleAvailabilitySchema.index({ currentLocation: 1, destination: 1, status: 1 });
vehicleAvailabilitySchema.index({ transporterId: 1, createdAt: -1 });

vehicleAvailabilitySchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    transporterId: this.transporterId,
    transporterName: this.transporterName,
    fleetName: this.fleetName,
    contactPhone: this.contactPhone,
    contactEmail: this.contactEmail,
    vehicleType: this.vehicleType,
    capacity: this.capacity,
    capacityUnit: this.capacityUnit,
    capacityDisplay: `${this.capacity} ${this.capacityUnit}`,
    currentLocation: this.currentLocation,
    destination: this.destination,
    route: `${this.currentLocation} → ${this.destination}`,
    operatingCorridor: this.operatingCorridor,
    availabilityDate: this.availabilityDate ? this.availabilityDate.toISOString() : null,
    availableUntilDate: this.availableUntilDate ? this.availableUntilDate.toISOString() : null,
    isReturnTrip: Boolean(this.isReturnTrip),
    rateExpectation: this.rateExpectation,
    rateExpectationFormatted: this.rateExpectation
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(this.rateExpectation)
      : null,
    notes: this.notes,
    status: this.status,
    verificationStatus: this.verificationStatus || 'NOT_SUBMITTED',
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
  };
};

const VehicleAvailability =
  mongoose.models.VehicleAvailability ||
  mongoose.model('VehicleAvailability', vehicleAvailabilitySchema);

export default VehicleAvailability;
