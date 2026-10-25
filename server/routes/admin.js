import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Lead from '../models/Lead.js';
import AdminUser, { hashPassword, verifyPassword } from '../models/AdminUser.js';
import TransporterVerification from '../models/TransporterVerification.js';
import User from '../models/User.js';
import VehicleAvailability from '../models/VehicleAvailability.js';
import Notification from '../models/Notification.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Allowed pilot statuses
const ALLOWED_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'CONTACTED', 'ACCEPTED', 'REJECTED'];

const DEFAULT_DEV_ADMIN_SECRET = 'routewise-default-development-admin-secret-2026';

// Helper to sign tokens securely without extra dependencies
function getSecret() {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL SECURITY ERROR: ADMIN_TOKEN_SECRET must be defined in production. Refusing to run with insecure default secret.'
      );
    }
    return DEFAULT_DEV_ADMIN_SECRET;
  }
  if (process.env.NODE_ENV === 'production' && secret === DEFAULT_DEV_ADMIN_SECRET) {
    throw new Error(
      'FATAL SECURITY ERROR: ADMIN_TOKEN_SECRET cannot be the development default string in production mode.'
    );
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'FATAL SECURITY ERROR: ADMIN_TOKEN_SECRET must have at least 32 characters in production for cryptographic security.'
    );
  }
  return secret;
}

function generateAdminToken(adminData) {
  const secret = getSecret();
  const username = typeof adminData === 'string' ? adminData : adminData.username;
  const role = typeof adminData === 'object' && adminData.role ? adminData.role : 'ADMIN';
  const name = typeof adminData === 'object' && adminData.name ? adminData.name : username;

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      name,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const secret = getSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  // Timing safe comparison to protect against timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

// In-memory rate limiting for admin login (max 8 attempts per 10 minutes)
const loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const record = loginAttempts.get(ip);

  if (!record || now - record.startTime > windowMs) {
    loginAttempts.set(ip, { count: 1, startTime: now });
    return true;
  }

  if (record.count >= 8) {
    return false;
  }

  record.count += 1;
  return true;
}

// Admin Authentication Middleware
export const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token required.',
    });
  }

  const token = authHeader.split(' ')[1];
  const adminPayload = verifyAdminToken(token);

  if (!adminPayload) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin token.',
    });
  }

  const role = (adminPayload.role || '').toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrator privileges required.',
    });
  }

  req.admin = adminPayload;
  next();
};

/**
 * POST /api/admin/auth/login
 * Admin Login Endpoint
 */
/**
 * POST /api/admin/auth/login
 * Admin Login Endpoint (Authenticates against MongoDB AdminUser collection with env bootstrap fallback)
 */
router.post('/auth/login', authRateLimiter, async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please wait 10 minutes before trying again.',
      });
    }

    const { username, password } = req.body || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Both username and password are required.',
      });
    }

    const cleanUser = username.trim().toLowerCase();
    const expectedEnvUser = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const expectedEnvPass = process.env.ADMIN_PASSWORD || 'routewise-admin-2026';

    let authenticatedAdmin = null;

    // 1. Check MongoDB AdminUser collection
    const dbAdmin = await AdminUser.findOne({ username: cleanUser });

    if (dbAdmin) {
      if (!dbAdmin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This administrator account has been deactivated. Please contact Super Admin.',
        });
      }

      if (verifyPassword(password, dbAdmin.passwordHash)) {
        authenticatedAdmin = dbAdmin;
        dbAdmin.lastLoginAt = new Date();
        await dbAdmin.save();
      }
    } else if (cleanUser === expectedEnvUser) {
      // In production, prevent fallback authentication with default static password
      if (process.env.NODE_ENV === 'production' && expectedEnvPass === 'routewise-admin-2026') {
        return res.status(401).json({
          success: false,
          message: 'Default admin credentials are not allowed in production. Please set ADMIN_PASSWORD in environment.',
        });
      }

      // 2. Bootstrap check from .env credentials
      const passBuffer = Buffer.from(password);
      const expectedBuffer = Buffer.from(expectedEnvPass);
      if (passBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(passBuffer, expectedBuffer)) {
        // Automatically persist root super-admin into MongoDB for future management
        try {
          authenticatedAdmin = await AdminUser.create({
            username: expectedEnvUser,
            name: 'Root Administrator',
            passwordHash: hashPassword(expectedEnvPass),
            role: 'SUPER_ADMIN',
            createdBy: 'system',
            isActive: true,
            lastLoginAt: new Date(),
          });
        } catch {
          // If already exists concurrently, load it
          authenticatedAdmin = await AdminUser.findOne({ username: expectedEnvUser });
        }
      }
    }

    if (!authenticatedAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    // Reset rate limiter on successful authentication
    loginAttempts.delete(clientIp);

    const token = generateAdminToken({
      username: authenticatedAdmin.username,
      name: authenticatedAdmin.name,
      role: authenticatedAdmin.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: authenticatedAdmin.toSafeObject(),
    });
  } catch (err) {
    console.error('Admin login error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal error during authentication.',
    });
  }
});

/**
 * GET /api/admin/auth/me
 * Validate current session
 */
router.get('/auth/me', requireAdminAuth, async (req, res) => {
  try {
    const admin = await AdminUser.findOne({ username: req.admin.sub });
    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated.',
        });
      }
      return res.status(200).json({
        success: true,
        user: admin.toSafeObject(),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        username: req.admin.sub,
        name: req.admin.name || req.admin.sub,
        role: req.admin.role,
        isActive: true,
      },
    });
  } catch (err) {
    console.error('Error fetching admin profile:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
});

/**
 * GET /api/admin/users
 * List all administrator accounts
 */
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const users = await AdminUser.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: users.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    console.error('Error fetching admin users:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin accounts.',
    });
  }
});

/**
 * POST /api/admin/users
 * Add a new administrator account
 */
router.post('/users', requireAdminAuth, async (req, res) => {
  try {
    const { username, password, name, role } = req.body || {};

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanRole = (role || 'ADMIN').toUpperCase();

    const errors = {};
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Full name is required (at least 2 characters)';
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
      errors.username = 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(cleanRole)) {
      errors.role = 'Role must be either ADMIN or SUPER_ADMIN';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for new administrator.',
        errors,
      });
    }

    // Check uniqueness
    const existing = await AdminUser.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Username '${cleanUsername}' is already taken. Please choose another.`,
      });
    }

    const newAdmin = await AdminUser.create({
      username: cleanUsername,
      name: cleanName,
      passwordHash: hashPassword(password),
      role: cleanRole,
      createdBy: req.admin.sub,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: `Administrator '${cleanName}' created successfully.`,
      data: newAdmin.toSafeObject(),
    });
  } catch (err) {
    console.error('Error creating admin user:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create administrator account.',
    });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Toggle administrator active status
 */
router.patch('/users/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean flag is required.',
      });
    }

    const targetUser = await AdminUser.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Administrator account not found.',
      });
    }

    // Prevent deactivating own account
    if (targetUser.username === req.admin.sub && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `Account status updated to ${isActive ? 'Active' : 'Suspended'}.`,
      data: targetUser.toSafeObject(),
    });
  } catch (err) {
    console.error('Error updating admin status:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update administrator status.',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete an administrator account
 */
router.delete('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await AdminUser.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Administrator account not found.',
      });
    }

    // Prevent deleting own account
    if (targetUser.username === req.admin.sub) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.',
      });
    }

    await AdminUser.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Administrator '${targetUser.name}' was removed.`,
    });
  } catch (err) {
    console.error('Error deleting admin user:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete administrator.',
    });
  }
});

/**
 * GET /api/admin/stats
 * Aggregate real summary metrics from MongoDB Atlas
 */
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const [
      totalRegistrations,
      shippersCount,
      transportersCount,
      submittedCount,
      underReviewCount,
      contactedCount,
      acceptedCount,
      rejectedCount,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ role: 'SHIPPER' }),
      Lead.countDocuments({ role: 'TRANSPORTER' }),
      Lead.countDocuments({ status: 'SUBMITTED' }),
      Lead.countDocuments({ status: 'UNDER_REVIEW' }),
      Lead.countDocuments({ status: 'CONTACTED' }),
      Lead.countDocuments({ status: 'ACCEPTED' }),
      Lead.countDocuments({ status: 'REJECTED' }),
    ]);

    // Registrations in the last 24 hours
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hCount = await Lead.countDocuments({ createdAt: { $gte: past24Hours } });

    return res.status(200).json({
      success: true,
      stats: {
        totalRegistrations,
        shippersCount,
        transportersCount,
        recent24hCount,
        byStatus: {
          SUBMITTED: submittedCount,
          UNDER_REVIEW: underReviewCount,
          CONTACTED: contactedCount,
          ACCEPTED: acceptedCount,
          REJECTED: rejectedCount,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration statistics.',
    });
  }
});

/**
 * GET /api/admin/registrations
 * Filtered, paginated registration leads
 */
router.get('/registrations', requireAdminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { role, status, search } = req.query;

    const query = {};

    // Filter by Role
    if (role && role !== 'ALL') {
      const upperRole = String(role).toUpperCase();
      if (['SHIPPER', 'TRANSPORTER'].includes(upperRole)) {
        query.role = upperRole;
      }
    }

    // Filter by Status
    if (status && status !== 'ALL') {
      const upperStatus = String(status).toUpperCase();
      if (ALLOWED_STATUSES.includes(upperStatus)) {
        query.status = upperStatus;
      }
    }

    // Filter by Text Search
    if (search && typeof search === 'string' && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [
        { contactName: regex },
        { businessName: regex },
        { fleetName: regex },
        { primaryRoute: regex },
        { operatingRoutes: regex },
        { phone: regex },
        { email: regex },
      ];
    }

    const [totalCount, leads] = await Promise.all([
      Lead.countDocuments(query),
      Lead.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: leads.map((lead) => lead.toAdminObject()),
    });
  } catch (err) {
    console.error('Error listing registrations:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to query registrations.',
    });
  }
});

/**
 * GET /api/admin/registrations/:id
 * Retrieve full single registration details
 */
router.get('/registrations/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration record ID format.',
      });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: lead.toAdminObject(),
    });
  } catch (err) {
    console.error('Error fetching registration detail:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration details.',
    });
  }
});

/**
 * PATCH /api/admin/registrations/:id/status
 * Update registration pilot status and admin review notes
 */
router.patch('/registrations/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration record ID format.',
      });
    }

    const { status, adminNotes } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required.',
      });
    }

    const upperStatus = String(status).toUpperCase();
    if (!ALLOWED_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const updateFields = { status: upperStatus };
    if (typeof adminNotes === 'string') {
      if (adminNotes.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Admin notes cannot exceed 1000 characters.',
        });
      }
      updateFields.adminNotes = adminNotes.trim();
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, updateFields, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!updatedLead) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Registration status updated to ${upperStatus}.`,
      data: updatedLead.toAdminObject(),
    });
  } catch (err) {
    console.error('Error updating status:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update registration status.',
    });
  }
});

/**
 * =========================================================================
 * PHASE 6: ADMIN TRANSPORTER VERIFICATION WORKFLOW & AUDIT TRAIL
 * =========================================================================
 */

/**
 * GET /api/admin/verifications
 * Paginated list of transporter verification submissions with status filtering
 */
router.get('/verifications', requireAdminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const [total, submissions] = await Promise.all([
      TransporterVerification.countDocuments(filter),
      TransporterVerification.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Status counts summary for admin overview
    const statusCounts = await TransporterVerification.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const summary = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      CORRECTION_REQUIRED: 0,
    };
    statusCounts.forEach((s) => {
      if (s._id && summary[s._id] !== undefined) {
        summary[s._id] = s.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        submissions: submissions.map((sub) => ({
          id: sub._id,
          transporterId: sub.transporterId,
          businessName: sub.businessName,
          contactName: sub.contactName,
          contactPhone: sub.contactPhone,
          contactEmail: sub.contactEmail,
          operatingCorridor: sub.operatingCorridor,
          vehicleId: sub.vehicleId,
          status: sub.status,
          documentsCount: (sub.documents || []).length,
          documents: (sub.documents || []).map((d) => ({
            id: d._id,
            documentType: d.documentType,
            originalName: d.originalName,
            mimeType: d.mimeType,
            fileSizeFormatted: `${(d.fileSize / 1024).toFixed(1)} KB`,
            uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString() : null,
            status: d.status,
            accessUrl: `/api/verification/documents/${d._id}`,
          })),
          submissionNotes: sub.submissionNotes,
          reviewedAt: sub.reviewedAt ? sub.reviewedAt.toISOString() : null,
          reviewerNotes: sub.reviewerNotes,
          correctionReason: sub.correctionReason,
          auditLogCount: (sub.auditLog || []).length,
          createdAt: sub.createdAt ? sub.createdAt.toISOString() : null,
          updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
        summary,
      },
    });
  } catch (err) {
    console.error('Error fetching admin verifications:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification submissions.',
    });
  }
});

/**
 * GET /api/admin/verifications/:id
 * Detailed view of a single transporter verification submission
 */
router.get('/verifications/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification ID format.',
      });
    }

    const verification = await TransporterVerification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification submission not found.',
      });
    }

    let vehicleDetails = null;
    if (verification.vehicleId) {
      const v = await VehicleAvailability.findById(verification.vehicleId);
      if (v) vehicleDetails = v.toSafeObject();
    }

    return res.status(200).json({
      success: true,
      data: {
        ...verification.toSafeObject(true),
        vehicle: vehicleDetails,
      },
    });
  } catch (err) {
    console.error('Error retrieving verification details:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification details.',
    });
  }
});

/**
 * PATCH /api/admin/verifications/:id/review
 * Review action: Approve, Reject, or Request Corrections with reasons
 */
router.patch('/verifications/:id/review', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification ID format.',
      });
    }

    const verification = await TransporterVerification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification submission not found.',
      });
    }

    const { status, notes, reason } = req.body || {};
    const upperStatus = status ? String(status).toUpperCase() : '';

    const ALLOWED_REVIEW_STATUSES = ['APPROVED', 'REJECTED', 'CORRECTION_REQUIRED', 'UNDER_REVIEW'];
    if (!ALLOWED_REVIEW_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid review status. Allowed values: ${ALLOWED_REVIEW_STATUSES.join(', ')}`,
      });
    }

    if (upperStatus === 'CORRECTION_REQUIRED' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A specific correction reason is required when requesting corrections.',
      });
    }

    if (upperStatus === 'REJECTED' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required when rejecting a verification submission.',
      });
    }

    const adminUsername = req.admin.name || req.admin.sub || 'Administrator';
    const previousStatus = verification.status;

    verification.status = upperStatus;
    verification.reviewerId = req.admin.id || null;
    verification.reviewerUsername = adminUsername;
    verification.reviewedAt = new Date();
    if (notes) verification.reviewerNotes = notes.trim();
    if (reason) verification.correctionReason = reason.trim();

    // Mark documents verified if approved
    if (upperStatus === 'APPROVED') {
      verification.documents.forEach((d) => {
        d.status = 'VERIFIED';
      });
    }

    verification.auditLog.push({
      action: `STATUS_CHANGE_TO_${upperStatus}`,
      performedBy: adminUsername,
      performedByRole: 'ADMIN',
      timestamp: new Date(),
      notes: notes || reason || `Status updated from ${previousStatus} to ${upperStatus}`,
    });

    await verification.save();

    // Synchronize User verificationStatus
    await User.findByIdAndUpdate(verification.transporterId, {
      verificationStatus: upperStatus,
      verificationNotes: notes || reason || `Status: ${upperStatus}`,
    });

    // Synchronize Vehicle verificationStatus if attached
    if (verification.vehicleId) {
      await VehicleAvailability.findByIdAndUpdate(verification.vehicleId, {
        verificationStatus: upperStatus,
      });
    }

    // Trigger in-app notification to the transporter
    let notifType = 'SYSTEM_NOTICE';
    let notifTitle = 'Verification Update';
    let notifMsg = `Your business verification status is now ${upperStatus}.`;

    if (upperStatus === 'APPROVED') {
      notifType = 'VERIFICATION_APPROVED';
      notifTitle = 'Transporter Verification Approved 🎉';
      notifMsg = 'Congratulations! Your transporter business and fleet documentation have been verified by RouteWise operations.';
    } else if (upperStatus === 'REJECTED') {
      notifType = 'VERIFICATION_REJECTED';
      notifTitle = 'Verification Submission Rejected';
      notifMsg = `Your verification submission was rejected: ${reason || notes || 'Please contact RouteWise support for details.'}`;
    } else if (upperStatus === 'CORRECTION_REQUIRED') {
      notifType = 'VERIFICATION_CORRECTION';
      notifTitle = 'Verification Corrections Required ⚠️';
      notifMsg = `Action required on your verification documents: ${reason || 'Please upload updated documents as requested.'}`;
    }

    await Notification.sendNotification({
      recipientId: verification.transporterId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      verificationId: verification._id,
      metadata: {
        action: 'VERIFICATION_REVIEW',
        status: upperStatus,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Transporter verification status updated to ${upperStatus}.`,
      data: verification.toSafeObject(true),
    });
  } catch (err) {
    console.error('Error reviewing verification:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record verification review decision.',
    });
  }
});

export default router;

