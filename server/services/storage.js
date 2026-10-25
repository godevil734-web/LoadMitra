import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base private storage root (strictly outside public web root and never served via express.static)
export const STORAGE_BASE_DIR = process.env.STORAGE_PATH
  ? path.resolve(process.env.STORAGE_PATH)
  : path.resolve(__dirname, '../storage');
export const VERIFICATION_DOCS_DIR = path.join(STORAGE_BASE_DIR, 'verification_documents');
export const DELIVERY_PROOFS_DIR = path.join(STORAGE_BASE_DIR, 'delivery_proofs');

// Ensure storage directories exist
[STORAGE_BASE_DIR, VERIFICATION_DOCS_DIR, DELIVERY_PROOFS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

/**
 * Validate file metadata and contents against security rules
 */
export function validateFileMetadata(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 5 MB (size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, PDF.`,
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Allowed extensions: .jpg, .jpeg, .png, .webp, .pdf.`,
    };
  }

  return { valid: true };
}

/**
 * Generate a cryptographically random, collision-safe storage key
 */
export function generateStorageKey(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const randomUuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${timestamp}_${randomUuid}${ext}`;
}

/**
 * Save buffer to secure private disk storage
 */
export async function savePrivateFile({ buffer, originalName, mimeType, category = 'verification' }) {
  const targetDir = category === 'delivery_proof' ? DELIVERY_PROOFS_DIR : VERIFICATION_DOCS_DIR;
  const storageKey = generateStorageKey(originalName);
  const targetPath = path.join(targetDir, storageKey);

  await fs.promises.writeFile(targetPath, buffer);

  return {
    storageKey,
    originalName: path.basename(originalName).replace(/[^\w.-]/g, '_'),
    mimeType,
    fileSize: buffer.length,
    category,
    savedAt: new Date(),
  };
}

/**
 * Retrieve absolute path to private file with path traversal protection
 */
export function getPrivateFilePath(storageKey, category = 'verification') {
  if (!storageKey || typeof storageKey !== 'string') return null;

  // Prevent path traversal
  const safeKey = path.basename(storageKey);
  const targetDir = category === 'delivery_proof' ? DELIVERY_PROOFS_DIR : VERIFICATION_DOCS_DIR;
  const fullPath = path.join(targetDir, safeKey);

  if (!fs.existsSync(fullPath)) {
    // Check fallback category if file exists
    const fallbackDir = category === 'delivery_proof' ? VERIFICATION_DOCS_DIR : DELIVERY_PROOFS_DIR;
    const fallbackPath = path.join(fallbackDir, safeKey);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
    return null;
  }

  return fullPath;
}

/**
 * Delete a private file
 */
export async function deletePrivateFile(storageKey, category = 'verification') {
  const filePath = getPrivateFilePath(storageKey, category);
  if (filePath && fs.existsSync(filePath)) {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Multer memory storage configuration for file uploads
 */
const multerStorage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: multerStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Up to 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      const err = new Error(`File upload rejected: Only JPEG, PNG, WEBP and PDF documents are allowed.`);
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  },
});
