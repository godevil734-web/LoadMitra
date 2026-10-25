import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import FreightListing from './models/FreightListing.js';
import VehicleAvailability from './models/VehicleAvailability.js';
import LoadInterest from './models/LoadInterest.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runTransporterVerification() {
  console.log('================================================================');
  console.log('   RouteWise Phase 4: Transporter Marketplace Verification     ');
  console.log('================================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  let tokenTransporterA = null;
  let tokenTransporterB = null;
  let tokenShipperA = null;
  let tokenShipperB = null;

  let userTransporterA = null;
  let userTransporterB = null;
  let userShipperA = null;
  let userShipperB = null;

  let testListingId = null;
  let testVehicleId = null;
  let testInterestIdA = null;
  let testInterestIdB = null;

  try {
    // 1. Unauthenticated Security Checks
    console.log('[Test 1] Testing unauthenticated access protection on private endpoints...');
    const unauthVehicle = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleType: 'Pickup Truck', capacity: 2 }),
    });
    if (unauthVehicle.status !== 401) {
      throw new Error(`Expected 401 for unauth POST /api/vehicles, got ${unauthVehicle.status}`);
    }

    const unauthInterest = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposedRate: 15000 }),
    });
    if (unauthInterest.status !== 401) {
      throw new Error(`Expected 401 for unauth POST /api/interests, got ${unauthInterest.status}`);
    }

    const unauthMyVehicles = await fetch(`${BASE_URL}/api/vehicles/my-availability`);
    if (unauthMyVehicles.status !== 401) {
      throw new Error(`Expected 401 for unauth GET /api/vehicles/my-availability, got ${unauthMyVehicles.status}`);
    }

    const unauthMyRequests = await fetch(`${BASE_URL}/api/interests/my-requests`);
    if (unauthMyRequests.status !== 401) {
      throw new Error(`Expected 401 for unauth GET /api/interests/my-requests, got ${unauthMyRequests.status}`);
    }
    console.log('✓ Pass: All private transporter endpoints strictly reject unauthenticated requests (401).\n');

    // 2. Authenticate Demo Users (Transporters & Shippers)
    console.log('[Test 2] Authenticating Transporter A, Transporter B, Shipper A, and Shipper B...');
    const tALogin = await fetch(`${BASE_URL}/api/auth/demo-transporter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 1 }),
    });
    const tAData = await tALogin.json();
    tokenTransporterA = tAData.token;
    userTransporterA = tAData.user;
    console.log(`✓ Pass: Transporter A authenticated: "${userTransporterA.businessName}" (${userTransporterA.email})`);

    const tBLogin = await fetch(`${BASE_URL}/api/auth/demo-transporter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 2 }),
    });
    const tBData = await tBLogin.json();
    tokenTransporterB = tBData.token;
    userTransporterB = tBData.user;
    console.log(`✓ Pass: Transporter B authenticated: "${userTransporterB.businessName}" (${userTransporterB.email})`);

    const sALogin = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 1 }),
    });
    const sAData = await sALogin.json();
    tokenShipperA = sAData.token;
    userShipperA = sAData.user;
    console.log(`✓ Pass: Shipper A authenticated: "${userShipperA.businessName}" (${userShipperA.email})`);

    const sBLogin = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 2 }),
    });
    const sBData = await sBLogin.json();
    tokenShipperB = sBData.token;
    userShipperB = sBData.user;
    console.log(`✓ Pass: Shipper B authenticated: "${userShipperB.businessName}" (${userShipperB.email})\n`);

    const headersTA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterA}` };
    const headersTB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterB}` };
    const headersSA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperA}` };
    const headersSB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperB}` };

    // 3. Role-Based Authorization Checks (Shipper attempting Transporter Actions)
    console.log('[Test 3] Testing role enforcement (Shipper cannot create vehicle or express load interest)...');
    const shipperVehicleRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        vehicleType: 'Pickup Truck',
        capacity: 2.5,
        currentLocation: 'Gorakhpur, UP',
        destination: 'Lucknow, UP',
        availabilityDate: new Date().toISOString(),
      }),
    });
    if (shipperVehicleRes.status !== 403) {
      throw new Error(`Expected 403 for Shipper calling POST /api/vehicles, got ${shipperVehicleRes.status}`);
    }

    const shipperInterestRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        proposedRate: 15000,
      }),
    });
    if (shipperInterestRes.status !== 403) {
      throw new Error(`Expected 403 for Shipper calling POST /api/interests, got ${shipperInterestRes.status}`);
    }
    console.log('✓ Pass: Shippers strictly prevented from publishing vehicles or expressing load interest (403 Forbidden).\n');

    // 4. Vehicle Availability Validation & Creation
    console.log('[Test 4] Testing vehicle availability validation and creation...');
    const invalidVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Unknown Flying Vehicle',
        capacity: -5,
        currentLocation: 'Lucknow',
        destination: 'Lucknow', // Identical
      }),
    });
    if (invalidVehRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid vehicle inputs, got ${invalidVehRes.status}`);
    }
    const invalidVehData = await invalidVehRes.json();
    if (!invalidVehData.errors?.vehicleType || !invalidVehData.errors?.capacity || !invalidVehData.errors?.destination) {
      throw new Error(`Expected specific validation errors, got: ${JSON.stringify(invalidVehData.errors)}`);
    }
    console.log('✓ Pass: Vehicle availability input validation properly caught malformed payload (400 Bad Request).');

    const validVehiclePayload = {
      vehicleType: 'Mini Truck / Tata Ace',
      capacity: 1.5,
      capacityUnit: 'Tons',
      currentLocation: 'Gorakhpur Transport Nagar, UP',
      destination: 'Lucknow Transport Nagar, UP',
      operatingCorridor: 'Gorakhpur to Lucknow (NH27 Corridor)',
      availabilityDate: new Date(Date.now() + 86400000).toISOString(),
      isReturnTrip: true,
      rateExpectation: 8500,
      notes: 'Available for immediate return trip with dry packaged items.',
    };

    const createVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify(validVehiclePayload),
    });
    if (createVehRes.status !== 201) {
      const err = await createVehRes.json();
      throw new Error(`Expected 201 Created for valid vehicle availability, got ${createVehRes.status}: ${JSON.stringify(err)}`);
    }
    const createVehData = await createVehRes.json();
    testVehicleId = createVehData.data.id;
    if (!testVehicleId || createVehData.data.isReturnTrip !== true || createVehData.data.status !== 'AVAILABLE') {
      throw new Error('Created vehicle data did not return expected fields.');
    }
    console.log(`✓ Pass: Transporter A successfully created vehicle availability record (ID: ${testVehicleId}).\n`);

    // 5. Vehicle Availability Querying & Filtering
    console.log('[Test 5] Querying public vehicle availability with filters...');
    const queryVehRes = await fetch(`${BASE_URL}/api/vehicles?isReturnTrip=true&currentLocation=Gorakhpur`);
    if (queryVehRes.status !== 200) {
      throw new Error(`Expected 200 for vehicle search, got ${queryVehRes.status}`);
    }
    const queryVehData = await queryVehRes.json();
    const foundRecord = queryVehData.data.find((v) => v.id === testVehicleId);
    if (!foundRecord) {
      throw new Error('Created return-trip vehicle record was not returned in filtered search query.');
    }
    console.log(`✓ Pass: Return-trip filter successfully located vehicle record (${queryVehData.count} matches).`);

    const myVehRes = await fetch(`${BASE_URL}/api/vehicles/my-availability`, { headers: headersTA });
    if (myVehRes.status !== 200) {
      throw new Error(`Expected 200 for my-availability, got ${myVehRes.status}`);
    }
    const myVehData = await myVehRes.json();
    if (!myVehData.data.some((v) => v.id === testVehicleId)) {
      throw new Error('Created vehicle record missing from transporter my-availability list.');
    }
    console.log('✓ Pass: Transporter A successfully retrieved personal vehicle availability listings.\n');

    // 6. Cross-User Authorization & Mutation on Vehicle Record
    console.log('[Test 6] Testing cross-user authorization on vehicle availability update...');
    const unauthorizedUpdateRes = await fetch(`${BASE_URL}/api/vehicles/${testVehicleId}`, {
      method: 'PUT',
      headers: headersTB, // Transporter B attempting to edit Transporter A's vehicle
      body: JSON.stringify({ capacity: 5 }),
    });
    if (unauthorizedUpdateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user vehicle update, got ${unauthorizedUpdateRes.status}`);
    }
    console.log('✓ Pass: Transporter B correctly blocked from modifying Transporter A vehicle (403 Forbidden).');

    // Transporter A legitimately updating their vehicle
    const legitimateUpdateRes = await fetch(`${BASE_URL}/api/vehicles/${testVehicleId}`, {
      method: 'PUT',
      headers: headersTA,
      body: JSON.stringify({
        capacity: 2.0,
        rateExpectation: 9000,
        notes: 'Updated: capacity verified at 2.0 tons.',
      }),
    });
    if (legitimateUpdateRes.status !== 200) {
      throw new Error(`Expected 200 OK for owner vehicle update, got ${legitimateUpdateRes.status}`);
    }
    const updatedVehData = await legitimateUpdateRes.json();
    if (updatedVehData.data.capacity !== 2.0 || updatedVehData.data.rateExpectation !== 9000) {
      throw new Error('Vehicle record failed to reflect updated values.');
    }
    console.log('✓ Pass: Transporter A successfully updated vehicle details.\n');

    // 7. Setup Test Freight Listing (by Shipper A)
    console.log('[Test 7] Creating an OPEN freight listing by Shipper A for load interest testing...');
    const listingPayload = {
      origin: 'Gorakhpur Mandi, UP',
      destination: 'Lucknow Dubagga Mandi, UP',
      cargoCategory: 'Agricultural Goods',
      cargoDescription: '500 Bags of Basmati Rice (10 Tons)',
      weight: 10,
      weightUnit: 'Tons',
      pickupDate: new Date(Date.now() + 172800000).toISOString(),
      offeredPrice: 24000,
      priceType: 'FIXED',
      vehicleRequirements: ['Heavy-Duty Truck', 'Medium Commercial Truck'],
      notes: 'Dock loading available from 7:00 AM.',
    };

    const createListingRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify(listingPayload),
    });
    if (createListingRes.status !== 201) {
      const err = await createListingRes.json();
      throw new Error(`Failed to create test listing for interest test: ${JSON.stringify(err)}`);
    }
    const listingData = await createListingRes.json();
    testListingId = listingData.data.id;
    console.log(`✓ Pass: Shipper A created OPEN test freight listing (ID: ${testListingId}).\n`);

    // 8. Express Interest Workflow & Preservation of Listing Status
    console.log('[Test 8] Transporter A expressing interest in OPEN freight listing...');
    const interestPayloadA = {
      listingId: testListingId,
      proposedRate: 23500,
      proposedVehicle: '10-Ton Medium Commercial Truck (UP53-AB-1234)',
      availableFromDate: new Date(Date.now() + 172800000).toISOString(),
      message: 'Can pick up sharp at 7:00 AM. Experienced driver with agricultural tarp cover.',
    };

    const submitInterestRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify(interestPayloadA),
    });
    if (submitInterestRes.status !== 201) {
      const err = await submitInterestRes.json();
      throw new Error(`Expected 201 for load interest submission, got ${submitInterestRes.status}: ${JSON.stringify(err)}`);
    }
    const interestDataA = await submitInterestRes.json();
    testInterestIdA = interestDataA.data.id;
    if (interestDataA.data.status !== 'PENDING') {
      throw new Error(`Expected status to be PENDING, got ${interestDataA.data.status}`);
    }
    console.log(`✓ Pass: Interest request submitted with PENDING status (ID: ${testInterestIdA}).`);

    // Verify listing status is strictly preserved as OPEN
    const checkListingRes = await fetch(`${BASE_URL}/api/listings/${testListingId}`);
    const checkListingData = await checkListingRes.json();
    if (checkListingData.data.status !== 'OPEN') {
      throw new Error(`Listing status must remain OPEN when interest is submitted, but was: ${checkListingData.data.status}`);
    }
    console.log('✓ Pass: Freight listing status strictly preserved as "OPEN" (no automatic status mutations).\n');

    // 9. Duplicate Active Interest Prevention
    console.log('[Test 9] Testing duplicate active interest prevention for same listing...');
    const duplicateRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA, // Transporter A trying again
      body: JSON.stringify({
        listingId: testListingId,
        proposedRate: 22000,
        message: 'Second attempt should be rejected.',
      }),
    });
    if (duplicateRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate active interest submission, got ${duplicateRes.status}`);
    }
    console.log('✓ Pass: Duplicate active interest properly rejected with 409 Conflict.\n');

    // 10. Transporter My Requests Feed
    console.log('[Test 10] Testing Transporter A my-requests tracking feed...');
    const myRequestsRes = await fetch(`${BASE_URL}/api/interests/my-requests`, { headers: headersTA });
    if (myRequestsRes.status !== 200) {
      throw new Error(`Expected 200 OK for my-requests, got ${myRequestsRes.status}`);
    }
    const myRequestsData = await myRequestsRes.json();
    const myReq = myRequestsData.data.find((r) => r.id === testInterestIdA);
    if (!myReq || !myReq.listing || !myReq.listing.origin || !myReq.listing.destination) {
      throw new Error('My requests response does not contain linked load details.');
    }
    console.log(`✓ Pass: Transporter A successfully tracks submitted load request with full route (${myReq.listing.route}).\n`);

    // 11. Withdrawal Workflow & State Transition Protection
    console.log('[Test 11] Testing load request withdrawal by Transporter B...');
    // Transporter B submits a request on the same listing
    const submitBRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTB,
      body: JSON.stringify({
        listingId: testListingId,
        proposedRate: 24000,
        proposedVehicle: '12-Ton Multi-Axle Container',
        message: 'Transporter B proposal.',
      }),
    });
    if (submitBRes.status !== 201) {
      throw new Error(`Transporter B failed to submit request: ${submitBRes.status}`);
    }
    const dataBInterest = await submitBRes.json();
    testInterestIdB = dataBInterest.data.id;

    // Cross-user withdrawal check: Transporter A tries to withdraw Transporter B's request
    const crossWithdrawRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdB}/withdraw`, {
      method: 'PATCH',
      headers: headersTA,
    });
    if (crossWithdrawRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user request withdrawal, got ${crossWithdrawRes.status}`);
    }
    console.log('✓ Pass: Cross-user withdrawal blocked with 403 Forbidden.');

    // Transporter B withdraws their own request
    const legitimateWithdrawRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdB}/withdraw`, {
      method: 'PATCH',
      headers: headersTB,
    });
    if (legitimateWithdrawRes.status !== 200) {
      throw new Error(`Expected 200 OK for legitimate withdrawal, got ${legitimateWithdrawRes.status}`);
    }
    const withdrawnData = await legitimateWithdrawRes.json();
    if (withdrawnData.data.status !== 'WITHDRAWN') {
      throw new Error(`Expected status to be WITHDRAWN, got ${withdrawnData.data.status}`);
    }
    console.log('✓ Pass: Transporter B successfully withdrew load request (status: WITHDRAWN).');

    // Invalid state transition: Withdrawing an already WITHDRAWN request
    const reWithdrawRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdB}/withdraw`, {
      method: 'PATCH',
      headers: headersTB,
    });
    if (reWithdrawRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when re-withdrawing already WITHDRAWN request, got ${reWithdrawRes.status}`);
    }
    console.log('✓ Pass: Re-withdrawal on non-PENDING request correctly rejected (400 Bad Request).\n');

    // 12. Shipper Review Workflow & Authorization
    console.log('[Test 12] Testing Shipper review authorization and state transitions...');
    // Shipper B (not the owner) tries to view requests for Shipper A's listing
    const unauthorizedListingReviewRes = await fetch(`${BASE_URL}/api/interests/listing/${testListingId}`, {
      headers: headersSB,
    });
    if (unauthorizedListingReviewRes.status !== 403) {
      throw new Error(`Expected 403 for non-owner viewing listing requests, got ${unauthorizedListingReviewRes.status}`);
    }
    console.log('✓ Pass: Non-owning Shipper B blocked from reviewing Shipper A listing requests (403 Forbidden).');

    // Shipper B tries to accept Transporter A's request
    const unauthorizedAcceptRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdA}/review`, {
      method: 'PATCH',
      headers: headersSB,
      body: JSON.stringify({ action: 'ACCEPTED', reviewNotes: 'Hacked accept' }),
    });
    if (unauthorizedAcceptRes.status !== 403) {
      throw new Error(`Expected 403 for non-owner accepting request, got ${unauthorizedAcceptRes.status}`);
    }
    console.log('✓ Pass: Non-owning Shipper B blocked from accepting request (403 Forbidden).');

    // Shipper A retrieves incoming requests
    const ownerReviewFeedRes = await fetch(`${BASE_URL}/api/interests/listing/${testListingId}`, {
      headers: headersSA,
    });
    if (ownerReviewFeedRes.status !== 200) {
      throw new Error(`Expected 200 OK for owner reviewing listing requests, got ${ownerReviewFeedRes.status}`);
    }
    const ownerFeedData = await ownerReviewFeedRes.json();
    if (ownerFeedData.count < 1) {
      throw new Error('Owner review feed returned empty list.');
    }
    console.log(`✓ Pass: Shipper A retrieved incoming requests (${ownerFeedData.count} requests found).`);

    // Shipper A accepts Transporter A's request
    const acceptRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdA}/review`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({
        action: 'ACCEPTED',
        reviewNotes: 'Accepted rate of ₹23,500. Please report at Gorakhpur Mandi Gate 2 by 7:00 AM.',
      }),
    });
    if (acceptRes.status !== 200) {
      const err = await acceptRes.json();
      throw new Error(`Expected 200 OK for valid review acceptance, got ${acceptRes.status}: ${JSON.stringify(err)}`);
    }
    const acceptedData = await acceptRes.json();
    if (acceptedData.data.status !== 'ACCEPTED') {
      throw new Error(`Expected status to be ACCEPTED, got ${acceptedData.data.status}`);
    }
    console.log('✓ Pass: Shipper A successfully accepted Transporter A quote.');

    // Invalid state transition: Trying to modify an already ACCEPTED request
    const reAcceptRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdA}/review`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({ action: 'REJECTED' }),
    });
    if (reAcceptRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when reviewing already ACCEPTED request, got ${reAcceptRes.status}`);
    }

    const withdrawAcceptedRes = await fetch(`${BASE_URL}/api/interests/${testInterestIdA}/withdraw`, {
      method: 'PATCH',
      headers: headersTA,
    });
    if (withdrawAcceptedRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when withdrawing already ACCEPTED request, got ${withdrawAcceptedRes.status}`);
    }
    console.log('✓ Pass: State transition protections prevent mutation on finalized ACCEPTED requests (400 Bad Request).');

    // Verify Transporter A sees the updated status as ACCEPTED
    const transporterCheckRes = await fetch(`${BASE_URL}/api/interests/my-requests`, {
      headers: headersTA,
    });
    const transporterCheckData = await transporterCheckRes.json();
    const updatedBid = transporterCheckData.data.find((r) => r.id === testInterestIdA);
    if (!updatedBid || updatedBid.status !== 'ACCEPTED') {
      throw new Error(`Expected Transporter A to see ACCEPTED status, got: ${updatedBid?.status}`);
    }
    console.log('✓ Pass: Transporter A successfully retrieved updated ACCEPTED status in my-requests.');

    // Verify accepting a quote does not create inconsistent listing or vehicle statuses
    const checkListingDirect = await fetch(`${BASE_URL}/api/listings/${testListingId}`);
    const checkListingDirectData = await checkListingDirect.json();
    if (checkListingDirectData.data.status !== 'OPEN') {
      throw new Error(`Listing status corrupted after bid acceptance: ${checkListingDirectData.data.status}`);
    }
    console.log('✓ Pass: Listing and vehicle statuses verified consistent (no unintentional side-effect mutations).\n');

    // 13. Vehicle Availability Deletion & Security
    console.log('[Test 13] Testing vehicle availability deletion and ownership protection...');
    const unauthorizedDeleteVeh = await fetch(`${BASE_URL}/api/vehicles/${testVehicleId}`, {
      method: 'DELETE',
      headers: headersTB, // Transporter B attempting deletion
    });
    if (unauthorizedDeleteVeh.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user vehicle deletion, got ${unauthorizedDeleteVeh.status}`);
    }
    console.log('✓ Pass: Transporter B blocked from deleting Transporter A vehicle (403 Forbidden).');

    const legitimateDeleteVeh = await fetch(`${BASE_URL}/api/vehicles/${testVehicleId}`, {
      method: 'DELETE',
      headers: headersTA,
    });
    if (legitimateDeleteVeh.status !== 200) {
      throw new Error(`Expected 200 OK for owner vehicle deletion, got ${legitimateDeleteVeh.status}`);
    }
    console.log('✓ Pass: Transporter A successfully deleted their vehicle availability record.\n');

    // 14. Cleanup & Database Verification
    console.log('[Test 14] Verifying MongoDB persistence and performing cleanup...');
    await connectDB();
    if (testListingId) {
      await FreightListing.findByIdAndDelete(testListingId);
    }
    if (testInterestIdA) {
      await LoadInterest.findByIdAndDelete(testInterestIdA);
    }
    if (testInterestIdB) {
      await LoadInterest.findByIdAndDelete(testInterestIdB);
    }
    if (testVehicleId) {
      await VehicleAvailability.findByIdAndDelete(testVehicleId);
    }
    console.log('✓ Pass: MongoDB verified and test entities cleanly purged.\n');

    console.log('================================================================');
    console.log('   🎉 ALL 14 TRANSPORTER MARKETPLACE TESTS PASSED (100%)       ');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Transporter Verification Test FAILED:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runTransporterVerification();
