import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import DonorDashboard from "../pages/DonorDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/donor" element={<DonorDashboard />} />
      {/* Catches everything else until those pages exist */}
      <Route path="*" element={<p style={{ padding: 24 }}>This page is coming soon.</p>} />
    </Routes>
  );
}