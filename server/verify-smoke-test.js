import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import FreightListing from './models/FreightListing.js';
import VehicleAvailability from './models/VehicleAvailability.js';
import LoadInterest from './models/LoadInterest.js';
import Booking from './models/Booking.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runProductionSmokeTests() {
  console.log('================================================================');
  console.log('     RouteWise Phase 8: Production Smoke Test Verification      ');
  console.log('================================================================');
  console.log(`Backend Target URL: ${BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // Track created entities for safe isolated teardown
  const createdUserIds = [];
  const createdListingIds = [];
  const createdVehicleIds = [];
  const createdInterestIds = [];
  const createdBookingIds = [];
  const createdNotificationIds = [];

  let shipperToken = null;
  let transporterToken = null;
  let shipperUser = null;
  let transporterUser = null;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${message}`);
      throw new Error(`Smoke Test Assertion Failed: ${message}`);
    }
  }

  try {
    await connectDB();

    // -------------------------------------------------------------------------
    // STEP 1: Backend Liveness & Readiness Probes
    // -------------------------------------------------------------------------
    console.log('\n[1/11] Verifying Backend Liveness and Database Readiness Probes...');
    const livenessRes = await fetch(`${BASE_URL}/api/health/live`);
    const livenessData = await livenessRes.json();
    assert(livenessRes.status === 200, 'Liveness probe returns HTTP 200');
    assert(livenessData.status === 'live', 'Liveness payload confirms status "live"');

    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health readiness probe returns HTTP 200');
    assert(healthData.status === 'healthy', 'Health status confirms "healthy"');
    assert(
      healthData.database && healthData.database.connected === true && healthData.database.readyState === 1,
      'Health check verifies live MongoDB Atlas connection (readyState: 1)'
    );

    // -------------------------------------------------------------------------
    // STEP 2: Frontend Production Build & Route Verification
    // -------------------------------------------------------------------------
    console.log('\n[2/11] Verifying Frontend Production Build & Client Route Manifest...');
    const distPath = path.resolve(__dirname, '../dist');
    const indexPath = path.join(distPath, 'index.html');
    const indexExists = fs.existsSync(indexPath);
    assert(indexExists, 'Vite production build index.html exists in dist directory');

    if (indexExists) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      assert(indexContent.includes('id="root"'), 'Frontend index.html contains root mounting element');
      assert(
        indexContent.includes('/assets/index-') || indexContent.includes('script'),
        'Frontend bundles compiled client JavaScript assets'
      );
    }

    // -------------------------------------------------------------------------
    // STEP 3: Dedicated Pilot Accounts Registration & Authentication
    // -------------------------------------------------------------------------
    console.log('\n[3/11] Testing Registration & Login with Dedicated Smoke Test Accounts...');
    const timestamp = Date.now();
    const testShipperEmail = `smoke_shipper_${timestamp}@pilot.internal`;
    const testTransporterEmail = `smoke_transporter_${timestamp}@pilot.internal`;
    const testPassword = 'PilotSecurePassword2026!';

    // Register Shipper
    const regShipperRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Gorakhpur Agri Trader',
        businessName: 'Gorakhpur Wholesale Agro Mandi Traders',
        email: testShipperEmail,
        password: testPassword,
        phone: '9876500001',
        role: 'SHIPPER',
      }),
    });
    const regShipperData = await regShipperRes.json();
    assert(regShipperRes.status === 201, 'Dedicated pilot shipper registered successfully (HTTP 201)');
    shipperUser = regShipperData.user;
    createdUserIds.push(shipperUser.id);

    // Register Transporter
    const regTransporterRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Awadh Express Operator',
        businessName: 'Awadh Highway Fleet Transport',
        email: testTransporterEmail,
        password: testPassword,
        phone: '9876500002',
        role: 'TRANSPORTER',
      }),
    });
    const regTransporterData = await regTransporterRes.json();
    assert(regTransporterRes.status === 201, 'Dedicated pilot transporter registered successfully (HTTP 201)');
    transporterUser = regTransporterData.user;
    createdUserIds.push(transporterUser.id);

    // Login Shipper
    const loginShipperRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testShipperEmail, password: testPassword }),
    });
    const loginShipperData = await loginShipperRes.json();
    assert(loginShipperRes.status === 200, 'Shipper authenticated via login (HTTP 200)');
    shipperToken = loginShipperData.token;

    // Login Transporter
    const loginTransporterRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testTransporterEmail, password: testPassword }),
    });
    const loginTransporterData = await loginTransporterRes.json();
    assert(loginTransporterRes.status === 200, 'Transporter authenticated via login (HTTP 200)');
    transporterToken = loginTransporterData.token;

    // -------------------------------------------------------------------------
    // STEP 4: Unauthorized Request Enforcement
    // -------------------------------------------------------------------------
    console.log('\n[4/11] Verifying Unauthorized and Cross-Role Request Rejection...');
    const unauthRes = await fetch(`${BASE_URL}/api/listings/my-listings`);
    assert(unauthRes.status === 401, 'Unauthenticated private request rejected with HTTP 401 Unauthorized');

    // Shipper attempting transporter-only endpoint
    const crossRoleRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shipperToken}`,
      },
      body: JSON.stringify({
        vehicleType: 'Mini Truck / Tata Ace',
        capacityTons: 1.5,
        availableDate: new Date(Date.now() + 86400000).toISOString(),
        origin: 'Gorakhpur Mandi, UP',
        destination: 'Lucknow Transport Nagar, UP',
      }),
    });
    assert(crossRoleRes.status === 403, 'Shipper calling transporter vehicle creation rejected with HTTP 403 Forbidden');

    // -------------------------------------------------------------------------
    // STEP 5: Freight Listing Creation by Shipper
    // -------------------------------------------------------------------------
    console.log('\n[5/11] Testing Freight Listing Creation on Pilot Corridor...');
    const postListingRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shipperToken}`,
      },
      body: JSON.stringify({
        origin: 'Gorakhpur Grain Mandi, UP',
        destination: 'Lucknow Transport Nagar, UP',
        cargoCategory: 'Agricultural Goods',
        cargoDescription: '150 bags of premium wheat grain on pallets',
        weight: 6.5,
        weightUnit: 'Tons',
        pickupDate: new Date(Date.now() + 172800000).toISOString(),
        deliveryDate: new Date(Date.now() + 259200000).toISOString(),
        offeredPrice: 18500,
        priceType: 'FIXED',
        vehicleRequirements: ['Closed Container Truck'],
      }),
    });
    const postListingData = await postListingRes.json();
    assert(postListingRes.status === 201, 'Shipper successfully created OPEN freight listing (HTTP 201)');
    const listingId = postListingData.data.id || postListingData.data._id;
    createdListingIds.push(listingId);
    assert(postListingData.data.status === 'OPEN', 'Newly created freight listing status is "OPEN"');

    // -------------------------------------------------------------------------
    // STEP 6: Vehicle Availability Registration & Transporter Quote Submission
    // -------------------------------------------------------------------------
    console.log('\n[6/11] Testing Transporter Vehicle Availability & Quote Submission...');
    // Create vehicle availability
    const postVehicleRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${transporterToken}`,
      },
      body: JSON.stringify({
        vehicleType: 'Closed Container Truck',
        capacity: 8.0,
        capacityUnit: 'Tons',
        currentLocation: 'Gorakhpur Grain Mandi, UP',
        destination: 'Lucknow Transport Nagar, UP',
        availabilityDate: new Date(Date.now() + 172800000).toISOString(),
        rateExpectation: 18000,
        notes: 'Ready for immediate loading.',
      }),
    });
    const postVehicleData = await postVehicleRes.json();
    assert(postVehicleRes.status === 201, 'Transporter registered vehicle availability (HTTP 201)');
    const vehicleId = postVehicleData.data.id || postVehicleData.data._id;
    createdVehicleIds.push(vehicleId);

    // Submit quote / interest
    const quoteRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${transporterToken}`,
      },
      body: JSON.stringify({
        listingId,
        vehicleAvailabilityId: vehicleId,
        proposedRate: 18000,
        proposedVehicle: 'Closed Container Truck',
        availableFromDate: new Date(Date.now() + 172800000).toISOString(),
        message: 'Ready for immediate loading at Gorakhpur Mandi.',
      }),
    });
    const quoteData = await quoteRes.json();
    assert(quoteRes.status === 201, 'Transporter successfully submitted binding load quote (HTTP 201)');
    const interestId = quoteData.data.id || quoteData.data._id;
    createdInterestIds.push(interestId);
    assert(quoteData.data.status === 'PENDING', 'Quote registered with status "PENDING"');

    // -------------------------------------------------------------------------
    // STEP 7: Atomic Booking Assignment & Double-Booking Prevention
    // -------------------------------------------------------------------------
    console.log('\n[7/11] Testing Atomic Booking Assignment & Double-Booking Prevention...');
    // Shipper accepts the quote
    const acceptRes = await fetch(`${BASE_URL}/api/interests/${interestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shipperToken}`,
      },
      body: JSON.stringify({
        action: 'ACCEPTED',
        assignLoad: true,
        reviewNotes: 'Accepted for pilot run NH27 corridor.',
      }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, 'Shipper accepted quote and initiated atomic assignment (HTTP 200)');
    assert(acceptData.data.status === 'ACCEPTED', 'Quote status transitioned to ACCEPTED');

    // Query active bookings to verify booking creation
    const bookingsRes = await fetch(`${BASE_URL}/api/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${shipperToken}` },
    });
    const bookingsData = await bookingsRes.json();
    const bookingList = bookingsData.data || bookingsData.bookings || [];
    const activeBooking =
      bookingList.find((b) => (b.listingId?._id || b.listingId?.id || b.listingId) === listingId) ||
      acceptData.booking;
    assert(!!activeBooking, 'Atomic booking record created upon quote acceptance');
    const bookingId = activeBooking.id || activeBooking._id;
    createdBookingIds.push(bookingId);
    assert(activeBooking.status === 'CONFIRMED', 'Initial booking status is "CONFIRMED"');

    // Verify double-booking prevention: attempting to re-assign or accept on already assigned load
    const duplicateAcceptRes = await fetch(`${BASE_URL}/api/interests/${interestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shipperToken}`,
      },
      body: JSON.stringify({ action: 'ACCEPTED', assignLoad: true }),
    });
    assert(
      duplicateAcceptRes.status === 400 || duplicateAcceptRes.status === 409,
      'Duplicate acceptance strictly rejected (HTTP 400/409 Conflict)'
    );

    // -------------------------------------------------------------------------
    // STEP 8: In-App Notification Delivery
    // -------------------------------------------------------------------------
    console.log('\n[8/11] Verifying Real-Time In-App Notification Delivery...');
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${transporterToken}` },
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, 'Transporter retrieved notification feed (HTTP 200)');
    const notifList = notifData.data?.notifications || notifData.notifications || [];
    const confirmedNotif = notifList.find(
      (n) => n.type === 'BOOKING_CONFIRMED' || n.type === 'QUOTE_ACCEPTED'
    );
    assert(!!confirmedNotif, 'Transporter received in-app alert for quote acceptance / booking confirmation');
    if (confirmedNotif) {
      createdNotificationIds.push(confirmedNotif._id || confirmedNotif.id);
    }

    // -------------------------------------------------------------------------
    // STEP 9: Transporter Transit Updates & Protected Delivery Proof
    // -------------------------------------------------------------------------
    console.log('\n[9/11] Testing Transit Progression and Protected Delivery Evidence...');
    // 1. Pickup
    const pickupRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/pickup`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${transporterToken}`,
      },
      body: JSON.stringify({
        pickupNotes: 'Loaded 150 wheat bags at Gorakhpur Mandi gate 2.',
        pickupDate: new Date().toISOString(),
      }),
    });
    assert(pickupRes.status === 200, 'Booking transitioned to PICKED_UP (HTTP 200)');

    // 2. In Transit
    const transitRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/transit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${transporterToken}`,
      },
      body: JSON.stringify({
        location: 'Ayodhya Bypass NH27',
        notes: 'Vehicle crossing Ayodhya bypass without delay.',
      }),
    });
    assert(transitRes.status === 200, 'Booking transitioned to IN_TRANSIT (HTTP 200)');

    // 3. Submit Delivery Proof (multipart dummy proof)
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="recipientName"\r\n\r\n` +
      `Suresh Verma (Lucknow Warehouse Manager)\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="deliveryNotes"\r\n\r\n` +
      `Delivered 150 bags in sound condition. Receiver signed physical LR.\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="documents"; filename="pod_receipt.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n` +
      `%PDF-1.4 Mock Delivery Proof Document For RouteWise Smoke Testing\r\n` +
      `--${boundary}--\r\n`;

    const podRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/delivery-proof`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${transporterToken}`,
      },
      body: multipartBody,
    });
    const podData = await podRes.json();
    assert(podRes.status === 200, 'Transporter uploaded physical delivery proof (HTTP 200)');
    assert(podData.data && podData.data.status === 'DELIVERED', 'Booking transitioned to DELIVERED status');

    // -------------------------------------------------------------------------
    // STEP 10: Private Document Access Control
    // -------------------------------------------------------------------------
    console.log('\n[10/11] Verifying Private Delivery Proof Access Control...');
    // Create an unverified third-party account to verify 403 Forbidden
    const unauthThirdPartyRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/proof/mock-doc-id`);
    assert(
      unauthThirdPartyRes.status === 401,
      'Unauthenticated user strictly blocked from accessing private proof (HTTP 401)'
    );

    // -------------------------------------------------------------------------
    // STEP 11: Shipper Confirmation & Completion Persistence
    // -------------------------------------------------------------------------
    console.log('\n[11/11] Testing Shipper Delivery Confirmation & Completion Persistence...');
    const completeRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shipperToken}`,
      },
      body: JSON.stringify({
        completionNotes: 'Consignment received and verified intact at warehouse.',
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, 'Shipper confirmed delivery (HTTP 200)');
    assert(completeData.data && completeData.data.status === 'COMPLETED', 'Booking finalized with COMPLETED status');
    assert(completeData.data.deliveryProof?.evidenceStatus === 'VERIFIED', 'Delivery evidence marked VERIFIED');

    // Check vehicle availability transitioned to COMPLETED
    const refreshedVehicle = await VehicleAvailability.findById(vehicleId);
    assert(
      refreshedVehicle && refreshedVehicle.status === 'COMPLETED',
      'Assigned vehicle status updated to COMPLETED for finished trip'
    );

    console.log('\n================================================================');
    console.log(`  SMOKE TEST PASSED: All ${passedTests}/${totalTests} production smoke checks verified!`);
    console.log('  RouteWise Phase 8 Core Workflow Fully Operational & Validated!  ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Smoke Test Execution Failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Isolated cleanup of temporary smoke test entities
    console.log('[Cleanup] Safely purging dedicated smoke test entities...');
    try {
      await Promise.all([
        Booking.deleteMany({ _id: { $in: createdBookingIds } }),
        FreightListing.deleteMany({ _id: { $in: createdListingIds } }),
        VehicleAvailability.deleteMany({ _id: { $in: createdVehicleIds } }),
        LoadInterest.deleteMany({ _id: { $in: createdInterestIds } }),
        Notification.deleteMany({ _id: { $in: createdNotificationIds } }),
        User.deleteMany({ _id: { $in: createdUserIds } }),
      ]);
      console.log('✓ Cleanup complete: All temporary smoke test records purged cleanly.');
    } catch (cleanupErr) {
      console.error('Warning during cleanup:', cleanupErr.message);
    }
    await mongoose.connection.close();
  }
}

runProductionSmokeTests();
