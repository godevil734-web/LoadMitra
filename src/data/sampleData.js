export const CARGO_TYPES = [
  'General Goods',
  'Agricultural Goods',
  'Packaged Goods',
  'Industrial Goods',
  'Automotive & Spare Parts',
  'Textiles & Garments',
  'Other'
];

export const VEHICLE_TYPES = [
  // 12 Visual Selection Categories:
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
  // Preserved Legacy Options:
  '14ft Open Body (3.5 - 4.5 Ton)',
  '19ft - 20ft Container (7 - 8.5 Ton)',
  '24ft Closed Container (9 - 10 Ton)',
  '32ft Single-Axle Container (7 - 9 Ton)',
  '32ft Multi-Axle Container (14 - 18 Ton)',
  '40ft Trailer / Flatbed (25 - 32 Ton)',
  'Other / Custom Fleet'
];

export const SHIPMENT_FREQUENCIES = [
  'Daily Shipments',
  '2 - 3 Times per Week',
  'Weekly',
  'Bi-weekly / Monthly',
  'Occasional / On-demand'
];

export const CORE_BENEFITS = [
  {
    id: 'shared-loads',
    title: 'Shared Loads',
    tagline: 'Save Shipping Costs',
    description: 'Share vehicle space with compatible goods along the same route and pay only for the space you need.',
    icon: 'Boxes',
    accentColor: 'amber'
  },
  {
    id: 'return-loads',
    title: 'Return Loads',
    tagline: 'No Empty Trips',
    description: 'Transport partners find loads for return journeys so vehicles never travel empty.',
    icon: 'ArrowLeftRight',
    accentColor: 'navy'
  },
  {
    id: 'reliable-coordination',
    title: 'Direct Price Offers',
    tagline: 'No Middlemen',
    description: 'Deal directly with verified transport partners without hidden broker commissions.',
    icon: 'ShieldCheck',
    accentColor: 'navy'
  },
  {
    id: 'better-utilisation',
    title: 'Simple Booking Progress',
    tagline: 'Track Every Step',
    description: 'Follow your booking from pickup to delivery receipt with clear, real-time updates.',
    icon: 'Gauge',
    accentColor: 'navy'
  }
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Post Your Load',
    description: 'Enter your pickup location, drop city, cargo weight, and preferred loading date.',
    icon: 'FileText'
  },
  {
    step: '02',
    title: 'Receive Price Offers',
    description: 'Transport partners with available vehicles send direct price offers for your load.',
    icon: 'Search'
  },
  {
    step: '03',
    title: 'Confirm Booking',
    description: 'Review price offers, choose the best partner, and confirm your booking with one click.',
    icon: 'CheckCircle2'
  },
  {
    step: '04',
    title: 'Track & Finish Delivery',
    description: 'Stay updated while your goods are on the way, and get a digital delivery receipt upon arrival.',
    icon: 'Truck'
  }
];

export const SAMPLE_LISTINGS = [
  {
    id: 'RTW-UP-01',
    origin: 'Gorakhpur (GIDA Industrial Area)',
    destination: 'Lucknow (Transport Nagar Hub)',
    routeDistance: '272 km via NH27 (Illustrative corridor)',
    departureWindow: 'Morning Dispatch Window (Illustrative)',
    vehicleType: '32ft Multi-Axle Container (14T)',
    cargoCategory: 'Packaged Hardware & Agri-Tools',
    availableCapacity: '4.8 Tons / 38% Payload Free',
    loadType: 'Compatible Shared Load',
    badgeText: 'SHARED LOAD OPPORTUNITY',
    badgeVariant: 'amber',
    status: 'Corridor Evaluation',
    indicativeRange: '₹1,600 - ₹1,950 / Ton (Indicative Estimate)',
    disclaimer: 'Illustrative demo data — not live availability. Example route only, not confirmed operating route.'
  },
  {
    id: 'RTW-UP-02',
    origin: 'Lucknow (Amausi / Nadarganj)',
    destination: 'Kanpur (Panki Industrial Belt)',
    routeDistance: '85 km via NH27 Corridor (Illustrative corridor)',
    departureWindow: 'Afternoon Return Slot (Illustrative)',
    vehicleType: '24ft Closed Container (9T)',
    cargoCategory: 'Industrial Supplies & FMCG',
    availableCapacity: 'Return Trip Capacity (9 Tons)',
    loadType: 'Return Load Available',
    badgeText: 'RETURN RUN OPPORTUNITY',
    badgeVariant: 'blue',
    status: 'Return Corridor',
    indicativeRange: 'Competitive Shared Return Rate (Indicative)',
    disclaimer: 'Illustrative demo data — not live availability. Example route only, not confirmed operating route.'
  },
  {
    id: 'RTW-UP-03',
    origin: 'Varanasi (Ramnagar Industrial Area)',
    destination: 'Gorakhpur (Transport Hub)',
    routeDistance: '210 km via NH24 / NH27 (Illustrative corridor)',
    departureWindow: 'Midday Dispatch Window (Illustrative)',
    vehicleType: '20ft Medium Container (7.5T)',
    cargoCategory: 'Textiles & Finished Goods',
    availableCapacity: '2.8 Tons Available Space',
    loadType: 'Partial Shared Capacity',
    badgeText: 'PARTIAL CAPACITY',
    badgeVariant: 'amber',
    status: 'Corridor Evaluation',
    indicativeRange: '₹1,800 - ₹2,200 / Ton (Indicative Estimate)',
    disclaimer: 'Illustrative demo data — not live availability. Example route only, not confirmed operating route.'
  }
];
