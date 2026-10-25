import express from 'express';
import mongoose from 'mongoose';
import FreightListing, { LISTING_STATUSES } from '../models/FreightListing.js';
import { CARGO_TYPES, VEHICLE_TYPES } from '../models/Lead.js';
import { requireShipperAuth } from '../utils/auth.js';

const router = express.Router();

// Helper: Escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/listings
 * Public Freight Marketplace Feed
 * Supports pagination, multi-attribute filtering (origin, destination, cargo, status, search, price, weight), and sorting
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      origin,
      destination,
      cargo,
      vehicleType,
      pickupDate,
      status,
      search,
      minPrice,
      maxPrice,
      minWeight,
      maxWeight,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Status filter: default to OPEN if not specified, or allow 'ALL'
    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (LISTING_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    } else if (!status) {
      // Default to OPEN listings for marketplace browse
      query.status = 'OPEN';
    }

    // Origin filter (case-insensitive substring)
    if (origin && typeof origin === 'string' && origin.trim()) {
      query.origin = { $regex: escapeRegex(origin.trim()), $options: 'i' };
    }

    // Destination filter (case-insensitive substring)
    if (destination && typeof destination === 'string' && destination.trim()) {
      query.destination = { $regex: escapeRegex(destination.trim()), $options: 'i' };
    }

    // Cargo Category filter
    if (cargo && typeof cargo === 'string' && cargo.trim() && cargo.toUpperCase() !== 'ALL') {
      query.cargoCategory = { $regex: `^${escapeRegex(cargo.trim())}$`, $options: 'i' };
    }

    // Text search query across route, business name, and cargo description
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [
        { origin: searchRegex },
        { destination: searchRegex },
        { businessName: searchRegex },
        { cargoDescription: searchRegex },
        { cargoCategory: searchRegex },
      ];
    }

    // Price range filters
    if (minPrice || maxPrice) {
      query.offeredPrice = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.offeredPrice.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.offeredPrice.$lte = Number(maxPrice);
      }
    }

    // Vehicle type filter
    if (vehicleType && typeof vehicleType === 'string' && vehicleType.trim() && vehicleType.toUpperCase() !== 'ALL') {
      const vRegex = new RegExp(escapeRegex(vehicleType.trim()), 'i');
      query.vehicleRequirements = { $elemMatch: { $regex: vRegex } };
    }

    // Pickup date filter
    if (pickupDate && typeof pickupDate === 'string' && pickupDate.trim()) {
      const dateObj = new Date(pickupDate.trim());
      if (!isNaN(dateObj.getTime())) {
        const startOfDay = new Date(dateObj);
        startOfDay.setUTCHours(0, 0, 0, 0);
        query.pickupDate = { $gte: startOfDay };
      }
    }

    // Weight range filters
    if (minWeight || maxWeight) {
      query.weight = {};
      if (minWeight && !isNaN(Number(minWeight))) {
        query.weight.$gte = Number(minWeight);
      }
      if (maxWeight && !isNaN(Number(maxWeight))) {
        query.weight.$lte = Number(maxWeight);
      }
    }

    // Sorting configuration
    const allowedSortFields = ['createdAt', 'pickupDate', 'offeredPrice', 'weight'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    const [totalCount, listings] = await Promise.all([
      FreightListing.countDocuments(query),
      FreightListing.find(query).sort(sortOptions).skip(skip).limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        origin: origin || null,
        destination: destination || null,
        cargo: cargo || null,
        status: status || 'OPEN',
        search: search || null,
      },
      data: listings.map((l) => l.toSafeObject()),
    });
  } catch (err) {
    console.error('Error fetching freight listings:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve freight listings.',
    });
  }
});

/**
 * GET /api/listings/my-listings
 * Protected: Shippers can retrieve and manage their own freight listings
 */
router.get('/my-listings', requireShipperAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { shipperId: req.user.sub };

    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (LISTING_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    }

    const [totalCount, listings] = await Promise.all([
      FreightListing.countDocuments(query),
      FreightListing.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: listings.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: listings.map((l) => l.toSafeObject()),
    });
  } catch (err) {
    console.error('Error fetching my-listings:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your listings.',
    });
  }
});

/**
 * GET /api/listings/:id
 * Retrieve details for a single freight listing
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid freight listing ID format.',
      });
    }

    const listing = await FreightListing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: listing.toSafeObject(),
    });
  } catch (err) {
    console.error('Error fetching listing details:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve listing details.',
    });
  }
});

/**
 * POST /api/listings
 * Protected: Create a new freight listing (Shipper only)
 */
router.post('/', requireShipperAuth, async (req, res) => {
  try {
    const {
      origin,
      destination,
      cargoCategory,
      cargoDescription,
      weight,
      weightUnit = 'Tons',
      pickupDate,
      deliveryDate,
      offeredPrice,
      priceType = 'FIXED',
      vehicleRequirements = [],
      notes = '',
    } = req.body || {};

    const cleanOrigin = (origin || '').trim();
    const cleanDestination = (destination || '').trim();
    const cleanCargo = (cargoCategory || '').trim();
    const cleanDesc = (cargoDescription || '').trim();
    const cleanWeight = parseFloat(weight);
    const cleanPrice = parseFloat(offeredPrice);

    const errors = {};

    if (!cleanOrigin || cleanOrigin.length < 2) {
      errors.origin = 'Origin location is required (at least 2 characters)';
    } else if (cleanOrigin.length > 150) {
      errors.origin = 'Origin location cannot exceed 150 characters';
    }

    if (!cleanDestination || cleanDestination.length < 2) {
      errors.destination = 'Destination location is required (at least 2 characters)';
    } else if (cleanDestination.length > 150) {
      errors.destination = 'Destination location cannot exceed 150 characters';
    }

    if (cleanOrigin && cleanDestination && cleanOrigin.toLowerCase() === cleanDestination.toLowerCase()) {
      errors.destination = 'Destination cannot be identical to origin';
    }

    if (!cleanCargo) {
      errors.cargoCategory = 'Cargo category is required';
    } else if (!CARGO_TYPES.includes(cleanCargo)) {
      errors.cargoCategory = `Invalid cargo category. Allowed: ${CARGO_TYPES.join(', ')}`;
    }

    if (isNaN(cleanWeight) || cleanWeight <= 0) {
      errors.weight = 'Weight must be a positive number';
    } else if (cleanWeight > 1000) {
      errors.weight = 'Weight cannot exceed 1000 tons';
    }

    if (!['Tons', 'Quintals', 'Kg'].includes(weightUnit)) {
      errors.weightUnit = 'Weight unit must be Tons, Quintals, or Kg';
    }

    if (!pickupDate) {
      errors.pickupDate = 'Pickup date is required';
    } else {
      const parsedPickup = new Date(pickupDate);
      if (isNaN(parsedPickup.getTime())) {
        errors.pickupDate = 'Pickup date is invalid';
      }
    }

    if (deliveryDate) {
      const parsedPickup = new Date(pickupDate);
      const parsedDelivery = new Date(deliveryDate);
      if (isNaN(parsedDelivery.getTime())) {
        errors.deliveryDate = 'Delivery date is invalid';
      } else if (parsedDelivery < parsedPickup) {
        errors.deliveryDate = 'Delivery date cannot be before pickup date';
      }
    }

    if (isNaN(cleanPrice) || cleanPrice < 100) {
      errors.offeredPrice = 'Offered price must be at least ₹100';
    } else if (cleanPrice > 5000000) {
      errors.offeredPrice = 'Offered price cannot exceed ₹50,00,000';
    }

    if (!['FIXED', 'NEGOTIABLE', 'PER_TON'].includes(priceType)) {
      errors.priceType = 'Price type must be FIXED, NEGOTIABLE, or PER_TON';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for freight listing.',
        errors,
      });
    }

    // Resolve vehicle requirements as array of strings
    const resolvedVehicles = Array.isArray(vehicleRequirements)
      ? vehicleRequirements.filter(Boolean)
      : typeof vehicleRequirements === 'string' && vehicleRequirements.trim()
      ? [vehicleRequirements.trim()]
      : [];

    const newListing = await FreightListing.create({
      shipperId: req.user.sub,
      shipperName: req.user.name,
      businessName: req.user.businessName,
      contactPhone: req.user.phone,
      contactEmail: req.user.email,
      origin: cleanOrigin,
      destination: cleanDestination,
      cargoCategory: cleanCargo,
      cargoDescription: cleanDesc,
      weight: cleanWeight,
      weightUnit,
      pickupDate: new Date(pickupDate),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      offeredPrice: cleanPrice,
      priceType,
      vehicleRequirements: resolvedVehicles,
      notes: (notes || '').trim(),
      status: 'OPEN',
    });

    return res.status(201).json({
      success: true,
      message: 'Freight listing published successfully to RouteWise marketplace.',
      data: newListing.toSafeObject(),
    });
  } catch (err) {
    console.error('Error creating freight listing:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create freight listing.',
    });
  }
});

/**
 * PUT /api/listings/:id
 * Protected: Update freight listing details (Restricted to listing owner or admin)
 */
router.put('/:id', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid freight listing ID.',
      });
    }

    const listing = await FreightListing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    // Requirement 6: Role-based owner authorization enforcement
    const isOwner = listing.shipperId.toString() === req.user.sub;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to modify another shipper's freight listing.",
      });
    }

    const {
      origin,
      destination,
      cargoCategory,
      cargoDescription,
      weight,
      weightUnit,
      pickupDate,
      deliveryDate,
      offeredPrice,
      priceType,
      vehicleRequirements,
      notes,
    } = req.body || {};

    const errors = {};

    if (origin !== undefined) {
      const cleanOrigin = origin.trim();
      if (cleanOrigin.length < 2 || cleanOrigin.length > 150) {
        errors.origin = 'Origin must be between 2 and 150 characters';
      } else {
        listing.origin = cleanOrigin;
      }
    }

    if (destination !== undefined) {
      const cleanDest = destination.trim();
      if (cleanDest.length < 2 || cleanDest.length > 150) {
        errors.destination = 'Destination must be between 2 and 150 characters';
      } else {
        listing.destination = cleanDest;
      }
    }

    if (cargoCategory !== undefined) {
      if (!CARGO_TYPES.includes(cargoCategory)) {
        errors.cargoCategory = `Invalid cargo category. Allowed: ${CARGO_TYPES.join(', ')}`;
      } else {
        listing.cargoCategory = cargoCategory;
      }
    }

    if (cargoDescription !== undefined) {
      listing.cargoDescription = cargoDescription.trim();
    }

    if (weight !== undefined) {
      const numWeight = parseFloat(weight);
      if (isNaN(numWeight) || numWeight <= 0) {
        errors.weight = 'Weight must be greater than zero';
      } else {
        listing.weight = numWeight;
      }
    }

    if (weightUnit !== undefined) {
      if (['Tons', 'Quintals', 'Kg'].includes(weightUnit)) {
        listing.weightUnit = weightUnit;
      }
    }

    if (pickupDate !== undefined) {
      const parsedPickup = new Date(pickupDate);
      if (isNaN(parsedPickup.getTime())) {
        errors.pickupDate = 'Invalid pickup date';
      } else {
        listing.pickupDate = parsedPickup;
      }
    }

    if (deliveryDate !== undefined) {
      if (deliveryDate === null || deliveryDate === '') {
        listing.deliveryDate = null;
      } else {
        const parsedDelivery = new Date(deliveryDate);
        if (isNaN(parsedDelivery.getTime())) {
          errors.deliveryDate = 'Invalid delivery date';
        } else {
          listing.deliveryDate = parsedDelivery;
        }
      }
    }

    if (offeredPrice !== undefined) {
      const numPrice = parseFloat(offeredPrice);
      if (isNaN(numPrice) || numPrice < 100) {
        errors.offeredPrice = 'Offered price must be at least ₹100';
      } else {
        listing.offeredPrice = numPrice;
      }
    }

    if (priceType !== undefined && ['FIXED', 'NEGOTIABLE', 'PER_TON'].includes(priceType)) {
      listing.priceType = priceType;
    }

    if (vehicleRequirements !== undefined) {
      listing.vehicleRequirements = Array.isArray(vehicleRequirements)
        ? vehicleRequirements.filter(Boolean)
        : [vehicleRequirements];
    }

    if (notes !== undefined) {
      listing.notes = notes.trim();
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for listing update.',
        errors,
      });
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: 'Freight listing updated successfully.',
      data: listing.toSafeObject(),
    });
  } catch (err) {
    console.error('Error updating freight listing:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update freight listing.',
    });
  }
});

/**
 * PATCH /api/listings/:id/status
 * Protected: Update status of a freight listing (e.g. CANCELLED, ASSIGNED, COMPLETED)
 */
router.patch('/:id/status', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid freight listing ID.',
      });
    }

    const cleanStatus = (status || '').toUpperCase().trim();
    if (!LISTING_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${LISTING_STATUSES.join(', ')}`,
      });
    }

    const listing = await FreightListing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    const isOwner = listing.shipperId.toString() === req.user.sub;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to change the status of another shipper's listing.",
      });
    }

    listing.status = cleanStatus;
    await listing.save();

    return res.status(200).json({
      success: true,
      message: `Listing status updated to ${cleanStatus}.`,
      data: listing.toSafeObject(),
    });
  } catch (err) {
    console.error('Error updating listing status:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update listing status.',
    });
  }
});

/**
 * DELETE /api/listings/:id
 * Protected: Delete a freight listing (Restricted to owner or admin)
 */
router.delete('/:id', requireShipperAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid freight listing ID.',
      });
    }

    const listing = await FreightListing.findById(id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Freight listing not found.',
      });
    }

    const isOwner = listing.shipperId.toString() === req.user.sub;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete another shipper's freight listing.",
      });
    }

    await FreightListing.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Freight listing successfully deleted from marketplace.',
    });
  } catch (err) {
    console.error('Error deleting freight listing:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete freight listing.',
    });
  }
});

export default router;
