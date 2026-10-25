import mongoose from 'mongoose';

export const CARGO_TYPES = [
  'General Goods',
  'Agricultural Goods',
  'Packaged Goods',
  'Industrial Goods',
  'Automotive & Spare Parts',
  'Textiles & Garments',
  'Other',
];

export const VEHICLE_TYPES = [
  // 12 Visual Selection Categories:
  'Mini Truck / Tata Ace',
  'Pickup Truck',
  'Light Commercial Vehicle (LCV)',
  'Medium Commercial Truck',
  'Heavy-Duty Truck',
  'Open Body Truck',
  'Closed Container Truck',
  'Refrigerated Truck',
  'Trailer / Multi-Axle Truck',
  'Flatbed Truck',
  'Tanker',
  'Tipper / Dumper',
  // Preserved Legacy Options (Backwards Compatibility):
  '14ft Open Body (3.5 - 4.5 Ton)',
  '19ft - 20ft Container (7 - 8.5 Ton)',
  '24ft Closed Container (9 - 10 Ton)',
  '32ft Single-Axle Container (7 - 9 Ton)',
  '32ft Multi-Axle Container (14 - 18 Ton)',
  '40ft Trailer / Flatbed (25 - 32 Ton)',
  'Other / Custom Fleet',
];

export const SHIPMENT_FREQUENCIES = [
  'Daily Shipments',
  '2 - 3 Times per Week',
  'Weekly',
  'Bi-weekly / Monthly',
  'Occasional / On-demand',
];

const leadSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'Role is required (SHIPPER or TRANSPORTER)'],
      enum: {
        values: ['SHIPPER', 'TRANSPORTER'],
        message: '{VALUE} is not a valid role',
      },
      uppercase: true,
      index: true,
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      minlength: [2, 'Contact name must be at least 2 characters'],
      maxlength: [100, 'Contact name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          const digitsOnly = String(v).replace(/\D/g, '');
          return digitsOnly.length >= 10 && digitsOnly.length <= 11;
        },
        message: (props) => `${props.value} is not a valid 10-11 digit phone number`,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    consentGranted: {
      type: Boolean,
      required: [true, 'Consent is required to participate in the pilot'],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: 'Consent must be granted to participate in the pilot',
      },
    },

    // Shipper-specific fields
    businessName: {
      type: String,
      trim: true,
      maxlength: [150, 'Business name cannot exceed 150 characters'],
      required: [
        function () {
          return this.role === 'SHIPPER';
        },
        'Business / trading name is required for shippers',
      ],
    },
    primaryRoute: {
      type: String,
      trim: true,
      maxlength: [250, 'Primary route cannot exceed 250 characters'],
      required: [
        function () {
          return this.role === 'SHIPPER';
        },
        'Primary shipping route corridor is required for shippers',
      ],
    },
    cargoCategory: {
      type: String,
      enum: {
        values: CARGO_TYPES,
        message: '{VALUE} is not a recognized cargo category',
      },
      required: [
        function () {
          return this.role === 'SHIPPER';
        },
        'Cargo category is required for shippers',
      ],
    },
    shipmentFrequency: {
      type: String,
      enum: {
        values: SHIPMENT_FREQUENCIES,
        message: '{VALUE} is not a recognized shipment frequency',
      },
      required: [
        function () {
          return this.role === 'SHIPPER';
        },
        'Shipment frequency is required for shippers',
      ],
    },

    // Transporter-specific fields
    fleetName: {
      type: String,
      trim: true,
      maxlength: [150, 'Fleet name cannot exceed 150 characters'],
      default: null,
    },
    vehicleType: {
      type: String,
      enum: {
        values: VEHICLE_TYPES,
        message: '{VALUE} is not a recognized vehicle type',
      },
      required: [
        function () {
          return this.role === 'TRANSPORTER';
        },
        'Vehicle type is required for transporters',
      ],
    },
    operatingRoutes: {
      type: String,
      trim: true,
      maxlength: [250, 'Operating routes cannot exceed 250 characters'],
      required: [
        function () {
          return this.role === 'TRANSPORTER';
        },
        'Operating routes/corridors are required for transporters',
      ],
    },
    availableCapacity: {
      type: String,
      trim: true,
      maxlength: [100, 'Available capacity description cannot exceed 100 characters'],
      default: null,
    },
    actualCapacity: {
      type: Number,
      default: null,
    },
    capacityUnit: {
      type: String,
      default: 'Tons',
    },
    vehicleCategories: {
      type: [String],
      default: [],
    },
    multiVehicleFleet: {
      type: Array,
      default: [],
    },

    // Internal workflow status
    status: {
      type: String,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'CONTACTED', 'ACCEPTED', 'REJECTED'],
      default: 'SUBMITTED',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Method to return safe public object
leadSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    role: this.role,
    contactName: this.contactName,
    businessName: this.businessName || null,
    fleetName: this.fleetName || null,
    route: this.role === 'SHIPPER' ? this.primaryRoute : this.operatingRoutes,
    cargoCategory: this.cargoCategory || null,
    shipmentFrequency: this.shipmentFrequency || null,
    vehicleType: this.vehicleType || null,
    availableCapacity: this.availableCapacity || null,
    actualCapacity: this.actualCapacity,
    capacityUnit: this.capacityUnit,
    vehicleCategories: this.vehicleCategories || [],
    multiVehicleFleet: this.multiVehicleFleet || [],
    status: this.status,
    createdAt: this.createdAt,
  };
};

// Method to return detailed admin object (for authorized administrators)
leadSchema.methods.toAdminObject = function () {
  return {
    id: this._id,
    role: this.role,
    contactName: this.contactName,
    businessName: this.businessName || null,
    fleetName: this.fleetName || null,
    phone: this.phone,
    email: this.email || null,
    primaryRoute: this.primaryRoute || null,
    operatingRoutes: this.operatingRoutes || null,
    route: this.role === 'SHIPPER' ? this.primaryRoute : this.operatingRoutes,
    cargoCategory: this.cargoCategory || null,
    shipmentFrequency: this.shipmentFrequency || null,
    vehicleType: this.vehicleType || null,
    availableCapacity: this.availableCapacity || null,
    actualCapacity: this.actualCapacity,
    capacityUnit: this.capacityUnit,
    vehicleCategories: this.vehicleCategories || [],
    multiVehicleFleet: this.multiVehicleFleet || [],
    consentGranted: this.consentGranted,
    status: this.status,
    adminNotes: this.adminNotes || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
