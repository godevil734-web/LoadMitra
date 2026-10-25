import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Booking, { BOOKING_STATUSES } from '../models/Booking.js';
import FreightListing from '../models/FreightListing.js';
import LoadInterest from '../models/LoadInterest.js';
import VehicleAvailability from '../models/VehicleAvailability.js';
import Notification from '../models/Notification.js';
import {
  requireAuth,
  requireShipperAuth,
  requireTransporterAuth,
} from '../utils/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import {
  uploadMiddleware,
  validateFileMetadata,
  savePrivateFile,
  getPrivateFilePath,
} from '../services/storage.js';

const router = express.Router();

/**
 * Shared atomic assignment helper
 * Executes ACID transaction on MongoDB Atlas replica set to atomically claim listing,
 * reserve vehicle, accept winning bid, reject competing bids, and confirm booking.
 */
export async function atomicAssignAndBook({
  listingId,
  interestId,
  vehicleAvailabilityId,
  reviewNotes,
  shipperUser,
}) {
  // 1. Validate listing
  const listing = await FreightListing.findById(listingId);
  if (!listing) {
    return { status: 404, error: 'Freight listing not found.' };
  }

  // Shipper ownership authorization
  if (listing.shipperId.toString() !== shipperUser.sub) {
    return {
      status: 403,
      error: 'Forbidden: You can only assign bids for freight listings owned by your account.',
    };
  }

  // Status check on listing
  if (listing.status !== 'OPEN') {
    return {
      status: 409,
      error: `Conflict: Listing is currently "${listing.status}" and cannot be assigned. Only OPEN listings can be assigned.`,
    };
  }

  // 2. Validate load interest bid
  const interest = await LoadInterest.findById(interestId);
  if (!interest) {
    return { status: 404, error: 'Load interest bid not found.' };
  }

  if (interest.listingId.toString() !== listing._id.toString()) {
    return {
      status: 400,
      error: 'Invalid request: The selected quote does not belong to this freight listing.',
    };
  }

  if (interest.status !== 'PENDING') {
    return {
      status: 409,
      error: `Conflict: Quote is already "${interest.status}". Only PENDING quotes can be accepted.`,
    };
  }

  // 3. Resolve and validate vehicle availability
  const resolvedVehicleId = vehicleAvailabilityId || interest.vehicleAvailabilityId;
  let vehicle = null;

  if (resolvedVehicleId) {
    vehicle = await VehicleAvailability.findById(resolvedVehicleId);
    if (!vehicle) {
      return { status: 404, error: 'Vehicle availability record not found.' };
    }
  } else {
    // Look for an available vehicle owned by the transporter
    vehicle = await VehicleAvailability.findOne({
      transporterId: interest.transporterId,
      status: 'AVAILABLE',
    });
  }

  // If no vehicle record exists for the transporter, create a designated record for this quote
  if (!vehicle) {
    vehicle = await VehicleAvailability.create({
      transporterId: interest.transporterId,
      transporterName: interest.transporterName,
      fleetName: interest.fleetName,
      contactPhone: interest.transporterPhone,
      contactEmail: interest.transporterEmail,
      vehicleType: interest.proposedVehicle || 'Medium Commercial Truck',
      capacity: listing.weight || 10,
      capacityUnit: listing.weightUnit || 'Tons',
      currentLocation: listing.origin,
      destination: listing.destination,
      availabilityDate: interest.availableFromDate || listing.pickupDate || new Date(),
      status: 'AVAILABLE',
      notes: `Vehicle allocated for load quote ${interest._id}`,
    });
  }

  // Verify vehicle belongs to the quoting transporter
  if (vehicle.transporterId.toString() !== interest.transporterId.toString()) {
    return {
      status: 403,
      error: 'Forbidden: The selected vehicle availability does not belong to the quoting transporter.',
    };
  }

  // Verify vehicle is AVAILABLE
  if (vehicle.status !== 'AVAILABLE') {
    return {
      status: 409,
      error: `Conflict: Selected vehicle is currently "${vehicle.status}" and cannot be assigned.`,
    };
  }

  // Validate Capacity
  if (typeof vehicle.capacity === 'number' && typeof listing.weight === 'number') {
    // Normalize weights to tons for comparison if units differ
    let vehicleCapTons = vehicle.capacity;
    if (vehicle.capacityUnit === 'Quintals') vehicleCapTons /= 10;
    if (vehicle.capacityUnit === 'Kg') vehicleCapTons /= 1000;

    let listingWeightTons = listing.weight;
    if (listing.weightUnit === 'Quintals') listingWeightTons /= 10;
    if (listing.weightUnit === 'Kg') listingWeightTons /= 1000;

    if (vehicleCapTons < listingWeightTons) {
      return {
        status: 400,
        error: `Incompatible Capacity: Vehicle capacity (${vehicle.capacity} ${vehicle.capacityUnit}) is insufficient for load weight (${listing.weight} ${listing.weightUnit}).`,
      };
    }
  }

  // Validate Dates
  if (listing.pickupDate && vehicle.availabilityDate) {
    const pickupTime = new Date(listing.pickupDate).setHours(0, 0, 0, 0);
    const availTime = new Date(vehicle.availabilityDate).setHours(0, 0, 0, 0);
    if (pickupTime < availTime) {
      return {
        status: 400,
        error: `Incompatible Schedule: Load pickup date is earlier than the vehicle availability date.`,
      };
    }
  }
  if (listing.pickupDate && vehicle.availableUntilDate) {
    const pickupTime = new Date(listing.pickupDate).setHours(23, 59, 59, 999);
    const untilTime = new Date(vehicle.availableUntilDate).setHours(23, 59, 59, 999);
    if (pickupTime > untilTime) {
      return {
        status: 400,
        error: `Incompatible Schedule: Load pickup date exceeds vehicle available until date.`,
      };
    }
  }

  // 4. Atomic Execution with MongoDB Session & Transaction
  let session = null;
  let useTransaction = true;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessErr) {
    useTransaction = false;
    session = null;
  }

  try {
    const queryOpts = session ? { session } : {};

    // A. Concurrency-safe atomic claim on FreightListing
    const updatedListing = await FreightListing.findOneAndUpdate(
      { _id: listing._id, status: 'OPEN' },
      { status: 'ASSIGNED' },
      { ...queryOpts, new: true }
    );

    if (!updatedListing) {
      if (session) await session.abortTransaction();
      return {
        status: 409,
        error: 'Conflict: Freight listing was already assigned or claimed by a concurrent request.',
      };
    }

    // B. Concurrency-safe atomic reserve on VehicleAvailability
    const updatedVehicle = await VehicleAvailability.findOneAndUpdate(
      { _id: vehicle._id, status: 'AVAILABLE' },
      { status: 'MATCHED' },
      { ...queryOpts, new: true }
    );

    if (!updatedVehicle) {
      if (session) {
        await session.abortTransaction();
      } else {
        // Compensating write if transactions unavailable
        await FreightListing.findByIdAndUpdate(listing._id, { status: 'OPEN' });
      }
      return {
        status: 409,
        error: 'Conflict: Vehicle is no longer available or was reserved by another assignment.',
      };
    }

    // C. Concurrency-safe atomic update on winning bid
    const updatedInterest = await LoadInterest.findOneAndUpdate(
      { _id: interest._id, status: 'PENDING' },
      {
        status: 'ACCEPTED',
        reviewNotes: (reviewNotes || '').trim(),
        reviewedAt: new Date(),
        vehicleAvailabilityId: vehicle._id,
      },
      { ...queryOpts, new: true }
    );

    if (!updatedInterest) {
      if (session) {
        await session.abortTransaction();
      } else {
        // Compensating writes
        await FreightListing.findByIdAndUpdate(listing._id, { status: 'OPEN' });
        await VehicleAvailability.findByIdAndUpdate(vehicle._id, { status: 'AVAILABLE' });
      }
      return {
        status: 409,
        error: 'Conflict: The selected quote is no longer PENDING.',
      };
    }

    // D. Automatically reject competing pending bids on this listing
    await LoadInterest.updateMany(
      {
        listingId: listing._id,
        _id: { $ne: interest._id },
        status: 'PENDING',
      },
      {
        status: 'REJECTED',
        reviewNotes: 'Closed: Another transporter quote was accepted and assigned for this load.',
        reviewedAt: new Date(),
      },
      queryOpts
    );

    // E. Create the confirmed Booking
    const bookingPayload = {
      listingId: listing._id,
      interestId: interest._id,
      shipperId: listing.shipperId,
      transporterId: interest.transporterId,
      vehicleAvailabilityId: vehicle._id,

      // Shipper details snapshot
      shipperName: listing.shipperName,
      shipperBusinessName: listing.businessName,
      shipperPhone: listing.contactPhone,
      shipperEmail: listing.contactEmail,

      // Transporter details snapshot
      transporterName: interest.transporterName,
      transporterFleetName: interest.fleetName,
      transporterPhone: interest.transporterPhone,
      transporterEmail: interest.transporterEmail,

      // Route & cargo
      origin: listing.origin,
      destination: listing.destination,
      cargoCategory: listing.cargoCategory,
      cargoDescription: listing.cargoDescription,
      weight: listing.weight,
      weightUnit: listing.weightUnit,
      vehicleType: vehicle.vehicleType,
      vehicleCapacity: vehicle.capacity,

      // Financials
      agreedPrice: interest.proposedRate,
      currency: 'INR',

      // Dates
      scheduledPickupDate: listing.pickupDate,
      expectedDeliveryDate: listing.deliveryDate,

      status: 'CONFIRMED',
      statusHistory: [
        {
          status: 'CONFIRMED',
          changedAt: new Date(),
          changedBy: shipperUser.sub,
          changedByRole: shipperUser.role || 'SHIPPER',
          note: reviewNotes || 'Quote accepted and load assigned successfully.',
        },
      ],
    };

    let createdBooking;
    if (session) {
      const created = await Booking.create([bookingPayload], { session });
      createdBooking = created[0];
      await session.commitTransaction();
    } else {
      createdBooking = await Booking.create(bookingPayload);
    }

    // Post-commit notifications (non-blocking)
    try {
      const bRef = `RW-BK-${createdBooking._id.toString().slice(-6).toUpperCase()}`;
      await Notification.sendNotification({
        recipientId: interest.transporterId,
        type: 'QUOTE_ACCEPTED',
        title: 'Quote Accepted & Booking Confirmed! 🎉',
        message: `Your quote for ${listing.origin} → ${listing.destination} was accepted. Booking reference: ${bRef}.`,
        bookingId: createdBooking._id,
        listingId: listing._id,
      });

      await Notification.sendNotification({
        recipientId: listing.shipperId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed ✅',
        message: `Booking ${bRef} with ${interest.fleetName || interest.transporterName} has been confirmed.`,
        bookingId: createdBooking._id,
        listingId: listing._id,
      });
    } catch (_) {}

    return {
      status: 201,
      booking: createdBooking,
      interest: updatedInterest,
      listing: updatedListing,
      vehicle: updatedVehicle,
    };
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }

    // Check duplicate key violation (e.g. unique partial index code 11000) or MongoDB transaction WriteConflict
    if (
      err.code === 11000 ||
      err.code === 112 ||
      (Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) ||
      (typeof err.message === 'string' &&
        (err.message.includes('WriteConflict') ||
          err.message.includes('duplicate key') ||
          err.message.includes('E11000')))
    ) {
      return {
        status: 409,
        error:
          'Conflict: Freight listing was concurrently claimed or an active booking already exists for this resource.',
      };
    }

    throw err;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (_) {}
    }
  }
}

/**
 * POST /api/bookings/assign
 * Authenticated Shipper: Atomically assign a load to a transporter quote
 */
router.post('/assign', requireShipperAuth, async (req, res) => {
  try {
    const { listingId, interestId, vehicleAvailabilityId, reviewNotes } = req.body || {};

    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid freight listing ID is required.',
      });
    }

    if (!interestId || !mongoose.Types.ObjectId.isValid(interestId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid load interest ID is required.',
      });
    }

    if (vehicleAvailabilityId && !mongoose.Types.ObjectId.isValid(vehicleAvailabilityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle availability ID format.',
      });
    }

    const result = await atomicAssignAndBook({
      listingId,
      interestId,
      vehicleAvailabilityId,
      reviewNotes,
      shipperUser: req.user,
    });

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Load successfully assigned and booking confirmed.',
      data: {
        booking: result.booking.toSafeObject(req.user.sub, req.user.role),
        interest: result.interest.toSafeObject(),
      },
    });
  } catch (err) {
    console.error('Error assigning load and confirming booking:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete load assignment and booking.',
    });
  }
});

/**
 * GET /api/bookings/my-bookings
 * Authenticated Shipper or Transporter: Get their bookings list
 */
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (req.user.role === 'admin' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      // Admin sees all
    } else if (req.user.role === 'transporter') {
      query.transporterId = req.user.sub;
    } else {
      query.shipperId = req.user.sub;
    }

    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (BOOKING_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    }

    const [totalCount, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate({
          path: 'listingId',
          select: 'origin destination cargoCategory weight weightUnit offeredPrice pickupDate status',
        })
        .populate({
          path: 'vehicleAvailabilityId',
          select: 'vehicleType capacity capacityUnit currentLocation destination availabilityDate status',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: bookings.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: bookings.map((b) => b.toSafeObject(req.user.sub, req.user.role)),
    });
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings.',
    });
  }
});

/**
 * GET /api/bookings/:id
 * Retrieve a single booking details (Restricted to booking participants or admin)
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id)
      .populate('listingId')
      .populate('vehicleAvailabilityId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const isShipper = booking.shipperId.toString() === req.user.sub;
    const isTransporter = booking.transporterId.toString() === req.user.sub;
    const isAdmin =
      req.user.role === 'admin' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'ADMIN';

    if (!isShipper && !isTransporter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this booking.',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error retrieving booking:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/pickup
 * Authenticated Transporter: Record pickup
 * Allowed transition: CONFIRMED -> PICKED_UP
 */
router.patch('/:id/pickup', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned transporter can update pickup progress.',
      });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot record pickup from status "${booking.status}". Only CONFIRMED bookings can be picked up.`,
      });
    }

    const { notes } = req.body || {};
    booking.status = 'PICKED_UP';
    booking.actualPickupAt = new Date();
    if (notes) booking.transitNotes = notes.trim();

    booking.statusHistory.push({
      status: 'PICKED_UP',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'TRANSPORTER',
      note: notes || 'Cargo picked up from shipper origin.',
    });

    await booking.save();

    // Synchronize listing and vehicle to IN_TRANSIT
    await Promise.all([
      FreightListing.findByIdAndUpdate(booking.listingId, { status: 'IN_TRANSIT' }),
      VehicleAvailability.findByIdAndUpdate(booking.vehicleAvailabilityId, {
        status: 'IN_TRANSIT',
      }),
    ]);

    // Dispatch notification to shipper
    await Notification.sendNotification({
      recipientId: booking.shipperId,
      type: 'LOAD_PICKED_UP',
      title: 'Cargo Picked Up 📦',
      message: `Transporter ${booking.transporterFleetName || booking.transporterName} recorded pickup for booking RW-BK-${booking._id.toString().slice(-6).toUpperCase()}. Load is now in transit.`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Pickup recorded successfully. Booking is now in transit.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error recording pickup:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record pickup.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/transit
 * Authenticated Transporter: Update live transit location & checkpoint notes
 * Allowed transition: PICKED_UP or IN_TRANSIT -> IN_TRANSIT
 */
router.patch('/:id/transit', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned transporter can update transit progress.',
      });
    }

    if (!['PICKED_UP', 'IN_TRANSIT'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot update transit for booking with status "${booking.status}".`,
      });
    }

    const { location, notes } = req.body || {};
    if (!location && !notes) {
      return res.status(400).json({
        success: false,
        message: 'Current location or transit notes are required for transit update.',
      });
    }

    booking.status = 'IN_TRANSIT';
    if (location) booking.transitLocation = location.trim();
    if (notes) booking.transitNotes = notes.trim();

    booking.statusHistory.push({
      status: 'IN_TRANSIT',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'TRANSPORTER',
      note: `Transit update at ${location || 'corridor'}: ${notes || 'Moving smoothly'}`,
    });

    await booking.save();

    // Dispatch notification to shipper
    await Notification.sendNotification({
      recipientId: booking.shipperId,
      type: 'TRANSIT_UPDATE',
      title: 'Transit Progress Update 🚚',
      message: `Transit update for RW-BK-${booking._id.toString().slice(-6).toUpperCase()}: ${location || 'Checkpoint'} - ${notes || 'Moving smoothly'}`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Transit progress updated successfully.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error updating transit:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update transit status.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/delivery
 * Authenticated Transporter: Report delivery to destination
 * Allowed transition: PICKED_UP or IN_TRANSIT -> DELIVERED
 */
router.patch('/:id/delivery', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned transporter can report delivery.',
      });
    }

    if (!['PICKED_UP', 'IN_TRANSIT'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot report delivery for booking with status "${booking.status}".`,
      });
    }

    const { recipientName, deliveryNotes, proofNotes } = req.body || {};
    booking.status = 'DELIVERED';
    booking.deliveredAt = new Date();
    if (recipientName) booking.recipientName = recipientName.trim();
    if (deliveryNotes) booking.deliveryNotes = deliveryNotes.trim();
    if (proofNotes) booking.proofNotes = proofNotes.trim();

    booking.statusHistory.push({
      status: 'DELIVERED',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'TRANSPORTER',
      note: `Delivery reported by transporter. Recipient: ${recipientName || 'Warehouse In-charge'}`,
    });

    await booking.save();

    // Dispatch notification to shipper
    await Notification.sendNotification({
      recipientId: booking.shipperId,
      type: 'DELIVERY_REPORTED',
      title: 'Delivery Reported 📍',
      message: `Transporter reported delivery for RW-BK-${booking._id.toString().slice(-6).toUpperCase()} to ${recipientName || 'destination'}. Please inspect and confirm receipt.`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery reported successfully. Awaiting shipper confirmation.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error reporting delivery:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to report delivery.',
    });
  }
});

/**
 * POST /api/bookings/:id/delivery-proof
 * Authenticated Transporter: Submit proof of delivery files and recipient info
 * Stage requirement: PICKED_UP, IN_TRANSIT, or DELIVERED
 */
router.post(
  '/:id/delivery-proof',
  requireTransporterAuth,
  uploadRateLimiter,
  uploadMiddleware.array('documents', 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking ID format.',
        });
      }

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found.',
        });
      }

      // Authorization: Only assigned transporter can submit proof
      if (booking.transporterId.toString() !== req.user.sub) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only the assigned transporter can submit delivery proof for this booking.',
        });
      }

      // Stage validation
      if (!['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid booking stage: Proof of delivery cannot be submitted while booking is in status "${booking.status}".`,
        });
      }

      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one proof-of-delivery document or photograph is required.',
        });
      }

      // Validate files
      for (const file of files) {
        const val = validateFileMetadata(file);
        if (!val.valid) {
          return res.status(400).json({
            success: false,
            message: val.error,
          });
        }
      }

      const { recipientName, recipientContact, deliveryNotes } = req.body || {};

      // Save files to private storage
      const savedDocs = [];
      for (const file of files) {
        const saved = await savePrivateFile({
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          category: 'delivery_proof',
        });
        savedDocs.push({
          originalName: saved.originalName,
          storageKey: saved.storageKey,
          mimeType: saved.mimeType,
          fileSize: saved.fileSize,
          uploadedAt: new Date(),
        });
      }

      // Update delivery proof object
      if (!booking.deliveryProof) {
        booking.deliveryProof = {};
      }
      booking.deliveryProof.recipientName = recipientName ? recipientName.trim() : (booking.recipientName || '');
      booking.deliveryProof.recipientContact = recipientContact ? recipientContact.trim() : '';
      booking.deliveryProof.deliveryNotes = deliveryNotes ? deliveryNotes.trim() : (booking.deliveryNotes || '');
      booking.deliveryProof.submittedAt = new Date();
      booking.deliveryProof.evidenceStatus = 'SUBMITTED';
      if (!Array.isArray(booking.deliveryProof.documents)) {
        booking.deliveryProof.documents = [];
      }
      booking.deliveryProof.documents.push(...savedDocs);

      // Transition status to DELIVERED if not already DELIVERED
      if (booking.status !== 'DELIVERED') {
        booking.status = 'DELIVERED';
        booking.deliveredAt = new Date();
      }

      booking.statusHistory.push({
        status: 'DELIVERED',
        changedAt: new Date(),
        changedBy: req.user.sub,
        changedByRole: 'TRANSPORTER',
        note: `Proof of delivery submitted: ${savedDocs.length} evidence file(s). Recipient: ${recipientName || 'Unspecified'}`,
      });

      await booking.save();

      // Notify shipper
      await Notification.sendNotification({
        recipientId: booking.shipperId,
        type: 'DELIVERY_REPORTED',
        title: 'Proof of Delivery Submitted 📋',
        message: `Transporter uploaded proof of delivery for booking RW-BK-${booking._id.toString().slice(-6).toUpperCase()}. Please review and confirm delivery receipt.`,
        bookingId: booking._id,
        listingId: booking.listingId,
      });

      return res.status(200).json({
        success: true,
        message: 'Delivery proof submitted successfully. Awaiting shipper confirmation.',
        data: booking.toSafeObject(req.user.sub, req.user.role),
      });
    } catch (err) {
      console.error('Error submitting delivery proof:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to submit delivery proof.',
      });
    }
  }
);

/**
 * GET /api/bookings/:id/proof/:docId
 * Protected download endpoint for delivery proof files
 * Authorized only for:
 * 1. Owning Shipper
 * 2. Assigned Transporter
 * 3. Administrator
 */
router.get('/:id/proof/:docId', requireAuth, async (req, res) => {
  try {
    const { id, docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking or document ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Role check: Only assigned transporter, owning shipper, or admin
    const isShipper = booking.shipperId.toString() === req.user.sub;
    const isTransporter = booking.transporterId.toString() === req.user.sub;
    const isAdmin =
      req.user.role === 'admin' ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN';

    if (!isShipper && !isTransporter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view delivery evidence for this booking.',
      });
    }

    const doc = (booking.deliveryProof?.documents || []).find(
      (d) => d._id && d._id.toString() === docId
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Delivery proof document not found in booking records.',
      });
    }

    const filePath = getPrivateFilePath(doc.storageKey, 'delivery_proof');
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Stored evidence file not found on server.',
      });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(doc.originalName)}"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.error('Stream error reading delivery proof:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to read document file.' });
      }
    });

    return stream.pipe(res);
  } catch (err) {
    console.error('Error serving delivery proof document:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery proof.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/complete
 * Authenticated Shipper: Confirm delivery and complete the booking
 * Allowed transition: DELIVERED -> COMPLETED
 */
router.patch('/:id/complete', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.shipperId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the owning shipper can confirm delivery and complete this booking.',
      });
    }

    if (booking.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot complete booking with status "${booking.status}". Only DELIVERED bookings can be confirmed as completed.`,
      });
    }

    const { completionNotes } = req.body || {};
    booking.status = 'COMPLETED';
    booking.completedAt = new Date();
    if (completionNotes) booking.completionNotes = completionNotes.trim();

    if (booking.deliveryProof) {
      booking.deliveryProof.evidenceStatus = 'VERIFIED';
    }

    booking.statusHistory.push({
      status: 'COMPLETED',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'SHIPPER',
      note: completionNotes || 'Shipper confirmed receipt. Booking completed successfully.',
    });

    await booking.save();

    // Mark both listing and vehicle as COMPLETED
    await Promise.all([
      FreightListing.findByIdAndUpdate(booking.listingId, { status: 'COMPLETED' }),
      VehicleAvailability.findByIdAndUpdate(booking.vehicleAvailabilityId, {
        status: 'COMPLETED',
      }),
    ]);

    // Dispatch notification to transporter
    await Notification.sendNotification({
      recipientId: booking.transporterId,
      type: 'DELIVERY_COMPLETED',
      title: 'Delivery Completed & Confirmed 🎉',
      message: `Shipper confirmed receipt for booking RW-BK-${booking._id.toString().slice(-6).toUpperCase()}. Booking completed successfully.`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Booking successfully confirmed and completed.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error completing booking:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete booking.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/dispute
 * Authenticated Shipper: Open a delivery dispute on a DELIVERED booking
 */
router.patch('/:id/dispute', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.shipperId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the owning shipper can open a dispute for this booking.',
      });
    }

    if (booking.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Disputes can only be raised for bookings with status "DELIVERED" (current status: "${booking.status}").`,
      });
    }

    const { reason } = req.body || {};
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A clear dispute reason is required.',
      });
    }

    if (!booking.deliveryProof) {
      booking.deliveryProof = {};
    }
    booking.deliveryProof.evidenceStatus = 'DISPUTED';
    booking.deliveryProof.disputeReason = reason.trim();
    booking.deliveryProof.disputedAt = new Date();

    booking.statusHistory.push({
      status: 'DELIVERED',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'SHIPPER',
      note: `Delivery disputed by shipper: ${reason.trim()}`,
    });

    await booking.save();

    // Dispatch notification to transporter
    await Notification.sendNotification({
      recipientId: booking.transporterId,
      type: 'DELIVERY_DISPUTED',
      title: 'Delivery Disputed ⚠️',
      message: `Shipper opened a delivery dispute for RW-BK-${booking._id.toString().slice(-6).toUpperCase()}: ${reason.trim()}. RouteWise operations team will mediate.`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery dispute recorded. RouteWise operations team will mediate.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error raising dispute:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record delivery dispute.',
    });
  }
});

/**
 * PATCH /api/bookings/:id/cancel
 * Authenticated Shipper: Cancel booking prior to pickup
 * Allowed transition: CONFIRMED -> CANCELLED
 * Releases vehicle back to AVAILABLE and listing back to OPEN
 */
router.patch('/:id/cancel', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format.',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.shipperId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the owning shipper can cancel this booking.',
      });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot cancel booking with status "${booking.status}". Only CONFIRMED bookings prior to pickup may be cancelled.`,
      });
    }

    const { reason } = req.body || {};
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancellationReason = (reason || 'Cancelled by shipper').trim();
    booking.cancelledBy = req.user.sub;

    booking.statusHistory.push({
      status: 'CANCELLED',
      changedAt: new Date(),
      changedBy: req.user.sub,
      changedByRole: 'SHIPPER',
      note: booking.cancellationReason,
    });

    await booking.save();

    // Release vehicle back to AVAILABLE and listing back to OPEN
    await Promise.all([
      FreightListing.findByIdAndUpdate(booking.listingId, { status: 'OPEN' }),
      VehicleAvailability.findByIdAndUpdate(booking.vehicleAvailabilityId, {
        status: 'AVAILABLE',
      }),
    ]);

    // Dispatch notification to transporter
    await Notification.sendNotification({
      recipientId: booking.transporterId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled ⚠️',
      message: `Shipper cancelled booking RW-BK-${booking._id.toString().slice(-6).toUpperCase()}. Your vehicle has been released back to available.`,
      bookingId: booking._id,
      listingId: booking.listingId,
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Freight listing and vehicle have been released.',
      data: booking.toSafeObject(req.user.sub, req.user.role),
    });
  } catch (err) {
    console.error('Error cancelling booking:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking.',
    });
  }
});

export default router;
