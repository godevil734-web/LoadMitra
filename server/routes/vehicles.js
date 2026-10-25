import express from 'express';
import mongoose from 'mongoose';
import VehicleAvailability, { VEHICLE_AVAILABILITY_STATUSES } from '../models/VehicleAvailability.js';
import { VEHICLE_TYPES } from '../models/Lead.js';
import { requireTransporterAuth } from '../utils/auth.js';

const router = express.Router();

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * GET /api/vehicles
 * Public / Transporter vehicle availability feed
 * Supports filtering by currentLocation, destination, vehicleType, capacity, isReturnTrip, availabilityDate
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      currentLocation,
      destination,
      vehicleType,
      isReturnTrip,
      minCapacity,
      maxCapacity,
      availabilityDate,
      status,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Status filter - defaults to AVAILABLE
    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (VEHICLE_AVAILABILITY_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    } else if (!status) {
      query.status = 'AVAILABLE';
    }

    if (currentLocation && typeof currentLocation === 'string' && currentLocation.trim()) {
      query.currentLocation = { $regex: escapeRegex(currentLocation.trim()), $options: 'i' };
    }

    if (destination && typeof destination === 'string' && destination.trim()) {
      query.destination = { $regex: escapeRegex(destination.trim()), $options: 'i' };
    }

    if (vehicleType && typeof vehicleType === 'string' && vehicleType.trim() && vehicleType.toUpperCase() !== 'ALL') {
      query.vehicleType = { $regex: `^${escapeRegex(vehicleType.trim())}$`, $options: 'i' };
    }

    if (isReturnTrip !== undefined && isReturnTrip !== '') {
      query.isReturnTrip = isReturnTrip === 'true' || isReturnTrip === true;
    }

    if (minCapacity || maxCapacity) {
      query.capacity = {};
      if (minCapacity && !isNaN(Number(minCapacity))) {
        query.capacity.$gte = Number(minCapacity);
      }
      if (maxCapacity && !isNaN(Number(maxCapacity))) {
        query.capacity.$lte = Number(maxCapacity);
      }
    }

    if (availabilityDate && typeof availabilityDate === 'string' && availabilityDate.trim()) {
      const parsedDate = new Date(availabilityDate.trim());
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        query.availabilityDate = { $gte: startOfDay };
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const sRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [
        { currentLocation: sRegex },
        { destination: sRegex },
        { fleetName: sRegex },
        { vehicleType: sRegex },
        { operatingCorridor: sRegex },
      ];
    }

    const [totalCount, records] = await Promise.all([
      VehicleAvailability.countDocuments(query),
      VehicleAvailability.find(query).sort({ availabilityDate: 1, createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: records.map((r) => r.toSafeObject()),
    });
  } catch (err) {
    console.error('Error querying vehicle availability:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle availability records.',
    });
  }
});

/**
 * GET /api/vehicles/my-availability
 * Authenticated Transporter: Get all their own availability postings
 */
router.get('/my-availability', requireTransporterAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { transporterId: req.user.sub };

    if (status && status.toUpperCase() !== 'ALL') {
      const cleanStatus = status.toUpperCase().trim();
      if (VEHICLE_AVAILABILITY_STATUSES.includes(cleanStatus)) {
        query.status = cleanStatus;
      }
    }

    const [totalCount, records] = await Promise.all([
      VehicleAvailability.countDocuments(query),
      VehicleAvailability.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        totalCount,
        page: pageNum,
        totalPages,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: records.map((r) => r.toSafeObject()),
    });
  } catch (err) {
    console.error('Error fetching my vehicle availability:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your vehicle records.',
    });
  }
});

/**
 * GET /api/vehicles/:id
 * Single vehicle availability details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle availability ID format.',
      });
    }

    const vehicle = await VehicleAvailability.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle availability record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicle.toSafeObject(),
    });
  } catch (err) {
    console.error('Error fetching vehicle by ID:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle details.',
    });
  }
});

/**
 * POST /api/vehicles
 * Authenticated Transporter: Create a new vehicle availability record
 */
router.post('/', requireTransporterAuth, async (req, res) => {
  try {
    const {
      vehicleType,
      capacity,
      capacityUnit = 'Tons',
      currentLocation,
      destination,
      operatingCorridor,
      availabilityDate,
      availableUntilDate,
      isReturnTrip = false,
      rateExpectation,
      notes,
    } = req.body || {};

    const errors = {};

    // Validate vehicle type
    if (!vehicleType || !VEHICLE_TYPES.includes(vehicleType)) {
      errors.vehicleType = 'Please select a valid vehicle type from the supported categories';
    }

    // Validate capacity
    const numCapacity = Number(capacity);
    if (!capacity || isNaN(numCapacity) || numCapacity <= 0 || numCapacity > 1000) {
      errors.capacity = 'Capacity must be a positive number up to 1000 tons';
    }

    // Validate locations
    const cleanCurrent = (currentLocation || '').trim();
    if (!cleanCurrent || cleanCurrent.length < 2) {
      errors.currentLocation = 'Current location is required (minimum 2 characters)';
    }

    const cleanDest = (destination || '').trim();
    if (!cleanDest || cleanDest.length < 2) {
      errors.destination = 'Destination or corridor is required (minimum 2 characters)';
    }

    if (cleanCurrent && cleanDest && cleanCurrent.toLowerCase() === cleanDest.toLowerCase()) {
      errors.destination = 'Destination must differ from current location';
    }

    // Validate availability date
    if (!availabilityDate) {
      errors.availabilityDate = 'Availability date is required';
    } else {
      const parsedDate = new Date(availabilityDate);
      if (isNaN(parsedDate.getTime())) {
        errors.availabilityDate = 'A valid availability date is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for vehicle availability submission.',
        errors,
      });
    }

    const newVehicle = await VehicleAvailability.create({
      transporterId: req.user.sub,
      transporterName: req.user.name,
      fleetName: req.user.businessName,
      contactPhone: req.user.phone,
      contactEmail: req.user.email,
      vehicleType,
      capacity: numCapacity,
      capacityUnit: ['Tons', 'Quintals', 'Kg'].includes(capacityUnit) ? capacityUnit : 'Tons',
      currentLocation: cleanCurrent,
      destination: cleanDest,
      operatingCorridor: (operatingCorridor || '').trim() || `${cleanCurrent} to ${cleanDest}`,
      availabilityDate: new Date(availabilityDate),
      availableUntilDate: availableUntilDate ? new Date(availableUntilDate) : null,
      isReturnTrip: Boolean(isReturnTrip),
      rateExpectation: rateExpectation && !isNaN(Number(rateExpectation)) ? Number(rateExpectation) : null,
      notes: (notes || '').trim(),
      status: 'AVAILABLE',
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle availability published successfully.',
      data: newVehicle.toSafeObject(),
    });
  } catch (err) {
    console.error('Error creating vehicle availability:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish vehicle availability.',
    });
  }
});

/**
 * PUT /api/vehicles/:id
 * Authenticated Transporter: Modify an existing vehicle availability record
 * Transporters can ONLY modify their own records!
 */
router.put('/:id', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await VehicleAvailability.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle availability record not found.',
      });
    }

    // Ownership check (Cross-user authorization)
    if (vehicle.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only modify your own vehicle availability records.',
      });
    }

    const {
      vehicleType,
      capacity,
      capacityUnit,
      currentLocation,
      destination,
      operatingCorridor,
      availabilityDate,
      availableUntilDate,
      isReturnTrip,
      rateExpectation,
      notes,
    } = req.body || {};

    const errors = {};

    if (vehicleType !== undefined) {
      if (!VEHICLE_TYPES.includes(vehicleType)) {
        errors.vehicleType = 'Invalid vehicle type specified';
      } else {
        vehicle.vehicleType = vehicleType;
      }
    }

    if (capacity !== undefined) {
      const numCapacity = Number(capacity);
      if (isNaN(numCapacity) || numCapacity <= 0 || numCapacity > 1000) {
        errors.capacity = 'Capacity must be a positive number up to 1000 tons';
      } else {
        vehicle.capacity = numCapacity;
      }
    }

    if (capacityUnit !== undefined) {
      if (['Tons', 'Quintals', 'Kg'].includes(capacityUnit)) {
        vehicle.capacityUnit = capacityUnit;
      }
    }

    if (currentLocation !== undefined) {
      const cleanCurrent = currentLocation.trim();
      if (cleanCurrent.length < 2) {
        errors.currentLocation = 'Current location must be at least 2 characters';
      } else {
        vehicle.currentLocation = cleanCurrent;
      }
    }

    if (destination !== undefined) {
      const cleanDest = destination.trim();
      if (cleanDest.length < 2) {
        errors.destination = 'Destination must be at least 2 characters';
      } else {
        vehicle.destination = cleanDest;
      }
    }

    if (vehicle.currentLocation && vehicle.destination && vehicle.currentLocation.toLowerCase() === vehicle.destination.toLowerCase()) {
      errors.destination = 'Destination must differ from current location';
    }

    if (availabilityDate !== undefined) {
      const parsedDate = new Date(availabilityDate);
      if (isNaN(parsedDate.getTime())) {
        errors.availabilityDate = 'Invalid availability date';
      } else {
        vehicle.availabilityDate = parsedDate;
      }
    }

    if (availableUntilDate !== undefined) {
      vehicle.availableUntilDate = availableUntilDate ? new Date(availableUntilDate) : null;
    }

    if (isReturnTrip !== undefined) {
      vehicle.isReturnTrip = Boolean(isReturnTrip);
    }

    if (rateExpectation !== undefined) {
      vehicle.rateExpectation = rateExpectation && !isNaN(Number(rateExpectation)) ? Number(rateExpectation) : null;
    }

    if (operatingCorridor !== undefined) {
      vehicle.operatingCorridor = operatingCorridor.trim();
    }

    if (notes !== undefined) {
      vehicle.notes = notes.trim();
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for vehicle availability update.',
        errors,
      });
    }

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle availability updated successfully.',
      data: vehicle.toSafeObject(),
    });
  } catch (err) {
    console.error('Error updating vehicle availability:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle availability.',
    });
  }
});

/**
 * PATCH /api/vehicles/:id/status
 * Authenticated Transporter: Update status of their vehicle record
 */
router.patch('/:id/status', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await VehicleAvailability.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle availability record not found.',
      });
    }

    // Ownership check
    if (vehicle.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only modify your own vehicle availability records.',
      });
    }

    const { status } = req.body || {};
    const cleanStatus = (status || '').toUpperCase().trim();

    if (!VEHICLE_AVAILABILITY_STATUSES.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed values: ${VEHICLE_AVAILABILITY_STATUSES.join(', ')}`,
      });
    }

    vehicle.status = cleanStatus;
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: `Vehicle availability status updated to ${cleanStatus}.`,
      data: vehicle.toSafeObject(),
    });
  } catch (err) {
    console.error('Error modifying vehicle status:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update vehicle status.',
    });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Authenticated Transporter: Delete vehicle record
 */
router.delete('/:id', requireTransporterAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format.',
      });
    }

    const vehicle = await VehicleAvailability.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle availability record not found.',
      });
    }

    // Ownership check
    if (vehicle.transporterId.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own vehicle availability records.',
      });
    }

    await VehicleAvailability.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Vehicle availability record deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting vehicle availability:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle record.',
    });
  }
});

export default router;
