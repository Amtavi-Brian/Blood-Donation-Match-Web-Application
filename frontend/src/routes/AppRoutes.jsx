import { Routes, Route, Link, useNavigate } from "react-router-dom";
import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import DonorDashboard from "../pages/DonorDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminReport from "../pages/admin/AdminReport";
import AdminSettings from "../pages/admin/AdminSettings";
import ManageHospitals from "../pages/admin/ManageHospitals";
import ManageUsers from "../pages/admin/ManageUsers";
import SystemAlerts from "../pages/admin/SystemAlerts";
import VerifyHospitals from "../pages/admin/VerifyHospitals";

function ComingSoon({ page }) {
  return (
    <main style={{ maxWidth: 680, margin: "12vh auto", padding: 24, textAlign: "center" }}>
      <p style={{ color: "#c8102e", fontWeight: 700 }}>BLOODLINK</p>
      <h1>{page}</h1>
      <p>This page is not available yet.</p>
      <Link to="/" style={{ color: "#c8102e" }}>Return to home</Link>
    </main>
  );
}

function AdminHomeRoute() {
  const navigate = useNavigate();

  return (
    <AdminDashboard
      onViewAllApprovals={() => navigate("/admin/verify-hospitals")}
      onViewAllActivity={() => navigate("/admin/alerts")}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/donor" element={<DonorDashboard />} />
      <Route path="/donor/profile" element={<DonorDashboard />} />
      <Route path="/donor/availability" element={<DonorDashboard />} />
      <Route path="/donor/history" element={<DonorDashboard />} />
      <Route path="/donor/sos-alerts" element={<DonorDashboard />} />
      <Route path="/donor/reminders" element={<DonorDashboard />} />
      <Route path="/donor/settings" element={<DonorDashboard />} />
      <Route path="/donor/analytics" element={<DonorDashboard />} />
      <Route path="/notifications" element={<ComingSoon page="Notifications" />} />

      <Route path="/hospital" element={<ComingSoon page="Hospital portal" />} />
      <Route path="/hospital/dashboard" element={<ComingSoon page="Hospital dashboard" />} />
      <Route path="/hospital/requests" element={<ComingSoon page="Blood requests" />} />
      <Route path="/hospital/search" element={<ComingSoon page="Donor search" />} />
      <Route path="/hospital/blood-search" element={<ComingSoon page="Blood search" />} />
      <Route path="/hospital/stock" element={<ComingSoon page="Blood stock" />} />
      <Route path="/hospital/donations" element={<ComingSoon page="Record donation" />} />
      <Route path="/hospital/analytics" element={<ComingSoon page="Hospital analytics" />} />
      <Route path="/hospital/settings" element={<ComingSoon page="Hospital settings" />} />
      <Route path="/hospital/*" element={<ComingSoon page="Hospital portal" />} />

      <Route path="/admin" element={<AdminHomeRoute />} />
      <Route path="/admin/hospitals" element={<ManageHospitals />} />
      <Route path="/admin/users" element={<ManageUsers />} />
      <Route path="/admin/verify-hospitals" element={<VerifyHospitals />} />
      <Route path="/admin/alerts" element={<SystemAlerts />} />
      <Route path="/admin/reports" element={<AdminReport />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/*" element={<ComingSoon page="Admin page not found" />} />
      <Route path="*" element={<ComingSoon page="Page not found" />} />
    </Routes>
  );
}