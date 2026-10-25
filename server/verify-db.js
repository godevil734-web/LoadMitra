import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Lead from './models/Lead.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyDatabaseIntegration() {
  console.log('--- RouteWise Pilot MongoDB Atlas Verification ---');
  console.log('Connecting to MongoDB Atlas...');

  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas successfully.');

    // 1. Verify Shipper Lead Creation
    console.log('\n[1/4] Creating test Shipper registration...');
    const shipperLead = await Lead.create({
      role: 'SHIPPER',
      contactName: 'Verification Test Shipper',
      businessName: 'RouteWise Test Logistics Hub',
      phone: '9876543210',
      email: 'verify.shipper@routewise.local',
      primaryRoute: 'Gorakhpur to Lucknow (NH27 Corridor)',
      cargoCategory: 'Packaged Goods',
      shipmentFrequency: 'Daily Shipments',
      consentGranted: true,
    });
    console.log(`✓ Shipper created with ID: ${shipperLead._id}`);

    // 2. Verify Transporter Lead Creation
    console.log('\n[2/4] Creating test Transporter registration...');
    const transporterLead = await Lead.create({
      role: 'TRANSPORTER',
      contactName: 'Verification Test Transporter',
      fleetName: 'RouteWise Express Fleet Carriers',
      phone: '9811223344',
      email: 'verify.transporter@routewise.local',
      vehicleType: '24ft Closed Container (9 - 10 Ton)',
      operatingRoutes: 'Lucknow to Kanpur Return Corridor',
      availableCapacity: '6 Tons Available Payload',
      consentGranted: true,
    });
    console.log(`✓ Transporter created with ID: ${transporterLead._id}`);

    // 3. Verify Retrieval from Atlas
    console.log('\n[3/4] Retrieving saved leads from MongoDB Atlas...');
    const fetchedShipper = await Lead.findById(shipperLead._id);
    const fetchedTransporter = await Lead.findById(transporterLead._id);

    if (!fetchedShipper || !fetchedTransporter) {
      throw new Error('Failed to retrieve saved documents from MongoDB Atlas');
    }

    console.log('✓ Retrieved Shipper:', {
      id: fetchedShipper._id.toString(),
      role: fetchedShipper.role,
      name: fetchedShipper.contactName,
      business: fetchedShipper.businessName,
      route: fetchedShipper.primaryRoute,
      status: fetchedShipper.status,
    });

    console.log('✓ Retrieved Transporter:', {
      id: fetchedTransporter._id.toString(),
      role: fetchedTransporter.role,
      name: fetchedTransporter.contactName,
      fleet: fetchedTransporter.fleetName,
      route: fetchedTransporter.operatingRoutes,
      vehicle: fetchedTransporter.vehicleType,
      status: fetchedTransporter.status,
    });

    // 4. Clean up test records
    console.log('\n[4/4] Cleaning up verification test records...');
    await Lead.deleteMany({
      _id: { $in: [shipperLead._id, transporterLead._id] },
    });
    console.log('✓ Test records cleaned up successfully.');

    console.log('\n======================================================');
    console.log('RESULT: BOTH SHIPPER & TRANSPORTER REGISTRATIONS VERIFIED IN ATLAS!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('\nVerification failed:', error.message);
    if (error.message.includes('whitelist') || error.message.includes('Could not connect to any servers')) {
      console.error('\nNOTE: MongoDB Atlas rejected the connection because your current IP is not in Atlas Network Access whitelist.');
      console.error('Please add your current IP address to MongoDB Atlas: Security > Network Access > Add IP Address.');
    }
    process.exit(1);
  }
}

verifyDatabaseIntegration();
