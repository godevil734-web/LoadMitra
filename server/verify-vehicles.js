import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Lead, { VEHICLE_TYPES } from './models/Lead.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5050}`;

async function runVehicleVerification() {
  console.log('===========================================================');
  console.log('   RouteWise Vehicle Visual Selection Verification Suite   ');
  console.log('===========================================================');
  console.log(`Target Backend: ${BASE_URL}\n`);

  const createdLeadIds = [];

  try {
    await connectDB();

    // 1. Test All 12 Visual Categories in VEHICLE_TYPES enum
    console.log('[Test 1] Verifying all 12 requested visual vehicle categories exist in backend schema...');
    const requested12 = [
      'Mini Truck / Tata Ace',
      'Pickup Truck',
      'Light Commercial Vehicle (LCV)',
      'Medium Commercial Truck',
      'Heavy-Duty Truck',
      'Open Body Truck',
      'Closed Container Truck',
      'Refrigerated Truck',
      'Trailer / Multi-Axle Truck',
      'Flatbed Truck',
      'Tanker',
      'Tipper / Dumper',
    ];

    for (const cat of requested12) {
      if (!VEHICLE_TYPES.includes(cat)) {
        throw new Error(`Category "${cat}" is missing from VEHICLE_TYPES enum in Lead.js`);
      }
    }
    console.log(`✓ Pass: All 12 visual categories verified in Mongoose schema enum (${requested12.length} types).\n`);

    // 2. Test Transporter Registration with Visual Category and Configured Capacity
    console.log('[Test 2] Submitting Transporter registration with "Mini Truck / Tata Ace" (1.2 Tons)...');
    const miniTruckRes = await fetch(`${BASE_URL}/api/pilot/transporter-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'TRANSPORTER',
        contactName: 'Harpreet Singh (Tata Ace)',
        fleetName: 'Singh Urban Logistics Express',
        phone: '9876543210',
        email: 'harpreet.singh@ace.local',
        vehicleType: 'Mini Truck / Tata Ace',
        operatingRoutes: 'Gorakhpur City & Intra-district Mandis',
        actualCapacity: 1.25,
        capacityUnit: 'Tons',
        availableCapacity: '1.25 Tons (Approximate, Configured)',
        vehicleCategories: ['Mini Truck / Tata Ace'],
        consentGranted: true,
      }),
    });

    if (miniTruckRes.status !== 201) {
      const err = await miniTruckRes.text();
      throw new Error(`Mini truck registration failed with status ${miniTruckRes.status}: ${err}`);
    }

    const miniTruckData = await miniTruckRes.json();
    createdLeadIds.push(miniTruckData.data.id);
    console.log(`✓ Pass: Registered successfully (ID: ${miniTruckData.data.id})`);
    console.log(`  - Vehicle: ${miniTruckData.data.vehicleType}`);
    console.log(`  - Configured Capacity: ${miniTruckData.data.actualCapacity} ${miniTruckData.data.capacityUnit}`);
    console.log(`  - Stored Description: "${miniTruckData.data.availableCapacity}"\n`);

    // 3. Test Specialized Body Registration (Refrigerated Truck Reefer)
    console.log('[Test 3] Submitting Transporter registration with specialized "Refrigerated Truck"...');
    const reeferRes = await fetch(`${BASE_URL}/api/pilot/transporter-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'TRANSPORTER',
        contactName: 'Virendra Yadav (Reefer Cold Chain)',
        fleetName: 'Awadh Cold Logistics Pvt Ltd',
        phone: '9822334455',
        vehicleType: 'Refrigerated Truck',
        operatingRoutes: 'Lucknow–Kanpur–Faizabad Dairy Belts',
        actualCapacity: 8.5,
        capacityUnit: 'Tons',
        availableCapacity: '8.5 Tons (-20C to +15C Temperature Controlled)',
        consentGranted: true,
      }),
    });

    if (reeferRes.status !== 201) {
      throw new Error(`Reefer registration failed with status ${reeferRes.status}`);
    }

    const reeferData = await reeferRes.json();
    createdLeadIds.push(reeferData.data.id);
    console.log(`✓ Pass: Specialized vehicle registered (ID: ${reeferData.data.id}): ${reeferData.data.vehicleType} (${reeferData.data.actualCapacity} Tons).\n`);

    // 4. Test Multi-Vehicle Fleet Registration (Requirement 6)
    console.log('[Test 4] Submitting Multi-Vehicle Fleet Transporter Registration...');
    const multiFleetRes = await fetch(`${BASE_URL}/api/pilot/transporter-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'TRANSPORTER',
        contactName: 'Naveen Chauhan (Multi-Fleet Owner)',
        fleetName: 'Chauhan Heavy Interstate Carriers',
        phone: '9833445566',
        vehicleType: 'Trailer / Multi-Axle Truck',
        operatingRoutes: 'NH27 / NH19 Golden Quadrilateral Links',
        actualCapacity: 32.0,
        capacityUnit: 'Tons',
        vehicleCategories: [
          'Trailer / Multi-Axle Truck',
          'Flatbed Truck',
          'Heavy-Duty Truck',
        ],
        multiVehicleFleet: [
          { name: 'Trailer / Multi-Axle Truck', capacity: 32.0 },
          { name: 'Flatbed Truck', capacity: 25.0 },
          { name: 'Heavy-Duty Truck', capacity: 20.0 },
        ],
        consentGranted: true,
      }),
    });

    if (multiFleetRes.status !== 201) {
      throw new Error(`Multi-fleet registration failed with status ${multiFleetRes.status}`);
    }

    const multiFleetData = await multiFleetRes.json();
    createdLeadIds.push(multiFleetData.data.id);
    console.log(`✓ Pass: Multi-vehicle fleet registered:`);
    console.log(`  - Primary Vehicle: ${multiFleetData.data.vehicleType}`);
    console.log(`  - Fleet Categories (${multiFleetData.data.vehicleCategories.length}):`, multiFleetData.data.vehicleCategories);
    console.log(`  - Multi-fleet objects stored:`, multiFleetData.data.multiVehicleFleet.length, '\n');

    // 5. Test Direct MongoDB Atlas Persistence & Field Integrity
    console.log('[Test 5] Verifying documents directly in MongoDB Atlas...');
    const atlasDoc = await Lead.findById(miniTruckData.data.id);
    if (!atlasDoc) {
      throw new Error(`Document ${miniTruckData.data.id} not found in Atlas`);
    }
    if (atlasDoc.vehicleType !== 'Mini Truck / Tata Ace') {
      throw new Error(`Atlas vehicleType mismatch: expected "Mini Truck / Tata Ace", got "${atlasDoc.vehicleType}"`);
    }
    if (atlasDoc.actualCapacity !== 1.25) {
      throw new Error(`Atlas actualCapacity mismatch: expected 1.25, got ${atlasDoc.actualCapacity}`);
    }
    console.log('✓ Pass: Verified document directly in Atlas database with matching vehicle category & capacity fields.\n');

    // 6. Test Backwards Compatibility with Legacy Vehicle Type
    console.log('[Test 6] Testing backwards compatibility with legacy vehicle type "24ft Closed Container (9 - 10 Ton)"...');
    const legacyRes = await fetch(`${BASE_URL}/api/pilot/transporter-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'TRANSPORTER',
        contactName: 'Ramesh Legacy Transporter',
        phone: '9844556677',
        vehicleType: '24ft Closed Container (9 - 10 Ton)',
        operatingRoutes: 'Lucknow to Gorakhpur',
        consentGranted: true,
      }),
    });
    if (legacyRes.status !== 201) {
      throw new Error(`Legacy vehicle registration failed with status ${legacyRes.status}`);
    }
    const legacyData = await legacyRes.json();
    createdLeadIds.push(legacyData.data.id);
    console.log(`✓ Pass: Legacy vehicle type processed and saved successfully without errors.\n`);

    // 7. Negative Test: Reject Invalid Vehicle Type String
    console.log('[Test 7] Testing rejection of invalid vehicle category string...');
    const invalidVehicleRes = await fetch(`${BASE_URL}/api/pilot/transporter-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'TRANSPORTER',
        contactName: 'Invalid Vehicle Test',
        phone: '9855667788',
        vehicleType: 'FlyingSaucerCargoCarrier',
        operatingRoutes: 'Space Route',
        consentGranted: true,
      }),
    });
    if (invalidVehicleRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for invalid vehicle type, got ${invalidVehicleRes.status}`);
    }
    const invalidErr = await invalidVehicleRes.json();
    console.log(`✓ Pass: Invalid vehicle string rejected with 400 Bad Request ("${invalidErr.errors?.vehicleType}").\n`);

    // 8. Cleanup Test Records from MongoDB Atlas
    console.log('[Test 8] Cleaning up test records from MongoDB Atlas...');
    for (const id of createdLeadIds) {
      await Lead.findByIdAndDelete(id);
    }
    console.log(`✓ Pass: Cleaned up ${createdLeadIds.length} test records from Atlas.\n`);

    console.log('===========================================================');
    console.log('   ALL 8 VEHICLE VISUAL SELECTION TESTS PASSED (100%)      ');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Vehicle Selection Verification Failed:', error.message);
    process.exit(1);
  }
}

runVehicleVerification();
