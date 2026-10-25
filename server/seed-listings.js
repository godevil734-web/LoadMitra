import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';
import FreightListing from './models/FreightListing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function seedListings() {
  await connectDB();
  await User.bootstrapDemoShippers();

  const shipper1 = await User.findOne({ email: 'shipper@routewise.in' });
  const shipper2 = await User.findOne({ email: 'shipper2@routewise.in' });

  if (!shipper1 || !shipper2) {
    console.error('Demo shippers not found');
    process.exit(1);
  }

  // Check if active listings already exist
  const existingCount = await FreightListing.countDocuments({ status: 'OPEN' });
  if (existingCount >= 4) {
    console.log(`Atlas already contains ${existingCount} open freight listings. Skipping seeding.`);
    process.exit(0);
  }

  const sampleListings = [
    {
      shipperId: shipper1._id,
      shipperName: shipper1.name,
      businessName: shipper1.businessName,
      contactPhone: shipper1.phone,
      contactEmail: shipper1.email,
      origin: 'Gorakhpur Wholesale Grain Mandi, UP',
      destination: 'Lucknow Transport Nagar, UP',
      cargoCategory: 'Agricultural Goods',
      cargoDescription: '220 bags of processed basmati rice on wooden pallets',
      weight: 11.5,
      weightUnit: 'Tons',
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      offeredPrice: 24500,
      priceType: 'FIXED',
      vehicleRequirements: ['24ft Closed Container (9 - 10 Ton)', '32ft Single-Axle Container (7 - 9 Ton)'],
      notes: 'Loading dock with forklift support available. Morning dispatch 8 AM - 11 AM.',
      status: 'OPEN',
    },
    {
      shipperId: shipper2._id,
      shipperName: shipper2.name,
      businessName: shipper2.businessName,
      contactPhone: shipper2.phone,
      contactEmail: shipper2.email,
      origin: 'Kanpur Industrial Area (Fazalganj), UP',
      destination: 'Varanasi Ring Road Logistics Hub, UP',
      cargoCategory: 'Industrial Goods',
      cargoDescription: 'Structural steel pipes, fasteners, and industrial fittings',
      weight: 15.0,
      weightUnit: 'Tons',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      offeredPrice: 32000,
      priceType: 'NEGOTIABLE',
      vehicleRequirements: ['32ft Multi-Axle Container (14 - 18 Ton)', '40ft Trailer / Flatbed (25 - 32 Ton)'],
      notes: 'Overhead crane available at Kanpur origin. Requires heavy-duty tie-down straps.',
      status: 'OPEN',
    },
    {
      shipperId: shipper1._id,
      shipperName: shipper1.name,
      businessName: shipper1.businessName,
      contactPhone: shipper1.phone,
      contactEmail: shipper1.email,
      origin: 'Lucknow Amausi Warehouse Complex, UP',
      destination: 'Gorakhpur Medical Corridor Hub, UP',
      cargoCategory: 'Packaged Goods',
      cargoDescription: 'Commercial FMCG cartons and non-perishable consumables',
      weight: 7.2,
      weightUnit: 'Tons',
      pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      offeredPrice: 18800,
      priceType: 'FIXED',
      vehicleRequirements: ['19ft - 20ft Container (7 - 8.5 Ton)'],
      notes: 'Return load opportunity along NH27 corridor. Same-day loading.',
      status: 'OPEN',
    },
    {
      shipperId: shipper2._id,
      shipperName: shipper2.name,
      businessName: shipper2.businessName,
      contactPhone: shipper2.phone,
      contactEmail: shipper2.email,
      origin: 'Faizabad / Ayodhya Bypass, UP',
      destination: 'Prayagraj Naini Industrial Area, UP',
      cargoCategory: 'Automotive & Spare Parts',
      cargoDescription: 'Tractor accessories and packaged replacement bearings',
      weight: 4.5,
      weightUnit: 'Tons',
      pickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      offeredPrice: 14200,
      priceType: 'FIXED',
      vehicleRequirements: ['14ft Open Body (3.5 - 4.5 Ton)', '19ft - 20ft Container (7 - 8.5 Ton)'],
      notes: 'Fragile goods: waterproof tarpaulin required if open body.',
      status: 'OPEN',
    },
  ];

  await FreightListing.insertMany(sampleListings);
  console.log(`✓ Successfully seeded ${sampleListings.length} verified freight listings in MongoDB Atlas.`);
  process.exit(0);
}

seedListings().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
