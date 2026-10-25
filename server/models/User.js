import mongoose from 'mongoose';
import { hashPassword } from '../utils/auth.js';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: ['SHIPPER', 'TRANSPORTER'],
      default: 'SHIPPER',
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Full contact name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    businessName: {
      type: String,
      required: [true, 'Business or trading name is required'],
      trim: true,
      minlength: [2, 'Business name must be at least 2 characters'],
      maxlength: [150, 'Business name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          const digits = String(v).replace(/\D/g, '');
          return digits.length >= 10 && digits.length <= 11;
        },
        message: 'Phone number must contain 10 to 11 digits',
      },
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    operatingCorridor: {
      type: String,
      trim: true,
      default: 'Gorakhpur to Lucknow (NH27 Corridor)',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CORRECTION_REQUIRED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    role: this.role,
    name: this.name,
    businessName: this.businessName,
    email: this.email,
    phone: this.phone,
    operatingCorridor: this.operatingCorridor,
    verificationStatus: this.verificationStatus || 'NOT_SUBMITTED',
    verificationNotes: this.verificationNotes || '',
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

/**
 * Bootstrap default demo shippers and transporters in MongoDB if not already present
 */
userSchema.statics.bootstrapDemoUsers = async function () {
  try {
    const demoUsers = [
      {
        email: 'shipper@routewise.in',
        name: 'Rajesh Verma',
        businessName: 'Purvanchal Agro Commodities Ltd.',
        phone: '9876543210',
        password: 'ShipperPassword123!',
        operatingCorridor: 'Gorakhpur to Lucknow (NH27 Corridor)',
        role: 'SHIPPER',
      },
      {
        email: 'shipper2@routewise.in',
        name: 'Sunil Jaiswal',
        businessName: 'Avadh Steel & Hardware Trading',
        phone: '9811223344',
        password: 'ShipperPassword123!',
        operatingCorridor: 'Kanpur to Varanasi Corridor',
        role: 'SHIPPER',
      },
      {
        email: 'transporter@routewise.in',
        name: 'Jaswinder Singh',
        businessName: 'Awadh Express Fleet Carriers',
        phone: '9811223344',
        password: 'Transporter123!',
        operatingCorridor: 'Lucknow to Gorakhpur (NH27 Return Haul Corridor)',
        role: 'TRANSPORTER',
      },
      {
        email: 'transporter2@routewise.in',
        name: 'Balwinder Gill',
        businessName: 'Northern Return Haul Logistics',
        phone: '9822334455',
        password: 'Transporter123!',
        operatingCorridor: 'Kanpur to Varanasi Corridor',
        role: 'TRANSPORTER',
      },
    ];

    for (const demo of demoUsers) {
      const exists = await this.findOne({ email: demo.email });
      if (!exists) {
        await this.create({
          role: demo.role,
          name: demo.name,
          businessName: demo.businessName,
          email: demo.email,
          phone: demo.phone,
          passwordHash: hashPassword(demo.password),
          operatingCorridor: demo.operatingCorridor,
          isActive: true,
        });
        console.log(`[Bootstrap] Created demo ${demo.role.toLowerCase()}: ${demo.email} (${demo.businessName})`);
      }
    }
  } catch (err) {
    // Non-critical, ignore duplicate key or indexing race conditions
    console.warn('[Bootstrap] Demo user check notice:', err.message);
  }
};

userSchema.statics.bootstrapDemoShippers = function () {
  return this.bootstrapDemoUsers();
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
