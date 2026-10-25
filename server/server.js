import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';

import pilotRouter from './routes/pilot.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import listingsRouter from './routes/listings.js';
import vehiclesRouter from './routes/vehicles.js';
import interestsRouter from './routes/interests.js';
import bookingsRouter from './routes/bookings.js';
import notificationsRouter from './routes/notifications.js';
import verificationRouter from './routes/verification.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if present
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = isProduction
  ? configuredOrigins.length > 0
    ? configuredOrigins
    : devOrigins
  : [...configuredOrigins, ...devOrigins];

// Restrict CORS to configured frontend client origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from unauthorized origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Basic request-size protection against payload DOS attacks
app.use(express.json({ limit: '50kb' }));

// Apply general API rate limiting across all endpoints
app.use('/api', generalApiLimiter);

// Lightweight Liveness Probe for Load Balancers & Ingress
app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'live',
    service: 'routewise-api',
    timestamp: new Date().toISOString(),
  });
});

// Comprehensive Readiness & Deep Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  const healthData = {
    status: isDbConnected ? 'healthy' : 'unhealthy',
    service: 'routewise-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDbConnected,
      readyState: dbState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown',
    },
    memoryUsageMB: {
      rss: (process.memoryUsage().rss / (1024 * 1024)).toFixed(2),
      heapUsed: (process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2),
    },
  };

  if (!isDbConnected) {
    return res.status(503).json(healthData);
  }
  return res.status(200).json(healthData);
});

// User & Shipper Authentication API Routes
app.use('/api/auth', authRouter);

// Freight Listings Marketplace API Routes
app.use('/api/listings', listingsRouter);

// Transporter Vehicle Availability API Routes
app.use('/api/vehicles', vehiclesRouter);

// Transporter Load Interest & Shipper Review API Routes
app.use('/api/interests', interestsRouter);

// Confirmed Bookings Lifecycle & Double-Booking Prevention API Routes
app.use('/api/bookings', bookingsRouter);

// Persistent In-App Notifications API Routes
app.use('/api/notifications', notificationsRouter);

// Transporter Document & Identity Verification API Routes
app.use('/api/verification', verificationRouter);

// Pilot Registration API Routes
app.use('/api/pilot', pilotRouter);

// Admin Operations Dashboard API Routes
app.use('/api/admin', adminRouter);

// Safe error handling middleware for JSON parsing and payload size limits
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload is too large. Maximum allowed size is 50kb.',
    });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload in request body.',
    });
  }
  console.error('Unhandled server error:', err.message);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred.',
  });
});

const DEFAULT_PORT = 5050;
const FALLBACK_PORT = 5055;
const requestedPort = Number(process.env.PORT) || DEFAULT_PORT;

function startServer(port, allowFallback = true) {
  const server = app
    .listen(port, () => {
      console.log(`RouteWise API health server listening on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(
          `Port ${port} is in use (on macOS, port 5000 is typically reserved by AirPlay/ControlCenter).`
        );
        if (allowFallback && !process.env.PORT && port === DEFAULT_PORT) {
          console.log(`Attempting fallback to port ${FALLBACK_PORT}...`);
          startServer(FALLBACK_PORT, false);
          return;
        }
        console.error(`Please configure an available PORT in server/.env (e.g. PORT=${FALLBACK_PORT}).`);
      } else {
        console.error('Failed to start server:', err);
      }
      process.exit(1);
    });

  return server;
}
const startApp = async () => {
  const server = startServer(requestedPort);

  const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });

    // Force close if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forceful shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  try {
    await connectDB();
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_ACCOUNTS === 'true') {
      await User.bootstrapDemoShippers();
    } else {
      console.log('Production mode active: demo accounts bootstrapping skipped.');
    }
  } catch (error) {
    console.error('MongoDB connection warning:', error.message);
    if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers')) {
      console.warn('NOTE: Make sure your current IP address is whitelisted in MongoDB Atlas Network Access.');
    }
  }
};

startApp();

export default app;
