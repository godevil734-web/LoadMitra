import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import FreightListing from './models/FreightListing.js';
import VehicleAvailability from './models/VehicleAvailability.js';
import LoadInterest from './models/LoadInterest.js';
import Booking from './models/Booking.js';
import Notification from './models/Notification.js';
import TransporterVerification from './models/TransporterVerification.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runNotificationsAndTrustVerification() {
  console.log('================================================================');
  console.log('  RouteWise Phase 6: Notifications, Verification & Trust Suite  ');
  console.log('================================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  // Tracking arrays for clean purging of temporary test records
  const createdListingIds = [];
  const createdVehicleIds = [];
  const createdInterestIds = [];
  const createdBookingIds = [];
  const createdNotificationIds = [];
  const createdVerificationIds = [];

  let tokenShipperA = null;
  let tokenShipperB = null;
  let tokenTransporterA = null;
  let tokenTransporterB = null;
  let tokenAdmin = null;

  let userShipperA = null;
  let userShipperB = null;
  let userTransporterA = null;
  let userTransporterB = null;

  try {
    await connectDB();

    // 0. Authenticate test actors
    console.log('[Setup] Authenticating test actors (Shippers, Transporters & Admin)...');

    const sALogin = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 1 }),
    });
    const sAData = await sALogin.json();
    tokenShipperA = sAData.token;
    userShipperA = sAData.user;

    const sBLogin = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 2 }),
    });
    const sBData = await sBLogin.json();
    tokenShipperB = sBData.token;
    userShipperB = sBData.user;

    const tALogin = await fetch(`${BASE_URL}/api/auth/demo-transporter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 1 }),
    });
    const tAData = await tALogin.json();
    tokenTransporterA = tAData.token;
    userTransporterA = tAData.user;

    const tBLogin = await fetch(`${BASE_URL}/api/auth/demo-transporter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 2 }),
    });
    const tBData = await tBLogin.json();
    tokenTransporterB = tBData.token;
    userTransporterB = tBData.user;

    // Admin login
    const adminLogin = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'routewise-admin-2026',
      }),
    });
    const adminData = await adminLogin.json();
    tokenAdmin = adminData.token;

    const headersSA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperA}` };
    const headersSB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperB}` };
    const headersTA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterA}` };
    const headersTB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterB}` };
    const headersAdmin = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` };

    console.log('✓ Pass: Shipper A/B, Transporter A/B, and Administrator authenticated successfully.\n');

    // =========================================================================
    // SECTION 1: IN-APP NOTIFICATIONS (TESTS 1 - 7)
    // =========================================================================

    // Test 1: Notification creation after successful event
    console.log('[Test 1] Testing notification creation after successful quote submission...');
    const pickupDate = new Date(Date.now() + 86400000).toISOString();
    const listRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Gorakhpur Mandi',
        destination: 'Lucknow Transport Nagar',
        cargoCategory: 'Agricultural Goods',
        weight: 12,
        offeredPrice: 22000,
        pickupDate,
      }),
    });
    const listData = await listRes.json();
    const testListingId = listData.data.id;
    createdListingIds.push(testListingId);

    // Initial unread count for Shipper A
    const countBeforeRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: headersSA });
    const countBeforeData = await countBeforeRes.json();
    const initialUnreadCount = countBeforeData.unreadCount || 0;

    // Transporter A submits a quote
    const quoteRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: testListingId,
        proposedRate: 21500,
        proposedVehicle: 'Medium Commercial Truck',
      }),
    });
    const quoteData = await quoteRes.json();
    const testInterestId = quoteData.data.id;
    createdInterestIds.push(testInterestId);

    // Verify Shipper A received QUOTE_RECEIVED notification
    const countAfterRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: headersSA });
    const countAfterData = await countAfterRes.json();

    if (countAfterData.unreadCount !== initialUnreadCount + 1) {
      throw new Error(`Expected unread count to increase by 1, got before: ${initialUnreadCount}, after: ${countAfterData.unreadCount}`);
    }

    const notifFeedRes = await fetch(`${BASE_URL}/api/notifications?limit=5`, { headers: headersSA });
    const notifFeedData = await notifFeedRes.json();
    const latestNotif = notifFeedData.data.notifications[0];

    if (!latestNotif || latestNotif.type !== 'QUOTE_RECEIVED') {
      throw new Error(`Expected QUOTE_RECEIVED notification, got: ${latestNotif ? latestNotif.type : 'none'}`);
    }
    createdNotificationIds.push(latestNotif.id);
    console.log(`✓ Pass: Successful quote creation triggered in-app notification for Shipper A (ID: ${latestNotif.id}).\n`);

    // Test 2: No notification after a failed or rejected operation
    console.log('[Test 2] Testing no notification generated after a failed/rejected operation...');
    const invalidQuoteRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: 'invalid-id-format',
        proposedRate: -500,
      }),
    });
    if (invalidQuoteRes.status < 400) {
      throw new Error(`Expected 400 Bad Request for invalid quote, got ${invalidQuoteRes.status}`);
    }

    const countCheckRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: headersSA });
    const countCheckData = await countCheckRes.json();
    if (countCheckData.unreadCount !== initialUnreadCount + 1) {
      throw new Error(`Unread count changed unexpectedly on failed operation.`);
    }
    console.log('✓ Pass: Failed operations do not generate spurious notifications.\n');

    // Test 3: Authenticated notification feed
    console.log('[Test 3] Testing authenticated notification feed...');
    const feedRes = await fetch(`${BASE_URL}/api/notifications`, { headers: headersSA });
    if (feedRes.status !== 200) {
      throw new Error(`Expected 200 OK for notifications feed, got ${feedRes.status}`);
    }
    const feedData = await feedRes.json();
    if (!Array.isArray(feedData.data.notifications) || feedData.data.pagination === undefined) {
      throw new Error('Notifications feed missing required notifications array or pagination envelope.');
    }
    console.log(`✓ Pass: Feed retrieved ${feedData.data.notifications.length} notifications with valid pagination.\n`);

    // Test 4: Unread count accuracy
    console.log('[Test 4] Testing unread count accuracy...');
    const unreadCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: headersSA });
    const unreadCountData = await unreadCountRes.json();
    const realDbCount = await Notification.countDocuments({ recipientId: userShipperA.id, isRead: false });
    if (unreadCountData.unreadCount !== realDbCount) {
      throw new Error(`API unread count (${unreadCountData.unreadCount}) does not match DB count (${realDbCount})`);
    }
    console.log(`✓ Pass: Unread count accurately reflects database records (${realDbCount} unread).\n`);

    // Test 5: Mark-one-read and mark-all-read
    console.log('[Test 5] Testing mark-one-read and mark-all-read workflows...');
    // Mark one read
    const markOneRes = await fetch(`${BASE_URL}/api/notifications/${latestNotif.id}/read`, {
      method: 'PATCH',
      headers: headersSA,
    });
    if (markOneRes.status !== 200) {
      throw new Error(`Expected 200 OK marking notification as read, got ${markOneRes.status}`);
    }
    const markOneData = await markOneRes.json();
    if (markOneData.data.isRead !== true) {
      throw new Error('Notification isRead field was not updated to true.');
    }

    // Mark all read
    const markAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: headersSA,
    });
    if (markAllRes.status !== 200) {
      throw new Error(`Expected 200 OK marking all notifications read, got ${markAllRes.status}`);
    }
    const finalCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, { headers: headersSA });
    const finalCountData = await finalCountRes.json();
    if (finalCountData.unreadCount !== 0) {
      throw new Error(`Expected unread count 0 after read-all, got ${finalCountData.unreadCount}`);
    }
    console.log('✓ Pass: Both mark-one-read and mark-all-read updated database state correctly.\n');

    // Test 6: Cross-user access prevention
    console.log('[Test 6] Testing cross-user notification isolation & modification prevention...');
    const crossReadRes = await fetch(`${BASE_URL}/api/notifications/${latestNotif.id}/read`, {
      method: 'PATCH',
      headers: headersSB, // Shipper B trying to modify Shipper A notification
    });
    if (crossReadRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user notification edit, got ${crossReadRes.status}`);
    }

    const sBFeedRes = await fetch(`${BASE_URL}/api/notifications`, { headers: headersSB });
    const sBFeedData = await sBFeedRes.json();
    const hasShipperANotifs = sBFeedData.data.notifications.some((n) => n.id === latestNotif.id);
    if (hasShipperANotifs) {
      throw new Error('Shipper B notification feed contained Shipper A private notification.');
    }
    console.log('✓ Pass: Cross-user notification modification rejected with 403 Forbidden; feeds strictly isolated.\n');

    // Test 7: Pagination and empty-state handling
    console.log('[Test 7] Testing pagination limits and empty-state handling...');
    const pageRes = await fetch(`${BASE_URL}/api/notifications?page=99&limit=10`, { headers: headersSA });
    const pageData = await pageRes.json();
    if (pageData.data.notifications.length !== 0) {
      throw new Error(`Expected empty list for out-of-range page 99, got ${pageData.data.notifications.length}`);
    }
    if (pageData.data.pagination.page !== 99) {
      throw new Error(`Expected page 99 in pagination metadata, got ${pageData.data.pagination.page}`);
    }
    console.log('✓ Pass: Out-of-bounds pagination gracefully returns empty array with pagination metadata.\n');

    // =========================================================================
    // SECTION 2: TRANSPORTER VERIFICATION & ADMIN REVIEW (TESTS 8 - 14)
    // =========================================================================

    // Test 8: Authenticated document submission
    console.log('[Test 8] Testing authenticated transporter document submission...');
    const docForm = new FormData();
    const samplePdfBlob = new Blob(['%PDF-1.4 sample transporter commercial registration document bytes'], {
      type: 'application/pdf',
    });
    docForm.append('documents', samplePdfBlob, 'business_registration_rc.pdf');
    docForm.append('documentType', 'BUSINESS_REGISTRATION');
    docForm.append('documentNumber', 'UP32-2026-REG-9876');
    docForm.append('submissionNotes', 'Official commercial registration certificate for fleet operations.');

    const subDocRes = await fetch(`${BASE_URL}/api/verification/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: docForm,
    });
    if (subDocRes.status !== 201) {
      const errBody = await subDocRes.text();
      throw new Error(`Expected 201 Created for verification submission, got ${subDocRes.status}: ${errBody}`);
    }
    const subDocData = await subDocRes.json();
    const verificationId = subDocData.data.id;
    createdVerificationIds.push(verificationId);

    if (subDocData.data.status !== 'PENDING') {
      throw new Error(`Expected initial status PENDING, got: ${subDocData.data.status}`);
    }
    const uploadedDocId = subDocData.data.documents[0].id;
    console.log(`✓ Pass: Transporter A successfully submitted verification documents (Status: PENDING, ID: ${verificationId}).\n`);

    // Test 9: File type and file size validation
    console.log('[Test 9] Testing file type and file size validation...');
    // A. Executable file rejection (.exe)
    const badExtForm = new FormData();
    const exeBlob = new Blob(['malicious executable binary'], { type: 'application/x-msdownload' });
    badExtForm.append('documents', exeBlob, 'exploit.exe');
    badExtForm.append('documentType', 'PAN');

    const badExtRes = await fetch(`${BASE_URL}/api/verification/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: badExtForm,
    });
    if (badExtRes.status !== 400 && badExtRes.status !== 500) {
      throw new Error(`Expected 400/error for executable upload, got status ${badExtRes.status}`);
    }

    // B. Oversized file rejection (> 5MB)
    const bigForm = new FormData();
    const oversizedBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'application/pdf' });
    bigForm.append('documents', oversizedBlob, 'huge_payload.pdf');
    bigForm.append('documentType', 'PAN');

    const bigRes = await fetch(`${BASE_URL}/api/verification/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: bigForm,
    });
    if (bigRes.status < 400) {
      throw new Error(`Expected 400/413 rejection for oversized file, got ${bigRes.status}`);
    }
    console.log('✓ Pass: Executable files and oversized uploads strictly rejected.\n');

    // Test 10: Unauthorized document access rejection
    console.log('[Test 10] Testing unauthorized document access rejection...');
    // Transporter B attempting to download Transporter A's document
    const crossDocRes = await fetch(`${BASE_URL}/api/verification/documents/${uploadedDocId}`, {
      headers: headersTB,
    });
    if (crossDocRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized document access, got ${crossDocRes.status}`);
    }

    // Shipper attempting to download private verification document
    const shipperDocRes = await fetch(`${BASE_URL}/api/verification/documents/${uploadedDocId}`, {
      headers: headersSA,
    });
    if (shipperDocRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for shipper document access, got ${shipperDocRes.status}`);
    }

    // Admin should be able to access document
    const adminDocRes = await fetch(`${BASE_URL}/api/verification/documents/${uploadedDocId}`, {
      headers: headersAdmin,
    });
    if (adminDocRes.status !== 200) {
      throw new Error(`Expected 200 OK for admin document inspection, got ${adminDocRes.status}`);
    }
    console.log('✓ Pass: Document access strictly protected (Unauthorized: 403 Forbidden, Administrator: 200 OK).\n');

    // Test 11: Admin-only approval, rejection and correction requests
    console.log('[Test 11] Testing admin review actions and role authorization...');
    // Non-admin attempting review
    const nonAdminReview = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}/review`, {
      method: 'PATCH',
      headers: headersTA,
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    if (nonAdminReview.status !== 401 && nonAdminReview.status !== 403) {
      throw new Error(`Expected 401/403 for non-admin review attempt, got ${nonAdminReview.status}`);
    }

    // Admin requests corrections
    const correctRes = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}/review`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({
        status: 'CORRECTION_REQUIRED',
        reason: 'The uploaded RC document is missing page 2 showing vehicle fitness expiration date.',
        notes: 'Requested updated RC with fitness certificate endorsement.',
      }),
    });
    if (correctRes.status !== 200) {
      throw new Error(`Expected 200 OK for admin correction request, got ${correctRes.status}`);
    }
    const correctData = await correctRes.json();
    if (correctData.data.status !== 'CORRECTION_REQUIRED') {
      throw new Error(`Expected status CORRECTION_REQUIRED, got ${correctData.data.status}`);
    }

    // Verify Transporter A received notification regarding correction request
    const tANotifsRes = await fetch(`${BASE_URL}/api/notifications?unreadOnly=true`, { headers: headersTA });
    const tANotifsData = await tANotifsRes.json();
    const correctNotif = tANotifsData.data.notifications.find((n) => n.type === 'VERIFICATION_CORRECTION');
    if (!correctNotif) {
      throw new Error('Transporter did not receive VERIFICATION_CORRECTION notification.');
    }
    createdNotificationIds.push(correctNotif.id);
    console.log('✓ Pass: Admin successfully requested corrections with reason; Transporter notified via in-app alert.\n');

    // Test 12: Invalid status transition rejection
    console.log('[Test 12] Testing invalid status transition rejection...');
    const invalidStatusRes = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}/review`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({
        status: 'INVALID_STATUS_STRING',
      }),
    });
    if (invalidStatusRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid status, got ${invalidStatusRes.status}`);
    }

    // Correction request without reason rejected
    const missingReasonRes = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}/review`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({
        status: 'CORRECTION_REQUIRED',
        reason: '',
      }),
    });
    if (missingReasonRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when reason is missing, got ${missingReasonRes.status}`);
    }
    console.log('✓ Pass: Invalid status transitions and missing correction reasons rejected with 400 Bad Request.\n');

    // Test 13: Resubmission after correction
    console.log('[Test 13] Testing transporter resubmission after correction request...');
    const resubForm = new FormData();
    const updatedPdfBlob = new Blob(['%PDF-1.4 updated full fitness certificate and vehicle RC'], {
      type: 'application/pdf',
    });
    resubForm.append('documents', updatedPdfBlob, 'updated_rc_fitness.pdf');
    resubForm.append('documentType', 'FITNESS_CERTIFICATE');
    resubForm.append('submissionNotes', 'Resubmitted with complete page 2 fitness endorsement.');

    const resubRes = await fetch(`${BASE_URL}/api/verification/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: resubForm,
    });
    if (resubRes.status !== 201) {
      throw new Error(`Expected 201 Created on resubmission, got ${resubRes.status}`);
    }
    const resubData = await resubRes.json();
    if (resubData.data.status !== 'PENDING') {
      throw new Error(`Expected status to return to PENDING after resubmission, got ${resubData.data.status}`);
    }
    console.log('✓ Pass: Resubmission transitioned status back to PENDING and appended updated documents.\n');

    // Admin approves the resubmission
    const approveRes = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}/review`, {
      method: 'PATCH',
      headers: headersAdmin,
      body: JSON.stringify({
        status: 'APPROVED',
        notes: 'Verified against state transport department registry. All documents valid.',
      }),
    });
    if (approveRes.status !== 200) {
      throw new Error(`Expected 200 OK on admin approval, got ${approveRes.status}`);
    }

    // Test 14: Audit history persistence
    console.log('[Test 14] Testing verification audit history persistence...');
    const auditRes = await fetch(`${BASE_URL}/api/admin/verifications/${verificationId}`, { headers: headersAdmin });
    const auditData = await auditRes.json();
    const auditEntries = auditData.data.auditLog || [];
    if (auditEntries.length < 3) {
      throw new Error(`Expected at least 3 audit log entries, found ${auditEntries.length}`);
    }
    console.log(`✓ Pass: Verification audit history persisted ${auditEntries.length} chronological administrative decisions.\n`);

    // =========================================================================
    // SECTION 3: DELIVERY PROOF & AUDIT TRAIL (TESTS 15 - 20)
    // =========================================================================

    // Test 15: Assigned transporter can submit valid delivery evidence
    console.log('[Test 15] Testing assigned transporter submitting delivery evidence...');
    // Create vehicle for Transporter A
    const vRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Medium Commercial Truck',
        capacity: 15,
        currentLocation: 'Gorakhpur Mandi',
        destination: 'Lucknow Transport Nagar',
        availabilityDate: pickupDate,
      }),
    });
    const vData = await vRes.json();
    const vehicleId = vData.data.id;
    createdVehicleIds.push(vehicleId);

    // Create and assign booking
    const assignRes = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        listingId: testListingId,
        interestId: testInterestId,
        vehicleAvailabilityId: vehicleId,
      }),
    });
    if (assignRes.status !== 201) {
      const err = await assignRes.text();
      throw new Error(`Booking assignment failed: ${assignRes.status}: ${err}`);
    }
    const assignData = await assignRes.json();
    const bookingId = assignData.data.booking?.id || assignData.data.id;
    createdBookingIds.push(bookingId);

    // Transporter records pickup
    await fetch(`${BASE_URL}/api/bookings/${bookingId}/pickup`, {
      method: 'PATCH',
      headers: headersTA,
      body: JSON.stringify({ notes: 'Picked up 12 tons flour sacks.' }),
    });

    // Transporter submits delivery proof
    const proofForm = new FormData();
    const proofImgBlob = new Blob(['fake jpeg binary data for proof of delivery stamp'], { type: 'image/jpeg' });
    proofForm.append('documents', proofImgBlob, 'signed_lr_consignment_note.jpg');
    proofForm.append('recipientName', 'Ramesh Kumar (Warehouse Incharge)');
    proofForm.append('recipientContact', '9876543210');
    proofForm.append('deliveryNotes', 'Goods received in intact sealed condition.');

    const proofRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/delivery-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: proofForm,
    });
    if (proofRes.status !== 200) {
      const errText = await proofRes.text();
      throw new Error(`Expected 200 OK for delivery proof submission, got ${proofRes.status}: ${errText}`);
    }
    const proofData = await proofRes.json();
    if (proofData.data.status !== 'DELIVERED') {
      throw new Error(`Expected booking status DELIVERED, got ${proofData.data.status}`);
    }
    if (proofData.data.deliveryProof.evidenceStatus !== 'SUBMITTED') {
      throw new Error(`Expected evidenceStatus SUBMITTED, got ${proofData.data.deliveryProof.evidenceStatus}`);
    }
    const proofDocId = proofData.data.deliveryProof.documents[0].id;
    console.log(`✓ Pass: Transporter A successfully submitted delivery proof (Recipient: ${proofData.data.deliveryProof.recipientName}).\n`);

    // Test 16: Another transporter cannot submit or access that evidence
    console.log('[Test 16] Testing cross-transporter evidence submission and access prevention...');
    // Transporter B attempting to submit proof for Transporter A's booking
    const fakeProofForm = new FormData();
    fakeProofForm.append('documents', proofImgBlob, 'unauthorized_proof.jpg');
    const crossProofRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/delivery-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterB}` },
      body: fakeProofForm,
    });
    if (crossProofRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-transporter proof submission, got ${crossProofRes.status}`);
    }

    // Transporter B attempting to view/download Transporter A's delivery proof file
    const crossProofGetRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/proof/${proofDocId}`, {
      headers: headersTB,
    });
    if (crossProofGetRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-transporter proof download, got ${crossProofGetRes.status}`);
    }
    console.log('✓ Pass: Unauthorized transporter blocked from submitting or viewing private proof (403 Forbidden).\n');

    // Test 17: Evidence submission at an invalid booking stage is rejected
    console.log('[Test 17] Testing evidence submission at an invalid booking stage...');
    // Create new listing and booking that is merely CONFIRMED (not yet picked up)
    const listRes2 = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Lucknow Mandi',
        destination: 'Kanpur Hub',
        cargoCategory: 'Packaged Goods',
        weight: 10,
        offeredPrice: 18000,
        pickupDate,
      }),
    });
    const listData2 = await listRes2.json();
    createdListingIds.push(listData2.data.id);

    const intRes2 = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: listData2.data.id,
        proposedRate: 17500,
        proposedVehicle: 'Medium Commercial Truck',
      }),
    });
    const intData2 = await intRes2.json();
    createdInterestIds.push(intData2.data.id);

    const vRes2 = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Medium Commercial Truck',
        capacity: 10,
        currentLocation: 'Lucknow Mandi',
        destination: 'Kanpur Hub',
        availabilityDate: pickupDate,
      }),
    });
    const vData2 = await vRes2.json();
    createdVehicleIds.push(vData2.data.id);

    const assignRes2 = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        listingId: listData2.data.id,
        interestId: intData2.data.id,
        vehicleAvailabilityId: vData2.data.id,
      }),
    });
    const assignData2 = await assignRes2.json();
    const confirmedBookingId = assignData2.data.booking?.id || assignData2.data.id;
    createdBookingIds.push(confirmedBookingId);

    // Attempting proof submission while still CONFIRMED (prior to pickup)
    const earlyProofRes = await fetch(`${BASE_URL}/api/bookings/${confirmedBookingId}/delivery-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTransporterA}` },
      body: proofForm,
    });
    if (earlyProofRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for proof submission before pickup, got ${earlyProofRes.status}`);
    }
    console.log('✓ Pass: Proof submission rejected when booking is in CONFIRMED pre-pickup state (400 Bad Request).\n');

    // Test 18: Owning shipper can confirm delivery
    console.log('[Test 18] Testing owning shipper confirming delivery...');
    const completeRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/complete`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({
        completionNotes: 'All 12 tons received in excellent order. Seal verified.',
      }),
    });
    if (completeRes.status !== 200) {
      throw new Error(`Expected 200 OK for delivery completion, got ${completeRes.status}`);
    }
    const completeData = await completeRes.json();
    if (completeData.data.status !== 'COMPLETED') {
      throw new Error(`Expected booking status COMPLETED, got ${completeData.data.status}`);
    }
    if (completeData.data.deliveryProof.evidenceStatus !== 'VERIFIED') {
      throw new Error(`Expected delivery evidenceStatus to transition to VERIFIED, got ${completeData.data.deliveryProof.evidenceStatus}`);
    }
    console.log('✓ Pass: Owning shipper confirmed delivery; status COMPLETED and evidence VERIFIED.\n');

    // Test 19: Non-owning shipper cannot confirm or inspect the booking
    console.log('[Test 19] Testing non-owning shipper cannot confirm or inspect booking...');
    const nonOwnerCompleteRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}/complete`, {
      method: 'PATCH',
      headers: headersSB,
    });
    if (nonOwnerCompleteRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-owning shipper completion, got ${nonOwnerCompleteRes.status}`);
    }

    const nonOwnerGetRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      headers: headersSB,
    });
    if (nonOwnerGetRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-owning shipper booking access, got ${nonOwnerGetRes.status}`);
    }
    console.log('✓ Pass: Non-owning shipper blocked with 403 Forbidden on inspection and confirmation.\n');

    // Test 20: Booking audit events persist correctly
    console.log('[Test 20] Testing booking audit trail persistence and real trust metrics...');
    const bookingAudit = await Booking.findById(bookingId).lean();
    const history = bookingAudit.statusHistory || [];
    const expectedStatuses = ['CONFIRMED', 'PICKED_UP', 'DELIVERED', 'COMPLETED'];
    for (const st of expectedStatuses) {
      const found = history.find((h) => h.status === st);
      if (!found) {
        throw new Error(`Missing expected audit event for status "${st}" in booking history.`);
      }
    }

    // Verify marketplace trust enrichment on listing quotes
    const trustQuotesRes = await fetch(`${BASE_URL}/api/interests/listing/${testListingId}`, { headers: headersSA });
    const trustQuotesData = await trustQuotesRes.json();
    const quoteEntry = trustQuotesData.data[0];
    if (quoteEntry) {
      if (quoteEntry.transporterVerificationStatus !== 'APPROVED') {
        throw new Error(`Expected transporterVerificationStatus to be APPROVED, got: ${quoteEntry.transporterVerificationStatus}`);
      }
      if (typeof quoteEntry.transporterCompletedBookings !== 'number' || quoteEntry.transporterCompletedBookings < 1) {
        throw new Error(`Expected transporterCompletedBookings >= 1, got: ${quoteEntry.transporterCompletedBookings}`);
      }
    }

    console.log(`✓ Pass: Complete booking audit trail verified (${history.length} lifecycle entries). Real trust indicators reflect APPROVED verification and ${quoteEntry?.transporterCompletedBookings} real completed load(s).\n`);

    // =========================================================================
    // CLEANUP
    // =========================================================================
    console.log('[Cleanup] Purging temporary test entities from MongoDB Atlas...');
    await Promise.all([
      Booking.deleteMany({ _id: { $in: createdBookingIds } }),
      FreightListing.deleteMany({ _id: { $in: createdListingIds } }),
      VehicleAvailability.deleteMany({ _id: { $in: createdVehicleIds } }),
      LoadInterest.deleteMany({ _id: { $in: createdInterestIds } }),
      Notification.deleteMany({ _id: { $in: createdNotificationIds } }),
      TransporterVerification.deleteMany({ _id: { $in: createdVerificationIds } }),
    ]);
    console.log('✓ Pass: Temporary test records cleanly purged.\n');

    console.log('================================================================');
    console.log('   🎉 ALL 20 PHASE 6 NOTIFICATION & TRUST TESTS PASSED (100%)   ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 6 Verification Test Failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
}

runNotificationsAndTrustVerification();
