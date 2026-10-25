# RouteWise — Phase 1.1

**Smart Logistics. Better Journeys.**

RouteWise is a logistics marketplace connecting businesses that need to ship goods with transporters who have available vehicle capacity. This repository contains the Phase 1.1 landing page — the first customer-facing build.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser
#    → http://localhost:5173
```

## Production Build

```bash
npm run build     # output → dist/
npm run preview   # preview the production build locally
```

---

## Technology Stack

| Layer        | Tool                         |
| ------------ | ---------------------------- |
| Framework    | React 19 (JavaScript)        |
| Build Tool   | Vite 8                       |
| Styling      | Tailwind CSS v4              |
| Routing      | React Router DOM v7          |
| Icons        | Lucide React                 |
| Fonts        | Plus Jakarta Sans, Inter     |

The architecture is designed to integrate with a future **Node.js + Express + MongoDB + Mongoose** backend.

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Sticky responsive navigation
│   ├── HeroSection.jsx         # Hero headline, CTAs, truck visual
│   ├── RouteAnimation.jsx      # Animated SVG route corridor
│   ├── TransportSearch.jsx     # Transport search panel with validation
│   ├── BenefitsSection.jsx     # 4 core platform benefits
│   ├── HowItWorks.jsx          # 4-step workflow process
│   ├── BusinessSection.jsx     # Shipper-focused value proposition
│   ├── TransporterSection.jsx  # Transporter-focused value proposition
│   ├── SampleListings.jsx      # 3 illustrative transport listings
│   ├── PilotRegistration.jsx   # Shipper & Transporter enquiry forms
│   ├── Footer.jsx              # Site footer with links
│   ├── SignInModal.jsx         # Coming-soon auth placeholder
│   ├── Logo.jsx                # Brand logo and wordmark
│   └── ImageWithFallback.jsx   # Resilient image loading
├── data/
│   └── sampleData.js           # Cargo types, vehicle types, sample listings
├── hooks/
│   └── useScrollReveal.js      # IntersectionObserver scroll-reveal hook
├── index.css                   # Tailwind v4 config + brand tokens + animations
├── App.jsx                     # Root component assembling all sections
└── main.jsx                    # Entry point with BrowserRouter
```

---

## Landing Page Sections

| Section              | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| **Navbar**           | Sticky nav with logo, links, Sign In, and Get Started CTA              |
| **Hero**             | Headline, CTAs, freight truck photo, route animation                   |
| **Transport Search** | Pickup, destination, date, cargo type with validation + demo feedback  |
| **Core Benefits**    | Shared Loads, Return Loads, Reliable Coordination, Better Utilisation  |
| **How It Works**     | 4-step: Post → Match → Confirm → Move                                 |
| **For Businesses**   | Warehouse photo, shipper value props, Find Transport CTA               |
| **For Transporters** | Fleet photo, transporter value props, Join as Transporter CTA          |
| **Sample Listings**  | 3 illustrative corridor listings (clearly marked as non-live)          |
| **Pilot Registration** | Shipper + Transporter forms with validation and preview simulation  |
| **Footer**           | Logo, product links, audience links, contact info                      |

---

## Animations & Interactions

- **Hero entrance**: Fade-in with upward motion on headline, staggered CTAs
- **Route animation**: SVG truck icon animates along a dotted freight route path
- **Scroll reveals**: Sections fade in as they enter the viewport (IntersectionObserver)
- **Hover effects**: Buttons, cards, and nav links have smooth transitions
- **Prefers-reduced-motion**: All animations disabled for users who prefer reduced motion

---

## Preview-Only Forms

Both the **Shipper Enquiry** and **Transporter Enquiry** forms are interactive but **preview-only**:

- Form validation runs fully on the client
- Successful submission displays the structured JSON payload that would be sent to the Express API
- **No backend is configured** — no data is transmitted or stored
- The UI explicitly communicates this to the user at every step

This is by design for Phase 1.1. The forms produce a `POST /api/pilot/shipper-registration` or `POST /api/pilot/transporter-registration` compatible payload ready for Phase 2 backend integration.

---

## Known Limitations

1. **No authentication** — Sign In opens a "Coming Soon" modal
2. **No backend / database** — forms are client-side validation only
3. **No live transport availability** — search returns demo feedback
4. **Sample listings are illustrative** — not real verified transporters
5. **Hero image relies on Unsplash** — falls back gracefully if offline
6. **No matching engine** — load matching is a future capability

---

## Recommended Next Milestone (Phase 2)

1. **Express.js API** — `/api/pilot/shipper-registration` and `/api/pilot/transporter-registration` endpoints
2. **MongoDB + Mongoose** — persist pilot registrations and search queries
3. **JWT Authentication** — Sign In / Sign Up with secure token management
4. **Shipper Dashboard** — post shipments, view matches
5. **Transporter Dashboard** — publish trips, receive requests
6. **Admin Panel** — manual coordination during early pilot

---

## License

Private. All rights reserved.
