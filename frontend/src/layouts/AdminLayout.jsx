import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import PortalLayout from "../componenets/dashboard/PortalLayout";
import useAuth from "../context/useAuth";
import { getUnreadNotificationCount } from "../services/notificationService";

const NAVIGATION = [
  { label: "Dashboard", icon: "⌂", to: "/admin" },
  { label: "Manage Hospitals", icon: "▦", to: "/admin/hospitals" },
  { label: "Manage Users", icon: "♟", to: "/admin/users" },
  { label: "Verify Hospitals", icon: "◉", to: "/admin/verify-hospitals" },
  { label: "System Alerts", icon: "♧", to: "/admin/alerts" },
  { label: "Reports", icon: "▤", to: "/admin/reports" },
  { label: "Settings", icon: "⚙", to: "/admin/settings" },
];

const PAGE_META = {
  "/admin": { title: "Admin Dashboard", subtitle: "System overview and key performance figures" },
  "/admin/hospitals": { title: "Manage Hospitals", subtitle: "Register hospitals, review status, and authorize staff" },
  "/admin/users": { title: "Manage Users", subtitle: "Manage user accounts and staff access" },
  "/admin/verify-hospitals": { title: "Verify Hospitals", subtitle: "Review and approve hospital accounts" },
  "/admin/alerts": { title: "System Alerts & Audit", subtitle: "Review recorded system events and audit trail" },
  "/admin/reports": { title: "System Reports", subtitle: "Live aggregate metrics from the BloodLink API" },
  "/admin/settings": { title: "System Settings", subtitle: "Configuration and access controls" },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    getUnreadNotificationCount()
      .then((count) => { if (active) setUnreadCount(count); })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  const cleanPath = pathname.replace(/\/+$/, "") || "/admin";
  const meta = PAGE_META[cleanPath] || {
    title: "Admin Portal",
    subtitle: `Signed in as ${user?.full_name || "Admin"}`,
  };

  return (
    <PortalLayout
      role="admin"
      userName={user?.full_name || "Admin"}
      userRole="System Admin"
      title={meta.title}
      subtitle={meta.subtitle}
      navigation={NAVIGATION}
      notificationCount={unreadCount}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    >
      <Outlet />
    </PortalLayout>
  );
}
