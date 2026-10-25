import express from 'express';
import User from '../models/User.js';
import { generateToken, hashPassword, verifyPassword, requireAuth } from '../utils/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new Shipper or Transporter account
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, businessName, email, phone, password, role = 'SHIPPER', operatingCorridor } =
      req.body || {};

    const cleanName = (name || '').trim();
    const cleanBusiness = (businessName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanRole = (role || 'SHIPPER').toUpperCase();

    const errors = {};
    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Full contact name is required (minimum 2 characters)';
    }
    if (!cleanBusiness || cleanBusiness.length < 2) {
      errors.businessName = 'Business or trading name is required';
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'A valid email address is required';
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      errors.phone = 'Phone number must be 10-11 digits';
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!['SHIPPER', 'TRANSPORTER'].includes(cleanRole)) {
      errors.role = 'Role must be either SHIPPER or TRANSPORTER';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for registration.',
        errors,
      });
    }

    // Check if email already registered
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    const newUser = await User.create({
      role: cleanRole,
      name: cleanName,
      businessName: cleanBusiness,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: hashPassword(password),
      operatingCorridor: operatingCorridor ? operatingCorridor.trim() : 'Gorakhpur to Lucknow (NH27 Corridor)',
      isActive: true,
    });

    const tokenPayload = {
      sub: newUser._id.toString(),
      role: newUser.role,
      name: newUser.name,
      businessName: newUser.businessName,
      email: newUser.email,
      phone: newUser.phone,
    };

    const token = generateToken(tokenPayload);

    return res.status(201).json({
      success: true,
      message: `${cleanRole === 'SHIPPER' ? 'Shipper' : 'Transporter'} account created successfully.`,
      token,
      user: newUser.toSafeObject(),
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration.',
    });
  }
});

/**
 * POST /api/auth/login
 * Sign in as Shipper or Transporter
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokenPayload = {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
});

/**
 * GET /api/auth/me
 * Validate current session and get profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(200).json({
        success: true,
        user: {
          id: req.user.sub,
          name: req.user.name,
          businessName: req.user.businessName,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
        },
      });
    }
    return res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Session validation error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
});

/**
 * POST /api/auth/demo-shipper
 * Rapid demo authentication helper for testing and evaluation (Disabled in production)
 */
router.post('/demo-shipper', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_AUTH !== 'true') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Demo authentication is disabled in production environments.',
    });
  }
  try {
    await User.bootstrapDemoUsers();
    const demoIndex = req.body?.index === 2 ? 2 : 1;
    const targetEmail = demoIndex === 2 ? 'shipper2@routewise.in' : 'shipper@routewise.in';

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      await User.bootstrapDemoUsers();
      user = await User.findOne({ email: targetEmail });
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Demo shipper account unavailable.',
      });
    }

    const tokenPayload = {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: `Signed in as Demo Shipper ${demoIndex}: ${user.businessName}`,
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Demo auth error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate demo shipper.',
    });
  }
});

/**
 * POST /api/auth/demo-transporter
 * Rapid demo authentication helper for transporters (Disabled in production)
 */
router.post('/demo-transporter', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_AUTH !== 'true') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Demo authentication is disabled in production environments.',
    });
  }
  try {
    await User.bootstrapDemoUsers();
    const demoIndex = req.body?.index === 2 ? 2 : 1;
    const targetEmail = demoIndex === 2 ? 'transporter2@routewise.in' : 'transporter@routewise.in';

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      await User.bootstrapDemoUsers();
      user = await User.findOne({ email: targetEmail });
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Demo transporter account unavailable.',
      });
    }

    const tokenPayload = {
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: `Signed in as Demo Transporter ${demoIndex}: ${user.businessName}`,
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Demo auth error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate demo transporter.',
    });
  }
});

export default router;
