import express from 'express';
import mongoose from 'mongoose';
import LoadInterest, { LOAD_INTEREST_STATUSES } from '../models/LoadInterest.js';
import FreightListing from '../models/FreightListing.js';
import VehicleAvailability from '../models/VehicleAvailability.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { requireAuth, requireTransporterAuth, requireShipperAuth } from '../utils/auth.js';
import { atomicAssignAndBook } from './bookings.js';

const router = express.Router();

/**
 * POST /api/interests
 * Authenticated Transporter: Express interest in an OPEN freight listing
 */
router.post('/', requireTransporterAuth, async (req, res) => {
  try {
    const {
      listingId,
      proposedRate,
      proposedVehicle,
      availableFromDate,
      vehicleAvailabilityId,
      message,
    } = req.body || {};

    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid freight listing ID is required.',
      });
    }

    // 1. Validate that the listing exists
    const listing = await FreightListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    // 2. Validate that the listing is currently OPEN
    if (listing.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: `Cannot express interest in this listing. The current listing status is "${listing.status}" (only OPEN listings accept bids).`,
      });
    }

    // 3. Validate proposed commercial terms
    const numRate = Number(proposedRate);
    if (!proposedRate || isNaN(numRate) || numRate < 100 || numRate > 5000000) {
      return res.status(400).json({
        success: false,
        message: 'Proposed rate must be a valid amount between ₹100 and ₹50,00,000.',
      });
    }

    // 4. Validate vehicle availability if provided
    let attachedVehicleId = null;
    let resolvedVehicleType = (proposedVehicle || '').trim();
    let resolvedAvailDate = availableFromDate ? new Date(availableFromDate) : null;

    if (vehicleAvailabilityId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleAvailabilityId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle availability ID format.',
        });
      }

      const vehicle = await VehicleAvailability.findById(vehicleAvailabilityId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle availability record not found.',
        });
      }

      if (vehicle.transporterId.toString() !== req.user.sub) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only quote with vehicles registered to your transporter account.',
        });
      }

      if (vehicle.status !== 'AVAILABLE') {
        return res.status(409).json({
          success: false,
          message: `Vehicle is currently "${vehicle.status}" and cannot be attached to a new quote.`,
        });
      }

      // Capacity validation
      if (typeof vehicle.capacity === 'number' && typeof listing.weight === 'number') {
        let vCap = vehicle.capacity;
        if (vehicle.capacityUnit === 'Quintals') vCap /= 10;
        if (vehicle.capacityUnit === 'Kg') vCap /= 1000;

        let lWeight = listing.weight;
        if (listing.weightUnit === 'Quintals') lWeight /= 10;
        if (listing.weightUnit === 'Kg') lWeight /= 1000;

        if (vCap < lWeight) {
          return res.status(400).json({
            success: false,
            message: `Vehicle capacity (${vehicle.capacity} ${vehicle.capacityUnit}) is insufficient for load weight (${listing.weight} ${listing.weightUnit}).`,
          });
        }
      }

      // Schedule compatibility
      if (listing.pickupDate && vehicle.availabilityDate) {
        const pDate = new Date(listing.pickupDate).setHours(0, 0, 0, 0);
        const vDate = new Date(vehicle.availabilityDate).setHours(0, 0, 0, 0);
        if (pDate < vDate) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle availability date is later than the required pickup date.',
          });
        }
      }
      if (listing.pickupDate && vehicle.availableUntilDate) {
        const pDate = new Date(listing.pickupDate).setHours(23, 59, 59, 999);
        const uDate = new Date(vehicle.availableUntilDate).setHours(23, 59, 59, 999);
        if (pDate > uDate) {
          return res.status(400).json({
            success: false,
            message: 'Listing pickup date exceeds vehicle available until date.',
          });
        }
      }

      attachedVehicleId = vehicle._id;
      if (!resolvedVehicleType) resolvedVehicleType = vehicle.vehicleType;
      if (!resolvedAvailDate) resolvedAvailDate = vehicle.availabilityDate;
    }

    // 5. Prevent duplicate active requests by the same transporter for the same listing
    const existingActiveRequest = await LoadInterest.findOne({
      listingId: listing._id,
      transporterId: req.user.sub,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (existingActiveRequest) {
      return res.status(409).json({
        success: false,
        message: `You already have an active request (${existingActiveRequest.status}) for this freight listing. You cannot submit duplicate active requests.`,
        existingRequestId: existingActiveRequest._id,
      });
    }

    // 6. Create the new load interest record
    const interest = await LoadInterest.create({
      listingId: listing._id,
      shipperId: listing.shipperId,
      transporterId: req.user.sub,
      transporterName: req.user.name,
      fleetName: req.user.businessName,
      transporterPhone: req.user.phone,
      transporterEmail: req.user.email,
      proposedRate: numRate,
      proposedVehicle: resolvedVehicleType,
      vehicleAvailabilityId: attachedVehicleId,
      availableFromDate: resolvedAvailDate,
      message: (message || '').trim(),
      status: 'PENDING',
    });

    // NOTE: Listing status is strictly PRESERVED as OPEN. No automatic assignment merely upon interest submission.

    // Dispatch in-app notification to the shipper
    await Notification.sendNotification({
      recipientId: listing.shipperId,
      type: 'QUOTE_RECEIVED',
      title: 'New Transporter Quote Received 🚚',
      message: `${req.user.businessName || req.user.name} submitted a quote of ₹${numRate.toLocaleString('en-IN')} for your load (${listing.origin} → ${listing.destination}).`,
      listingId: listing._id,
      metadata: {
        interestId: interest._id,
        proposedRate: numRate,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Interest submitted successfully to the shipper.',
      data: interest.toSafeObject(),
    });
  } catch (err) {
    console.error('Error submitting load interest:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit load interest request.',
    });
  }
});

/**
 * GET /api/interests/my-requests
 * Authenticated Transporter: Track all loads they have expressed interest in
 */
router.get('/my-requests', requireTransporterAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { transporterId: req.user.sub };

    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (LOAD_INTEREST_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    }

    const [totalCount, requests] = await Promise.all([
      LoadInterest.countDocuments(query),
      LoadInterest.find(query)
        .populate({
          path: 'listingId',
          select:
            'origin destination cargoCategory cargoDescription weight weightUnit offeredPrice pickupDate deliveryDate status businessName contactPhone vehicleRequirements',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    const formattedData = requests.map((item) => {
      const safe = item.toSafeObject();
      const listing = item.listingId;
      return {
        ...safe,
        listing: listing
          ? {
              id: listing._id,
              origin: listing.origin,
              destination: listing.destination,
              route: `${listing.origin} → ${listing.destination}`,
              cargoCategory: listing.cargoCategory,
              cargoDescription: listing.cargoDescription,
              weightDisplay: `${listing.weight} ${listing.weightUnit}`,
              offeredPrice: listing.offeredPrice,
              pickupDate: listing.pickupDate ? listing.pickupDate.toISOString() : null,
              status: listing.status,
              shipperBusinessName: listing.businessName,
              shipperContactPhone: item.status === 'ACCEPTED' ? listing.contactPhone : null,
              vehicleRequirements: listing.vehicleRequirements || [],
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: formattedData,
    });
  } catch (err) {
    console.error('Error fetching transporter load requests:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve load requests.',
    });
  }
});

/**
 * GET /api/interests/listing/:listingId
 * Authenticated Shipper: Review incoming requests for their listing
 * ONLY the owning shipper can access this endpoint!
 */
router.get('/listing/:listingId', requireShipperAuth, async (req, res) => {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID format.',
      });
    }

    const listing = await FreightListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    // Ownership check: Only the owning shipper can review requests
    if (listing.shipperId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only review requests for your own freight listings.',
      });
    }

    const requests = await LoadInterest.find({ listingId: listing._id }).sort({ createdAt: -1 });

    // Compute real trust metrics for quoting transporters
    const transporterIds = [...new Set(requests.map((r) => r.transporterId.toString()))];
    const [transporters, completedCounts] = await Promise.all([
      User.find({ _id: { $in: transporterIds } }).select('_id verificationStatus').lean(),
      Booking.aggregate([
        {
          $match: {
            transporterId: { $in: transporterIds.map((id) => new mongoose.Types.ObjectId(id)) },
            status: 'COMPLETED',
          },
        },
        { $group: { _id: '$transporterId', count: { $sum: 1 } } },
      ]),
    ]);

    const verificationMap = new Map();
    transporters.forEach((t) => verificationMap.set(t._id.toString(), t.verificationStatus || 'NOT_SUBMITTED'));

    const completedMap = new Map();
    completedCounts.forEach((c) => completedMap.set(c._id.toString(), c.count));

    return res.status(200).json({
      success: true,
      count: requests.length,
      listing: {
        id: listing._id,
        route: `${listing.origin} → ${listing.destination}`,
        cargoCategory: listing.cargoCategory,
        weightDisplay: `${listing.weight} ${listing.weightUnit}`,
        offeredPrice: listing.offeredPrice,
        status: listing.status,
      },
      data: requests.map((r) => {
        const safe = r.toSafeObject();
        const tId = r.transporterId.toString();
        return {
          ...safe,
          transporterVerificationStatus: verificationMap.get(tId) || 'NOT_SUBMITTED',
          transporterCompletedBookings: completedMap.get(tId) || 0,
        };
      }),
    });
  } catch (err) {
    console.error('Error fetching listing interest requests:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve requests for this listing.',
    });
  }
});

/**
 * PATCH /api/interests/:id/withdraw
 * Authenticated Transporter: Withdraw an active load request
 * Transporter can only withdraw their own request, and only if status is PENDING
 */
router.patch('/:id/withdraw', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid load request ID format.',
      });
    }

    const interest = await LoadInterest.findById(id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Load interest request not found.',
      });
    }

    // Authorization check: Only the requesting transporter can withdraw
    if (interest.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only withdraw your own load interest requests.',
      });
    }

    // Permitted state transition validation:
    // Only PENDING can transition to WITHDRAWN
    if (interest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot withdraw request with status "${interest.status}". Only PENDING requests may be withdrawn.`,
      });
    }

    interest.status = 'WITHDRAWN';
    interest.withdrawnAt = new Date();
    await interest.save();

    return res.status(200).json({
      success: true,
      message: 'Load interest request successfully withdrawn.',
      data: interest.toSafeObject(),
    });
  } catch (err) {
    console.error('Error withdrawing load request:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to withdraw load request.',
    });
  }
});

/**
 * PATCH /api/interests/:id/review
 * Authenticated Shipper: Review and ACCEPT or REJECT an interest request
 * ONLY the owning shipper can review, and only PENDING requests can be transitioned
 */
router.patch('/:id/review', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid load request ID format.',
      });
    }

    const interest = await LoadInterest.findById(id);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Load interest request not found.',
      });
    }

    // Cross-user authorization check: Only the owning shipper can review
    if (interest.shipperId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only review requests for freight listings owned by your account.',
      });
    }

    // Permitted state transition validation:
    // Only PENDING can transition to ACCEPTED or REJECTED
    if (interest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot review request with status "${interest.status}". Only PENDING requests may be accepted or rejected.`,
      });
    }

    const { action, reviewNotes } = req.body || {};
    const cleanAction = (action || '').toUpperCase().trim();

    if (!['ACCEPTED', 'REJECTED'].includes(cleanAction)) {
      return res.status(400).json({
        success: false,
        message: 'Review action must be either "ACCEPTED" or "REJECTED".',
      });
    }

    // Phase 5: Atomic Load Assignment and Booking Creation
    if (
      cleanAction === 'ACCEPTED' &&
      (req.body.assign === true ||
        req.body.assignLoad === true ||
        req.body.vehicleAvailabilityId)
    ) {
      const result = await atomicAssignAndBook({
        listingId: interest.listingId,
        interestId: interest._id,
        vehicleAvailabilityId: req.body.vehicleAvailabilityId || interest.vehicleAvailabilityId,
        reviewNotes,
        shipperUser: req.user,
      });

      if (result.error) {
        return res.status(result.status).json({
          success: false,
          message: result.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Load request accepted and booking confirmed.',
        data: result.interest.toSafeObject(),
        booking: result.booking.toSafeObject(req.user.sub, req.user.role),
      });
    }

    interest.status = cleanAction;
    interest.reviewNotes = (reviewNotes || '').trim();
    interest.reviewedAt = new Date();
    await interest.save();

    return res.status(200).json({
      success: true,
      message: `Load request marked as ${cleanAction}.`,
      data: interest.toSafeObject(),
    });
  } catch (err) {
    console.error('Error reviewing load request:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete review on load request.',
    });
  }
});

export default router;
