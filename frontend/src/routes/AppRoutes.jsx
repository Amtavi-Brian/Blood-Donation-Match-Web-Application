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
import RoleRoute from "./RoleRoute";
import HospitalPortal from "../pages/hospital/HospitalPortal";
import NotificationsPage from "../pages/shared/NotificationsPage";

function withRole(role, element) {
  return <RoleRoute allowedRoles={[role]}>{element}</RoleRoute>;
}

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

      <Route path="/donor" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/profile" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/availability" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/history" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/sos-alerts" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/reminders" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/settings" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/donor/analytics" element={withRole("donor", <DonorDashboard />)} />
      <Route path="/notifications" element={<RoleRoute allowedRoles={["donor", "hospital_staff", "admin"]}><NotificationsPage /></RoleRoute>} />

      <Route path="/hospital" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/dashboard" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/requests" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/search" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/blood-search" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/stock" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/donations" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/analytics" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/settings" element={withRole("hospital_staff", <HospitalPortal />)} />
      <Route path="/hospital/*" element={withRole("hospital_staff", <HospitalPortal />)} />

      <Route path="/admin" element={withRole("admin", <AdminHomeRoute />)} />
      <Route path="/admin/hospitals" element={withRole("admin", <ManageHospitals />)} />
      <Route path="/admin/users" element={withRole("admin", <ManageUsers />)} />
      <Route path="/admin/verify-hospitals" element={withRole("admin", <VerifyHospitals />)} />
      <Route path="/admin/alerts" element={withRole("admin", <SystemAlerts />)} />
      <Route path="/admin/reports" element={withRole("admin", <AdminReport />)} />
      <Route path="/admin/settings" element={withRole("admin", <AdminSettings />)} />
      <Route path="/admin/*" element={withRole("admin", <ComingSoon page="Admin page not found" />)} />
      <Route path="*" element={<ComingSoon page="Page not found" />} />
    </Routes>
  );
}