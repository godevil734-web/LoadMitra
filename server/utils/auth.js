import crypto from 'crypto';

const DEFAULT_DEV_SECRET = 'routewise-secure-token-secret-jwt-key-2026';

export const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL SECURITY ERROR: JWT_SECRET must be defined in production. Refusing to run with insecure default secret.'
      );
    }
    return DEFAULT_DEV_SECRET;
  }
  if (process.env.NODE_ENV === 'production' && secret === DEFAULT_DEV_SECRET) {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET cannot be the development default string in production mode.'
    );
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET must have at least 32 characters in production for cryptographic security.'
    );
  }
  return secret;
};

/**
 * Generate standard HMAC-SHA256 JWT Token
 */
export function generateToken(payload, expiresInSeconds = 24 * 60 * 60) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const fullPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: now,
      exp,
    })
  ).toString('base64url');

  const secret = getSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${fullPayload}`)
    .digest('base64url');

  return `${header}.${fullPayload}.${signature}`;
}

/**
 * Verify and decode HMAC-SHA256 JWT Token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const secret = getSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

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

/**
 * Hash password with PBKDF2 (100,000 iterations, 64-byte key)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash
 */
export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, originalHash] = stored.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const hashBuf = Buffer.from(hash, 'hex');
  const origBuf = Buffer.from(originalHash, 'hex');
  if (hashBuf.length !== origBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, origBuf);
}

/**
 * Express Middleware: Require valid JWT token
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication token is required.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired authentication token.',
    });
  }

  req.user = decoded;
  next();
}

/**
 * Express Middleware: Require Shipper role (or Super Admin/Admin)
 */
export function requireShipperAuth(req, res, next) {
  requireAuth(req, res, () => {
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SHIPPER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Only verified shippers or administrators can perform this action.',
    });
  });
}

/**
 * Express Middleware: Require Transporter role (or Super Admin/Admin)
 */
export function requireTransporterAuth(req, res, next) {
  requireAuth(req, res, () => {
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'TRANSPORTER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Only verified transporters or administrators can perform this action.',
    });
  });
}
