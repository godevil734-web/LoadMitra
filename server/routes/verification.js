import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import TransporterVerification, { DOCUMENT_TYPES } from '../models/TransporterVerification.js';
import User from '../models/User.js';
import VehicleAvailability from '../models/VehicleAvailability.js';
import { requireAuth, requireTransporterAuth } from '../utils/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import {
  uploadMiddleware,
  validateFileMetadata,
  savePrivateFile,
  getPrivateFilePath,
} from '../services/storage.js';

const router = express.Router();

/**
 * POST /api/verification/submit
 * Authenticated Transporter: Submit business and/or vehicle documents for verification
 */
router.post('/submit', requireTransporterAuth, uploadRateLimiter, uploadMiddleware.array('documents', 5), async (req, res) => {
  try {
    const transporterId = req.user.sub;
    const user = await User.findById(transporterId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Transporter account not found.',
      });
    }

    const {
      documentType,
      documentNumber,
      vehicleId,
      submissionNotes,
    } = req.body || {};

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one document file is required for verification submission.',
      });
    }

    // Validate all files
    for (const file of files) {
      const validation = validateFileMetadata(file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    // Validate document type
    const docType = documentType && DOCUMENT_TYPES.includes(documentType) ? documentType : 'BUSINESS_REGISTRATION';

    // Validate vehicleId if provided
    let vehicle = null;
    if (vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle ID format.',
        });
      }
      vehicle = await VehicleAvailability.findOne({
        _id: vehicleId,
        transporterId,
      });
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle availability record not found or does not belong to your account.',
        });
      }
    }

    // Save uploaded files to secure private storage
    const savedDocs = [];
    for (const file of files) {
      const saved = await savePrivateFile({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        category: 'verification',
      });

      savedDocs.push({
        documentType: docType,
        documentNumber: documentNumber ? String(documentNumber).trim() : '',
        originalName: saved.originalName,
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        uploadedAt: new Date(),
        status: 'PENDING',
      });
    }

    // Find existing verification or create new
    let verification = await TransporterVerification.findOne({ transporterId });

    if (verification) {
      // Append documents and update status to PENDING
      const isResubmission = ['REJECTED', 'CORRECTION_REQUIRED'].includes(verification.status);
      verification.status = 'PENDING';
      verification.documents.push(...savedDocs);
      if (vehicleId) verification.vehicleId = vehicleId;
      if (submissionNotes) verification.submissionNotes = submissionNotes.trim();

      verification.auditLog.push({
        action: isResubmission ? 'RESUBMISSION' : 'DOCUMENT_UPLOAD',
        performedBy: user.name || user.businessName,
        performedByRole: 'TRANSPORTER',
        timestamp: new Date(),
        notes: isResubmission
          ? `Resubmitted verification documents after correction request: ${savedDocs.length} file(s) attached.`
          : `Uploaded ${savedDocs.length} verification file(s).`,
      });

      await verification.save();
    } else {
      verification = await TransporterVerification.create({
        transporterId,
        businessName: user.businessName,
        contactName: user.name,
        contactPhone: user.phone,
        contactEmail: user.email,
        operatingCorridor: user.operatingCorridor || '',
        vehicleId: vehicleId || null,
        status: 'PENDING',
        documents: savedDocs,
        submissionNotes: submissionNotes ? submissionNotes.trim() : '',
        auditLog: [
          {
            action: 'INITIAL_SUBMISSION',
            performedBy: user.name || user.businessName,
            performedByRole: 'TRANSPORTER',
            timestamp: new Date(),
            notes: `Submitted ${savedDocs.length} verification document(s) for initial review.`,
          },
        ],
      });
    }

    // Update user verification status to PENDING
    await User.findByIdAndUpdate(transporterId, {
      verificationStatus: 'PENDING',
      verificationNotes: 'Verification submission received, under operational review.',
    });

    if (vehicle) {
      await VehicleAvailability.findByIdAndUpdate(vehicle._id, {
        verificationStatus: 'PENDING',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Verification documents submitted successfully. Status is now PENDING review.',
      data: verification.toSafeObject(true),
    });
  } catch (err) {
    console.error('Error submitting verification documents:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit verification documents.',
    });
  }
});

/**
 * GET /api/verification/status
 * Authenticated Transporter: Get current verification status and details
 */
router.get('/status', requireTransporterAuth, async (req, res) => {
  try {
    const transporterId = req.user.sub;
    const verification = await TransporterVerification.findOne({ transporterId });

    if (!verification) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'NOT_SUBMITTED',
          documentsCount: 0,
          documents: [],
          submissionNotes: '',
          reviewerNotes: '',
          correctionReason: '',
          auditLog: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: verification.toSafeObject(true),
    });
  } catch (err) {
    console.error('Error fetching verification status:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification status.',
    });
  }
});

/**
 * GET /api/verification/documents/:documentId
 * Protected download endpoint for verification documents.
 * Authorized ONLY for:
 * 1. Admin users (with valid admin token)
 * 2. Owning transporter of this verification submission
 * Cross-user access is strictly forbidden with 403.
 */
router.get('/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format.',
      });
    }

    const verification = await TransporterVerification.findOne({
      'documents._id': documentId,
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification document not found.',
      });
    }

    const doc = verification.documents.id(documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found in submission.',
      });
    }

    // Role check: Only admin OR the owning transporter can access
    const isOwner = verification.transporterId.toString() === req.user.sub;
    const isAdmin =
      req.user.role === 'admin' ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to access this private verification document.',
      });
    }

    const filePath = getPrivateFilePath(doc.storageKey, 'verification');
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Stored document file not found on server.',
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
      console.error('Stream error reading private document:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to read document file.' });
      }
    });

    return stream.pipe(res);
  } catch (err) {
    console.error('Error serving verification document:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document.',
    });
  }
});

export default router;
