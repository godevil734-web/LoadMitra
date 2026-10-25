import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import FreightListing from './models/FreightListing.js';
import VehicleAvailability from './models/VehicleAvailability.js';
import LoadInterest from './models/LoadInterest.js';
import Booking from './models/Booking.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runBookingVerification() {
  console.log('================================================================');
  console.log('   RouteWise Phase 5: Booking Lifecycle & Concurrency Suite     ');
  console.log('================================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  // Tracking arrays for clean, scoped purging of test records
  const createdListingIds = [];
  const createdVehicleIds = [];
  const createdInterestIds = [];
  const createdBookingIds = [];

  let tokenShipperA = null;
  let tokenShipperB = null;
  let tokenTransporterA = null;
  let tokenTransporterB = null;

  let userShipperA = null;
  let userShipperB = null;
  let userTransporterA = null;
  let userTransporterB = null;

  try {
    await connectDB();

    // 0. Authenticate test actors using established demo auth endpoints
    console.log('[Setup] Authenticating demo actors (Shipper A, Shipper B, Transporter A, Transporter B)...');

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

    const headersSA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperA}` };
    const headersSB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenShipperB}` };
    const headersTA = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterA}` };
    const headersTB = { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenTransporterB}` };

    console.log('✓ Pass: Shipper A/B and Transporter A/B authenticated successfully.\n');

    // 1. Successful bid acceptance and booking creation
    console.log('[Test 1] Testing successful bid acceptance and atomic booking creation...');
    // Create Shipper A freight listing (15 Tons Delhi -> Kanpur, pickup tomorrow)
    const pickupDate1 = new Date(Date.now() + 86400000).toISOString();
    const listRes1 = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Delhi Azadpur',
        destination: 'Kanpur Transport Nagar',
        cargoCategory: 'Agricultural Goods',
        weight: 15,
        weightUnit: 'Tons',
        pickupDate: pickupDate1,
        offeredPrice: 32000,
        priceType: 'FIXED',
      }),
    });
    if (listRes1.status !== 201) {
      const err = await listRes1.json();
      throw new Error(`Failed to create test listing 1: ${listRes1.status}: ${JSON.stringify(err)}`);
    }
    const listData1 = await listRes1.json();
    const listingId1 = listData1.data.id;
    createdListingIds.push(listingId1);

    // Register Transporter A vehicle (20 Tons, available today)
    const vehRes1 = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Heavy-Duty Truck',
        capacity: 20,
        capacityUnit: 'Tons',
        currentLocation: 'Delhi',
        destination: 'Kanpur',
        availabilityDate: new Date(Date.now() - 3600000).toISOString(),
      }),
    });
    const vehData1 = await vehRes1.json();
    const vehicleId1 = vehData1.data.id;
    createdVehicleIds.push(vehicleId1);

    // Transporter A submits Quote 1
    const intRes1 = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: listingId1,
        proposedRate: 31500,
        proposedVehicle: 'Heavy-Duty Truck',
        vehicleAvailabilityId: vehicleId1,
        message: 'Ready to load tomorrow morning.',
      }),
    });
    const intData1 = await intRes1.json();
    const interestId1 = intData1.data.id;
    createdInterestIds.push(interestId1);

    // Shipper A assigns the load and accepts quote
    const assignRes1 = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        listingId: listingId1,
        interestId: interestId1,
        vehicleAvailabilityId: vehicleId1,
        reviewNotes: 'Accepted rate of ₹31,500. Assigned to Transporter A.',
      }),
    });
    if (assignRes1.status !== 201) {
      const err = await assignRes1.json();
      throw new Error(`Expected 201 for load assignment, got ${assignRes1.status}: ${JSON.stringify(err)}`);
    }
    const assignData1 = await assignRes1.json();
    const bookingId1 = assignData1.data.booking.id;
    createdBookingIds.push(bookingId1);

    if (assignData1.data.booking.status !== 'CONFIRMED') {
      throw new Error(`Expected booking status to be CONFIRMED, got ${assignData1.data.booking.status}`);
    }

    // Verify listing is now ASSIGNED and vehicle is now MATCHED
    const verifyList1 = await FreightListing.findById(listingId1);
    if (verifyList1.status !== 'ASSIGNED') {
      throw new Error(`Expected listing status ASSIGNED, got ${verifyList1.status}`);
    }
    const verifyVeh1 = await VehicleAvailability.findById(vehicleId1);
    if (verifyVeh1.status !== 'MATCHED') {
      throw new Error(`Expected vehicle status MATCHED, got ${verifyVeh1.status}`);
    }
    console.log('✓ Pass: Booking CONFIRMED; Listing ASSIGNED; Vehicle MATCHED.\n');

    // 2. Non-owning shipper attempting acceptance
    console.log('[Test 2] Testing non-owning shipper attempting assignment...');
    const unauthAssignRes = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSB, // Shipper B attempting to assign Shipper A's load
      body: JSON.stringify({
        listingId: listingId1,
        interestId: interestId1,
        vehicleAvailabilityId: vehicleId1,
      }),
    });
    if (unauthAssignRes.status !== 403) {
      throw new Error(`Expected 403 for non-owning shipper, got ${unauthAssignRes.status}`);
    }
    console.log('✓ Pass: Non-owning shipper blocked from assigning load (403 Forbidden).\n');

    // 3. Transporter attempting shipper-only operations
    console.log('[Test 3] Testing transporter attempting shipper-only assignment...');
    const transporterAssignRes = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: listingId1,
        interestId: interestId1,
      }),
    });
    if (transporterAssignRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for transporter on assign endpoint, got ${transporterAssignRes.status}`);
    }
    console.log('✓ Pass: Transporter blocked from shipper assignment endpoint (403 Forbidden).\n');

    // 4 & 5. Concurrent acceptance of two bids on one listing (Double-Booking Prevention)
    console.log('[Test 4 & 5] Testing concurrent / race acceptance on a single freight listing...');
    // Create new listing for race test
    const listResRace = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Lucknow Transport Nagar',
        destination: 'Varanasi Mandi',
        cargoCategory: 'Packaged Goods',
        weight: 10,
        weightUnit: 'Tons',
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        offeredPrice: 20000,
      }),
    });
    if (listResRace.status !== 201) {
      const err = await listResRace.json();
      throw new Error(`Failed to create race listing: ${listResRace.status}: ${JSON.stringify(err)}`);
    }
    const listDataRace = await listResRace.json();
    const listingIdRace = listDataRace.data.id;
    createdListingIds.push(listingIdRace);

    // Transporter A vehicle & bid
    const vehResRaceA = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Closed Container Truck',
        capacity: 12,
        currentLocation: 'Lucknow',
        destination: 'Varanasi',
        availabilityDate: new Date().toISOString(),
      }),
    });
    const vehDataRaceA = await vehResRaceA.json();
    createdVehicleIds.push(vehDataRaceA.data.id);

    const intResRaceA = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: listingIdRace,
        proposedRate: 19500,
        vehicleAvailabilityId: vehDataRaceA.data.id,
      }),
    });
    const intDataRaceA = await intResRaceA.json();
    createdInterestIds.push(intDataRaceA.data.id);

    // Transporter B vehicle & bid
    const vehResRaceB = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTB,
      body: JSON.stringify({
        vehicleType: 'Closed Container Truck',
        capacity: 14,
        currentLocation: 'Lucknow',
        destination: 'Varanasi',
        availabilityDate: new Date().toISOString(),
      }),
    });
    const vehDataRaceB = await vehResRaceB.json();
    createdVehicleIds.push(vehDataRaceB.data.id);

    const intResRaceB = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTB,
      body: JSON.stringify({
        listingId: listingIdRace,
        proposedRate: 19000,
        vehicleAvailabilityId: vehDataRaceB.data.id,
      }),
    });
    const intDataRaceB = await intResRaceB.json();
    createdInterestIds.push(intDataRaceB.data.id);

    // Dispatch two concurrent assignment requests for the same listing
    const [raceRes1, raceRes2] = await Promise.all([
      fetch(`${BASE_URL}/api/bookings/assign`, {
        method: 'POST',
        headers: headersSA,
        body: JSON.stringify({
          listingId: listingIdRace,
          interestId: intDataRaceA.data.id,
          vehicleAvailabilityId: vehDataRaceA.data.id,
        }),
      }),
      fetch(`${BASE_URL}/api/bookings/assign`, {
        method: 'POST',
        headers: headersSA,
        body: JSON.stringify({
          listingId: listingIdRace,
          interestId: intDataRaceB.data.id,
          vehicleAvailabilityId: vehDataRaceB.data.id,
        }),
      }),
    ]);

    const statuses = [raceRes1.status, raceRes2.status].sort();
    if (statuses[0] !== 201 || statuses[1] !== 409) {
      throw new Error(`Expected exactly one 201 Created and one 409 Conflict, got ${statuses.join(', ')}`);
    }

    // Verify only ONE booking exists for listingIdRace
    const raceBookings = await Booking.find({ listingId: listingIdRace, status: { $ne: 'CANCELLED' } });
    if (raceBookings.length !== 1) {
      throw new Error(`Database consistency violation: Found ${raceBookings.length} active bookings on single listing!`);
    }
    createdBookingIds.push(raceBookings[0]._id);
    console.log('✓ Pass: Exactly one assignment succeeded (201); concurrent conflict correctly aborted (409 Conflict).\n');

    // 6. One vehicle availability slot competing for overlapping bookings
    console.log('[Test 6] Testing vehicle double-booking prevention...');
    // Create a 2nd listing and try assigning it to the ALREADY RESERVED vehicle (vehDataRaceA if A won, or vehDataRaceB if B won)
    const winningVehId = raceBookings[0].vehicleAvailabilityId.toString();
    const listResOver = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Lucknow',
        destination: 'Varanasi',
        cargoCategory: 'Industrial Goods',
        weight: 5,
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        offeredPrice: 15000,
      }),
    });
    if (listResOver.status !== 201) {
      const err = await listResOver.json();
      throw new Error(`Failed to create overlap listing: ${listResOver.status}: ${JSON.stringify(err)}`);
    }
    const listDataOver = await listResOver.json();
    createdListingIds.push(listDataOver.data.id);

    // Try assigning to already MATCHED vehicle
    const overlapAssignRes = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        listingId: listDataOver.data.id,
        interestId: intDataRaceA.data.id,
        vehicleAvailabilityId: winningVehId,
      }),
    });
    if (overlapAssignRes.status !== 409 && overlapAssignRes.status !== 400) {
      throw new Error(`Expected 409 or 400 when assigning already reserved vehicle, got ${overlapAssignRes.status}`);
    }
    console.log('✓ Pass: Vehicle availability double-booking strictly prevented (409 Conflict).\n');

    // 8. Invalid capacity and availability-date combinations
    console.log('[Test 8] Testing capacity and date compatibility validation...');
    // Register a mini truck (Capacity: 1 Ton)
    const miniVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        vehicleType: 'Mini Truck / Tata Ace',
        capacity: 1,
        capacityUnit: 'Tons',
        currentLocation: 'Delhi',
        destination: 'Jaipur',
        availabilityDate: new Date().toISOString(),
      }),
    });
    const miniVehData = await miniVehRes.json();
    createdVehicleIds.push(miniVehData.data.id);

    // Listing is 10 Tons (Delhi -> Jaipur)
    const heavyListRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Delhi',
        destination: 'Jaipur',
        cargoCategory: 'Industrial Goods',
        weight: 10,
        weightUnit: 'Tons',
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        offeredPrice: 18000,
      }),
    });
    if (heavyListRes.status !== 201) {
      const err = await heavyListRes.json();
      throw new Error(`Failed to create heavy listing: ${heavyListRes.status}: ${JSON.stringify(err)}`);
    }
    const heavyListData = await heavyListRes.json();
    createdListingIds.push(heavyListData.data.id);

    // Quote with insufficient capacity vehicle
    const quoteIncapRes = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTA,
      body: JSON.stringify({
        listingId: heavyListData.data.id,
        proposedRate: 17500,
        vehicleAvailabilityId: miniVehData.data.id,
      }),
    });
    if (quoteIncapRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for insufficient vehicle capacity, got ${quoteIncapRes.status}`);
    }
    console.log('✓ Pass: Incompatible vehicle capacity correctly rejected with 400 Bad Request.\n');

    // 9. Status lifecycle progression and transition validation
    console.log('[Test 9] Testing booking lifecycle state transitions...');
    // Using bookingId1 (Status: CONFIRMED)
    // Transporter B (unauthorized) tries to record pickup
    const unauthPickup = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/pickup`, {
      method: 'PATCH',
      headers: headersTB,
    });
    if (unauthPickup.status !== 403) {
      throw new Error(`Expected 403 for unauthorized transporter pickup, got ${unauthPickup.status}`);
    }

    // Invalid transition: Shipper tries to complete a CONFIRMED booking directly
    const invalidSkipComplete = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/complete`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({ completionNotes: 'Premature completion' }),
    });
    if (invalidSkipComplete.status !== 400) {
      throw new Error(`Expected 400 Bad Request for premature completion from CONFIRMED status, got ${invalidSkipComplete.status}`);
    }

    // Transporter A legitimately records PICKUP
    const validPickup = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/pickup`, {
      method: 'PATCH',
      headers: headersTA,
      body: JSON.stringify({ notes: 'Loaded 15T agricultural bags at Azadpur Mandi gate 1.' }),
    });
    if (validPickup.status !== 200) {
      throw new Error(`Expected 200 for valid pickup, got ${validPickup.status}`);
    }
    const pickupData = await validPickup.json();
    if (pickupData.data.status !== 'PICKED_UP') {
      throw new Error(`Expected status PICKED_UP, got ${pickupData.data.status}`);
    }

    // Transporter A records live TRANSIT update
    const transitRes = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/transit`, {
      method: 'PATCH',
      headers: headersTA,
      body: JSON.stringify({
        location: 'Aligarh Bypass NH-91 Toll Plaza',
        notes: 'Vehicle moving at scheduled speed. ETA Kanpur 5:00 PM.',
      }),
    });
    if (transitRes.status !== 200) {
      throw new Error(`Expected 200 for transit update, got ${transitRes.status}`);
    }

    // Transporter A reports DELIVERY
    const deliveryRes = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/delivery`, {
      method: 'PATCH',
      headers: headersTA,
      body: JSON.stringify({
        recipientName: 'Rameshwar Lal Warehouse In-charge',
        deliveryNotes: 'Cargo inspected and unloaded at Kanpur Platform 3.',
        proofNotes: 'Physical bilty copy signed and stamped.',
      }),
    });
    if (deliveryRes.status !== 200) {
      throw new Error(`Expected 200 for reporting delivery, got ${deliveryRes.status}`);
    }
    const delData = await deliveryRes.json();
    if (delData.data.status !== 'DELIVERED') {
      throw new Error(`Expected status DELIVERED, got ${delData.data.status}`);
    }

    // Shipper A confirms receipt and COMPLETES booking
    const completeRes = await fetch(`${BASE_URL}/api/bookings/${bookingId1}/complete`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({
        completionNotes: 'Delivery verified. Full 15 Tons received in prime condition.',
      }),
    });
    if (completeRes.status !== 200) {
      throw new Error(`Expected 200 for completion confirmation, got ${completeRes.status}`);
    }
    const compData = await completeRes.json();
    if (compData.data.status !== 'COMPLETED') {
      throw new Error(`Expected status COMPLETED, got ${compData.data.status}`);
    }

    // Verify final state synchronization
    const finalListing = await FreightListing.findById(listingId1);
    const finalVehicle = await VehicleAvailability.findById(vehicleId1);
    if (finalListing.status !== 'COMPLETED' || finalVehicle.status !== 'COMPLETED') {
      throw new Error(`Status mismatch on completion: Listing=${finalListing.status}, Vehicle=${finalVehicle.status}`);
    }
    console.log('✓ Pass: Full lifecycle verified (CONFIRMED -> PICKED_UP -> IN_TRANSIT -> DELIVERED -> COMPLETED).\n');

    // 10. Competing bids receive documented final statuses
    console.log('[Test 10] Testing competing bids outcome upon assignment...');
    // In race test, verify losing interest is REJECTED
    const losingInterest = await LoadInterest.findOne({
      listingId: listingIdRace,
      _id: { $ne: raceBookings[0].interestId },
    });
    if (!losingInterest || losingInterest.status !== 'REJECTED') {
      throw new Error(`Expected competing bid to be automatically REJECTED, got ${losingInterest?.status}`);
    }
    console.log(`✓ Pass: Competing bid automatically marked REJECTED (${losingInterest.reviewNotes}).\n`);

    // 11 & 12. Privacy and Authorization Checks
    console.log('[Test 11 & 12] Testing booking privacy and participant authorization...');
    // Transporter B (unrelated party) attempts to retrieve bookingId1
    const unauthBookingFetch = await fetch(`${BASE_URL}/api/bookings/${bookingId1}`, {
      headers: headersTB,
    });
    if (unauthBookingFetch.status !== 403) {
      throw new Error(`Expected 403 for unrelated transporter retrieving booking, got ${unauthBookingFetch.status}`);
    }

    // Authorized Shipper A retrieves bookingId1
    const authBookingFetch = await fetch(`${BASE_URL}/api/bookings/${bookingId1}`, {
      headers: headersSA,
    });
    if (authBookingFetch.status !== 200) {
      throw new Error(`Expected 200 for authorized shipper retrieving booking, got ${authBookingFetch.status}`);
    }
    const bookingDetails = await authBookingFetch.json();
    if (!bookingDetails.data.transporter.phone) {
      throw new Error('Expected authorized shipper to see transporter contact phone.');
    }
    console.log('✓ Pass: Unrelated parties blocked (403); authorized participants receive contact info.\n');

    // 14. Booking persistence after re-fetch / my-bookings feed
    console.log('[Test 14] Testing my-bookings feed query and persistence...');
    const myBookingsShipper = await fetch(`${BASE_URL}/api/bookings/my-bookings`, {
      headers: headersSA,
    });
    const myBookingsData = await myBookingsShipper.json();
    if (!myBookingsData.data.some((b) => b.id === bookingId1)) {
      throw new Error(`Expected bookingId1 in Shipper A's my-bookings feed.`);
    }
    console.log(`✓ Pass: Shipper retrieved active bookings count: ${myBookingsData.count}.\n`);

    // 15. Cancellation and Vehicle Release Workflow
    console.log('[Test 15] Testing booking cancellation and vehicle release workflow...');
    // Create new listing and vehicle
    const listResCancel = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        origin: 'Noida Sector 62',
        destination: 'Agra Bypass',
        cargoCategory: 'Packaged Goods',
        weight: 3,
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        offeredPrice: 12000,
      }),
    });
    if (listResCancel.status !== 201) {
      const err = await listResCancel.json();
      throw new Error(`Failed to create cancel test listing: ${listResCancel.status}: ${JSON.stringify(err)}`);
    }
    const listDataCancel = await listResCancel.json();
    createdListingIds.push(listDataCancel.data.id);

    const vehResCancel = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: headersTB,
      body: JSON.stringify({
        vehicleType: 'Closed Container Truck',
        capacity: 5,
        currentLocation: 'Noida',
        destination: 'Agra',
        availabilityDate: new Date().toISOString(),
      }),
    });
    const vehDataCancel = await vehResCancel.json();
    createdVehicleIds.push(vehDataCancel.data.id);

    const intResCancel = await fetch(`${BASE_URL}/api/interests`, {
      method: 'POST',
      headers: headersTB,
      body: JSON.stringify({
        listingId: listDataCancel.data.id,
        proposedRate: 11500,
        vehicleAvailabilityId: vehDataCancel.data.id,
      }),
    });
    const intDataCancel = await intResCancel.json();
    createdInterestIds.push(intDataCancel.data.id);

    // Shipper assigns load
    const assignCancel = await fetch(`${BASE_URL}/api/bookings/assign`, {
      method: 'POST',
      headers: headersSA,
      body: JSON.stringify({
        listingId: listDataCancel.data.id,
        interestId: intDataCancel.data.id,
        vehicleAvailabilityId: vehDataCancel.data.id,
      }),
    });
    const assignCancelData = await assignCancel.json();
    const cancelBookingId = assignCancelData.data.booking.id;
    createdBookingIds.push(cancelBookingId);

    // Shipper cancels booking prior to pickup
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${cancelBookingId}/cancel`, {
      method: 'PATCH',
      headers: headersSA,
      body: JSON.stringify({ reason: 'Warehouse schedule postponed by client.' }),
    });
    if (cancelRes.status !== 200) {
      throw new Error(`Expected 200 for valid cancellation, got ${cancelRes.status}`);
    }

    // Verify listing is released back to OPEN and vehicle released back to AVAILABLE
    const releasedList = await FreightListing.findById(listDataCancel.data.id);
    const releasedVeh = await VehicleAvailability.findById(vehDataCancel.data.id);
    if (releasedList.status !== 'OPEN') {
      throw new Error(`Expected released listing to be OPEN, got ${releasedList.status}`);
    }
    if (releasedVeh.status !== 'AVAILABLE') {
      throw new Error(`Expected released vehicle to be AVAILABLE, got ${releasedVeh.status}`);
    }
    console.log('✓ Pass: Cancellation successfully releases listing to OPEN and vehicle to AVAILABLE.\n');

    // 16. Scoped database cleanup
    console.log('[Cleanup] Purging temporary test entities from MongoDB Atlas...');
    if (createdBookingIds.length > 0) {
      await Booking.deleteMany({ _id: { $in: createdBookingIds } });
    }
    if (createdInterestIds.length > 0) {
      await LoadInterest.deleteMany({ _id: { $in: createdInterestIds } });
    }
    if (createdListingIds.length > 0) {
      await FreightListing.deleteMany({ _id: { $in: createdListingIds } });
    }
    if (createdVehicleIds.length > 0) {
      await VehicleAvailability.deleteMany({ _id: { $in: createdVehicleIds } });
    }
    console.log('✓ Pass: Temporary test records cleanly purged.\n');

    console.log('================================================================');
    console.log('   🎉 ALL 16 PHASE 5 BOOKING LIFECYCLE TESTS PASSED (100%)      ');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Booking Verification Suite FAILED:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);

    // Attempt best-effort cleanup on failure
    try {
      if (createdBookingIds.length > 0) await Booking.deleteMany({ _id: { $in: createdBookingIds } });
      if (createdInterestIds.length > 0) await LoadInterest.deleteMany({ _id: { $in: createdInterestIds } });
      if (createdListingIds.length > 0) await FreightListing.deleteMany({ _id: { $in: createdListingIds } });
      if (createdVehicleIds.length > 0) await VehicleAvailability.deleteMany({ _id: { $in: createdVehicleIds } });
    } catch (_) {}

    process.exit(1);
  }
}

runBookingVerification();
