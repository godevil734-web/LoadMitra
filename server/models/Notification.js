import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'QUOTE_RECEIVED',
  'QUOTE_ACCEPTED',
  'QUOTE_REJECTED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'LOAD_PICKED_UP',
  'TRANSIT_UPDATE',
  'DELIVERY_REPORTED',
  'DELIVERY_COMPLETED',
  'DELIVERY_DISPUTED',
  'VERIFICATION_SUBMITTED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'VERIFICATION_CORRECTION',
  'SYSTEM_NOTICE',
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreightListing',
      default: null,
      index: true,
    },
    verificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransporterVerification',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound querying indexes for efficient unread count and paginated feeds
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Helper to convert to safe client object
notificationSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    recipientId: this.recipientId,
    type: this.type,
    title: this.title,
    message: this.message,
    bookingId: this.bookingId,
    listingId: this.listingId,
    verificationId: this.verificationId,
    isRead: this.isRead,
    readAt: this.readAt ? this.readAt.toISOString() : null,
    metadata: this.metadata || {},
    createdAt: this.createdAt ? this.createdAt.toISOString() : null,
  };
};

/**
 * Static helper: create notification with basic deduplication
 * Avoids spamming recipient if an identical unread notification was issued in the last 60 seconds
 */
notificationSchema.statics.sendNotification = async function ({
  recipientId,
  type,
  title,
  message,
  bookingId = null,
  listingId = null,
  verificationId = null,
  metadata = {},
  session = null,
}) {
  if (!recipientId || !type || !title || !message) {
    return null;
  }

  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existing = await this.findOne({
      recipientId,
      type,
      bookingId: bookingId || null,
      listingId: listingId || null,
      isRead: false,
      createdAt: { $gte: oneMinuteAgo },
    }).session(session);

    if (existing) {
      return existing;
    }

    const doc = new this({
      recipientId,
      type,
      title,
      message,
      bookingId: bookingId || null,
      listingId: listingId || null,
      verificationId: verificationId || null,
      metadata: metadata || {},
    });

    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }
    return doc;
  } catch (err) {
    // Non-fatal: notification failure should not block core business operations
    console.warn(`[Notification] Failed to send notification: ${err.message}`);
    return null;
  }
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
