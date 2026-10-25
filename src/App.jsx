import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import FreightMarketplace from './components/FreightMarketplace';
import TransporterDashboard from './components/TransporterDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/listings" element={<FreightMarketplace />} />
      <Route path="/marketplace" element={<Navigate to="/listings" replace />} />
      <Route path="/transporter" element={<TransporterDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
