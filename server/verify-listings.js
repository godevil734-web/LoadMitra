import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import FreightListing from './models/FreightListing.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runListingsVerification() {
  console.log('===========================================================');
  console.log('   RouteWise Phase 3: Freight Listings Verification Suite  ');
  console.log('===========================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  let tokenShipperA = null;
  let tokenShipperB = null;
  let userA = null;
  let userB = null;
  let createdListingId = null;

  try {
    // 1. Verify Unauthenticated Protection (Requirement 6)
    console.log('[Test 1] Testing unauthenticated access protection on POST /api/listings...');
    const unauthRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Gorakhpur, UP',
        destination: 'Lucknow, UP',
        cargoCategory: 'Agricultural Goods',
        weight: 10,
        pickupDate: new Date().toISOString(),
        offeredPrice: 22000,
      }),
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated POST, got ${unauthRes.status}`);
    }
    console.log('✓ Pass: Unauthenticated listing creation properly rejected (401 Unauthorized).\n');

    // 2. Authenticate Shipper A and Shipper B (Requirement 6)
    console.log('[Test 2] Authenticating Shipper A and Shipper B accounts...');
    const loginARes = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 1 }),
    });
    if (loginARes.status !== 200) {
      throw new Error(`Shipper A demo login failed with status ${loginARes.status}`);
    }
    const dataA = await loginARes.json();
    tokenShipperA = dataA.token;
    userA = dataA.user;
    console.log(`✓ Pass: Shipper A authenticated: "${userA.businessName}" (${userA.email})`);

    const loginBRes = await fetch(`${BASE_URL}/api/auth/demo-shipper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: 2 }),
    });
    if (loginBRes.status !== 200) {
      throw new Error(`Shipper B demo login failed with status ${loginBRes.status}`);
    }
    const dataB = await loginBRes.json();
    tokenShipperB = dataB.token;
    userB = dataB.user;
    console.log(`✓ Pass: Shipper B authenticated: "${userB.businessName}" (${userB.email})\n`);

    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenShipperA}`,
    };
    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenShipperB}`,
    };

    // 3. Test Validation Rejections (Requirement 3)
    console.log('[Test 3] Testing validation of malformed listing inputs...');
    const invalidPayloads = [
      {
        desc: 'Missing origin & destination',
        payload: { cargoCategory: 'General Goods', weight: 5, offeredPrice: 15000, pickupDate: new Date() },
      },
      {
        desc: 'Identical origin and destination',
        payload: { origin: 'Lucknow', destination: 'Lucknow', cargoCategory: 'General Goods', weight: 5, offeredPrice: 15000, pickupDate: new Date() },
      },
      {
        desc: 'Negative offered price',
        payload: { origin: 'Lucknow', destination: 'Kanpur', cargoCategory: 'General Goods', weight: 5, offeredPrice: -500, pickupDate: new Date() },
      },
      {
        desc: 'Invalid cargo category',
        payload: { origin: 'Lucknow', destination: 'Kanpur', cargoCategory: 'NonExistentCargoType', weight: 5, offeredPrice: 15000, pickupDate: new Date() },
      },
    ];

    for (const testCase of invalidPayloads) {
      const res = await fetch(`${BASE_URL}/api/listings`, {
        method: 'POST',
        headers: headersA,
        body: JSON.stringify(testCase.payload),
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 for "${testCase.desc}", got ${res.status}`);
      }
    }
    console.log('✓ Pass: All 4 invalid payloads correctly rejected with 400 Bad Request and validation errors.\n');

    // 4. Create Freight Listing in MongoDB Atlas by Shipper A (Requirement 1, 2, 5)
    console.log('[Test 4] Testing freight listing creation by Shipper A...');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createRes = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        origin: 'Gorakhpur Wholesale Grain Mandi, UP',
        destination: 'Lucknow Transport Nagar, UP',
        cargoCategory: 'Agricultural Goods',
        cargoDescription: '250 bags of premium wheat flour on standardized wooden pallets',
        weight: 9.5,
        weightUnit: 'Tons',
        pickupDate: tomorrow,
        offeredPrice: 24500,
        priceType: 'FIXED',
        vehicleRequirements: ['24ft Closed Container (9 - 10 Ton)'],
        notes: 'Loading dock available with forklift assistance. Morning pickup preferred between 8 AM - 11 AM.',
      }),
    });

    if (createRes.status !== 201) {
      const err = await createRes.text();
      throw new Error(`Listing creation failed with status ${createRes.status}: ${err}`);
    }

    const createData = await createRes.json();
    createdListingId = createData.data.id;
    console.log(`✓ Pass: Freight listing published successfully (ID: ${createdListingId}):`);
    console.log(`  - Route: ${createData.data.route}`);
    console.log(`  - Cargo: ${createData.data.cargoCategory} (${createData.data.weightDisplay})`);
    console.log(`  - Price: ${createData.data.offeredPriceFormatted} (${createData.data.priceType})`);
    console.log(`  - Shipper: ${createData.data.businessName} (${createData.data.contactPhone})\n`);

    // 5. Verify Direct MongoDB Atlas Persistence (Requirement 1 & 5)
    console.log('[Test 5] Verifying listing persistence directly in MongoDB Atlas...');
    await connectDB();
    const persisted = await FreightListing.findById(createdListingId);
    if (!persisted) {
      throw new Error(`Document ${createdListingId} not found in MongoDB Atlas FreightListing collection`);
    }
    if (persisted.businessName !== userA.businessName) {
      throw new Error(`Persisted businessName mismatch: expected "${userA.businessName}", got "${persisted.businessName}"`);
    }
    if (persisted.status !== 'OPEN') {
      throw new Error(`Expected default status OPEN, got ${persisted.status}`);
    }
    console.log('✓ Pass: Verified document directly in Atlas database with matching fields & types.\n');

    // 6. Verify Marketplace Feed & Pagination (Requirement 3)
    console.log('[Test 6] Testing public marketplace feed & pagination (GET /api/listings)...');
    const feedRes = await fetch(`${BASE_URL}/api/listings?page=1&limit=5`);
    if (feedRes.status !== 200) {
      throw new Error(`Marketplace feed failed with status ${feedRes.status}`);
    }
    const feedData = await feedRes.json();
    if (!feedData.pagination || !Array.isArray(feedData.data)) {
      throw new Error('Malformed feed response: missing pagination or data array');
    }
    const foundInFeed = feedData.data.some((l) => l.id === createdListingId);
    if (!foundInFeed) {
      throw new Error(`Newly created listing ${createdListingId} was not found in marketplace feed`);
    }
    console.log(`✓ Pass: Feed returned ${feedData.count} listings (Page ${feedData.pagination.page} of ${feedData.pagination.totalPages}). Newly created listing verified in feed.\n`);

    // 7. Verify Filtering (Origin, Destination, Cargo Category, Status) (Requirement 3)
    console.log('[Test 7] Testing filtering capabilities...');
    // Filter by origin
    const filterOriginRes = await fetch(`${BASE_URL}/api/listings?origin=Gorakhpur`);
    const filterOriginData = await filterOriginRes.json();
    const originMatch = filterOriginData.data.every((l) => l.origin.toLowerCase().includes('gorakhpur'));
    if (!originMatch || filterOriginData.data.length === 0) {
      throw new Error('Origin filter failed to match Gorakhpur corridor');
    }
    console.log(`  ✓ Origin filter matched ${filterOriginData.data.length} listings in Gorakhpur.`);

    // Filter by cargo
    const filterCargoRes = await fetch(`${BASE_URL}/api/listings?cargo=Agricultural%20Goods`);
    const filterCargoData = await filterCargoRes.json();
    const cargoMatch = filterCargoData.data.every((l) => l.cargoCategory === 'Agricultural Goods');
    if (!cargoMatch || filterCargoData.data.length === 0) {
      throw new Error('Cargo category filter failed');
    }
    console.log(`  ✓ Cargo filter matched ${filterCargoData.data.length} Agricultural Goods listings.`);

    // Filter by status
    const filterStatusRes = await fetch(`${BASE_URL}/api/listings?status=OPEN`);
    const filterStatusData = await filterStatusRes.json();
    const statusMatch = filterStatusData.data.every((l) => l.status === 'OPEN');
    if (!statusMatch || filterStatusData.data.length === 0) {
      throw new Error('Status filter failed');
    }
    console.log(`  ✓ Status filter matched ${filterStatusData.data.length} OPEN listings.\n`);

    // 8. Verify Single Listing Detail View (Requirement 4)
    console.log('[Test 8] Testing listing details endpoint (/api/listings/:id)...');
    const detailRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}`);
    if (detailRes.status !== 200) {
      throw new Error(`Detail view failed with status ${detailRes.status}`);
    }
    const detailData = await detailRes.json();
    if (!detailData.data || detailData.data.id !== createdListingId) {
      throw new Error('Detail view returned incorrect listing ID');
    }
    console.log(`✓ Pass: Retrieved detailed listing record: ${detailData.data.route} (${detailData.data.cargoDescription}).\n`);

    // 9. Verify Role-Based Authorization Enforcement (Requirement 6 - Negative Tests)
    console.log('[Test 9] Testing role-based authorization: Shipper B attempting to modify Shipper A listing...');
    const unauthorizedPutRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}`, {
      method: 'PUT',
      headers: headersB, // Shipper B trying to edit Shipper A's listing!
      body: JSON.stringify({
        offeredPrice: 12000,
        notes: 'Malicious modification attempt by another shipper',
      }),
    });

    if (unauthorizedPutRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-shipper modification, got ${unauthorizedPutRes.status}`);
    }
    const putErrMsg = await unauthorizedPutRes.json();
    console.log(`✓ Pass: Cross-shipper modification strictly rejected with 403 Forbidden ("${putErrMsg.message}").`);

    // Shipper B trying to delete Shipper A's listing!
    const unauthorizedDelRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}`, {
      method: 'DELETE',
      headers: headersB,
    });
    if (unauthorizedDelRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-shipper deletion, got ${unauthorizedDelRes.status}`);
    }
    console.log('✓ Pass: Cross-shipper deletion strictly rejected with 403 Forbidden.\n');

    // 10. Verify Authorized Update by Owner (Requirement 2 & 6)
    console.log('[Test 10] Testing authorized update by listing owner (Shipper A)...');
    const updateRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({
        offeredPrice: 26000,
        notes: 'Updated: Fast transit required. Unloading dock confirmed ready.',
      }),
    });
    if (updateRes.status !== 200) {
      throw new Error(`Owner update failed with status ${updateRes.status}`);
    }
    const updateData = await updateRes.json();
    if (updateData.data.offeredPrice !== 26000) {
      throw new Error(`Expected updated price 26000, got ${updateData.data.offeredPrice}`);
    }
    console.log(`✓ Pass: Listing successfully updated by owner. New price: ${updateData.data.offeredPriceFormatted}.\n`);

    // 11. Verify Shipper's "My Listings" Feed (Requirement 2)
    console.log('[Test 11] Testing Shipper A "My Listings" feed (/api/listings/my-listings)...');
    const myA_Res = await fetch(`${BASE_URL}/api/listings/my-listings`, { headers: headersA });
    const myA_Data = await myA_Res.json();
    const hasMine = myA_Data.data.some((l) => l.id === createdListingId);
    if (!hasMine) {
      throw new Error('Owner does not see their listing in /api/listings/my-listings');
    }

    const myB_Res = await fetch(`${BASE_URL}/api/listings/my-listings`, { headers: headersB });
    const myB_Data = await myB_Res.json();
    const bHasMine = myB_Data.data.some((l) => l.id === createdListingId);
    if (bHasMine) {
      throw new Error("Shipper B incorrectly sees Shipper A's listing in their private /my-listings feed");
    }
    console.log(`✓ Pass: Shipper A has ${myA_Data.data.length} listing(s). Shipper B's private feed isolates their own listings.\n`);

    // 12. Verify Status Update Lifecycle (Requirement 1 & 3)
    console.log('[Test 12] Testing status transition to CANCELLED...');
    const statusRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}/status`, {
      method: 'PATCH',
      headers: headersA,
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    if (statusRes.status !== 200) {
      throw new Error(`Status update failed with status ${statusRes.status}`);
    }
    const statusData = await statusRes.json();
    if (statusData.data.status !== 'CANCELLED') {
      throw new Error(`Expected status CANCELLED, got ${statusData.data.status}`);
    }
    console.log(`✓ Pass: Listing status transitioned to: ${statusData.data.status}.\n`);

    // 13. Cleanup Test Data (Requirement 5)
    console.log('[Test 13] Cleaning up test listing record...');
    const delRes = await fetch(`${BASE_URL}/api/listings/${createdListingId}`, {
      method: 'DELETE',
      headers: headersA,
    });
    if (delRes.status !== 200) {
      throw new Error(`Delete failed with status ${delRes.status}`);
    }
    console.log('✓ Pass: Test freight listing cleaned up from MongoDB Atlas.\n');

    console.log('===========================================================');
    console.log('   ALL 13 PHASE 3 FREIGHT LISTINGS TESTS PASSED (100%)     ');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Freight Listings Verification Test Failed:', error.message);
    process.exit(1);
  }
}

runListingsVerification();
