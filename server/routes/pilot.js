import express from 'express';
import mongoose from 'mongoose';
import Lead, { CARGO_TYPES, VEHICLE_TYPES, SHIPMENT_FREQUENCIES } from '../models/Lead.js';

const router = express.Router();

// Helper phone validator: 10-11 digits
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

// Helper email validator
function isValidEmail(email) {
  if (!email) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * POST /api/pilot/shipper-registration (also aliased to /api/pilot/shipper)
 * Register early access lead for a Shipper
 */
const handleShipperRegistration = async (req, res) => {
  try {
    const {
      contactName,
      name, // fallback if client sends name
      businessName,
      phone,
      email,
      primaryRoute,
      cargoCategory,
      shipmentFrequency,
      consentGranted,
      consent, // fallback if client sends consent
    } = req.body || {};

    const resolvedContactName = (contactName || name || '').trim();
    const resolvedBusinessName = (businessName || '').trim();
    const resolvedPhone = (phone || '').trim();
    const resolvedEmail = (email || '').trim() || null;
    const resolvedRoute = (primaryRoute || '').trim();
    const resolvedConsent = consentGranted === true || consent === true;

    const errors = {};

    if (!resolvedContactName) {
      errors.contactName = 'Contact name is required';
    } else if (resolvedContactName.length > 100) {
      errors.contactName = 'Contact name cannot exceed 100 characters';
    }

    if (!resolvedBusinessName) {
      errors.businessName = 'Business or trading name is required';
    } else if (resolvedBusinessName.length > 150) {
      errors.businessName = 'Business name cannot exceed 150 characters';
    }

    if (!resolvedPhone) {
      errors.phone = 'Phone number is required for pilot coordination';
    } else if (!isValidPhone(resolvedPhone)) {
      errors.phone = 'Please provide a valid 10-11 digit phone number';
    }

    if (resolvedEmail && !isValidEmail(resolvedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!resolvedRoute) {
      errors.primaryRoute = 'Primary shipping corridor is required';
    } else if (resolvedRoute.length > 250) {
      errors.primaryRoute = 'Primary route description cannot exceed 250 characters';
    }

    if (!cargoCategory) {
      errors.cargoCategory = 'Cargo category is required';
    } else if (!CARGO_TYPES.includes(cargoCategory)) {
      errors.cargoCategory = `Invalid cargo category. Allowed values: ${CARGO_TYPES.join(', ')}`;
    }

    if (!shipmentFrequency) {
      errors.shipmentFrequency = 'Shipment frequency is required';
    } else if (!SHIPMENT_FREQUENCIES.includes(shipmentFrequency)) {
      errors.shipmentFrequency = `Invalid shipment frequency. Allowed values: ${SHIPMENT_FREQUENCIES.join(', ')}`;
    }

    if (!resolvedConsent) {
      errors.consent = 'Consent must be granted to participate in the pilot';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed on submitted shipper registration',
        errors,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable or connecting. Please check Atlas Network Access / IP whitelist.',
      });
    }

    const lead = await Lead.create({
      role: 'SHIPPER',
      contactName: resolvedContactName,
      businessName: resolvedBusinessName,
      phone: resolvedPhone,
      email: resolvedEmail,
      primaryRoute: resolvedRoute,
      cargoCategory,
      shipmentFrequency,
      consentGranted: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Shipper pilot registration received and saved successfully.',
      data: lead.toSafeObject(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mongooseErrors = {};
      Object.keys(error.errors).forEach((key) => {
        mongooseErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: mongooseErrors,
      });
    }

    console.error('Error saving shipper registration:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process shipper registration. Please try again later.',
    });
  }
};

/**
 * POST /api/pilot/transporter-registration (also aliased to /api/pilot/transporter)
 * Register early access lead for a Transporter
 */
const handleTransporterRegistration = async (req, res) => {
  try {
    const {
      contactName,
      name, // fallback if client sends name
      fleetName,
      phone,
      email,
      vehicleType,
      operatingRoutes,
      availableCapacity,
      actualCapacity,
      capacityUnit = 'Tons',
      vehicleCategories = [],
      multiVehicleFleet = [],
      consentGranted,
      consent, // fallback if client sends consent
    } = req.body || {};

    const resolvedContactName = (contactName || name || '').trim();
    const resolvedFleetName = (fleetName || '').trim() || null;
    const resolvedPhone = (phone || '').trim();
    const resolvedEmail = (email || '').trim() || null;
    const resolvedRoutes = (operatingRoutes || '').trim();
    const resolvedActualCapacity =
      actualCapacity !== undefined && !isNaN(parseFloat(actualCapacity))
        ? parseFloat(actualCapacity)
        : null;
    const resolvedCapacity =
      (availableCapacity || '').trim() ||
      (resolvedActualCapacity !== null
        ? `${resolvedActualCapacity} ${capacityUnit} (Configured Capacity)`
        : null);
    const resolvedConsent = consentGranted === true || consent === true;

    const errors = {};

    if (!resolvedContactName) {
      errors.contactName = 'Contact name is required';
    } else if (resolvedContactName.length > 100) {
      errors.contactName = 'Contact name cannot exceed 100 characters';
    }

    if (!resolvedPhone) {
      errors.phone = 'Phone number is required for trip coordination';
    } else if (!isValidPhone(resolvedPhone)) {
      errors.phone = 'Please provide a valid 10-11 digit phone number';
    }

    if (resolvedEmail && !isValidEmail(resolvedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!vehicleType) {
      errors.vehicleType = 'Vehicle type is required';
    } else if (!VEHICLE_TYPES.includes(vehicleType)) {
      errors.vehicleType = `Invalid vehicle type. Allowed values: ${VEHICLE_TYPES.join(', ')}`;
    }

    if (!resolvedRoutes) {
      errors.operatingRoutes = 'Operating corridors/routes are required';
    } else if (resolvedRoutes.length > 250) {
      errors.operatingRoutes = 'Operating routes cannot exceed 250 characters';
    }

    if (resolvedCapacity && resolvedCapacity.length > 100) {
      errors.availableCapacity = 'Capacity description cannot exceed 100 characters';
    }

    if (!resolvedConsent) {
      errors.consent = 'Consent must be granted to participate in the pilot';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed on submitted transporter registration',
        errors,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unavailable or connecting. Please check Atlas Network Access / IP whitelist.',
      });
    }

    const lead = await Lead.create({
      role: 'TRANSPORTER',
      contactName: resolvedContactName,
      fleetName: resolvedFleetName,
      phone: resolvedPhone,
      email: resolvedEmail,
      vehicleType,
      operatingRoutes: resolvedRoutes,
      availableCapacity: resolvedCapacity,
      actualCapacity: resolvedActualCapacity,
      capacityUnit,
      vehicleCategories: Array.isArray(vehicleCategories) ? vehicleCategories : [vehicleType],
      multiVehicleFleet: Array.isArray(multiVehicleFleet) ? multiVehicleFleet : [],
      consentGranted: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Transporter pilot registration received and saved successfully.',
      data: lead.toSafeObject(),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mongooseErrors = {};
      Object.keys(error.errors).forEach((key) => {
        mongooseErrors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: mongooseErrors,
      });
    }

    console.error('Error saving transporter registration:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process transporter registration. Please try again later.',
    });
  }
};

// Route registrations (support both explicit and short naming)
router.post('/shipper-registration', handleShipperRegistration);
router.post('/shipper', handleShipperRegistration);

router.post('/transporter-registration', handleTransporterRegistration);
router.post('/transporter', handleTransporterRegistration);

/**
 * GET /api/pilot/registrations/:id
 * Safe retrieval of a registration by ID for verification (returns non-sensitive fields)
 */
router.get('/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID format',
      });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: lead.toSafeObject(),
    });
  } catch (error) {
    console.error('Error fetching registration:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve registration record',
    });
  }
});

export default router;
