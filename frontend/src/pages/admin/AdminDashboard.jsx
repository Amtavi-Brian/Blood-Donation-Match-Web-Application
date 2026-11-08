import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "../../componenets/dashboard/PortalLayout";
import useAuth from "../../context/useAuth";
import { getDashboardReport } from "../../services/reportService";
import { getHospitals } from "../../services/hospitalService";
import { getAuditLogs } from "../../services/adminService";
import "./AdminDashboard.css";

const STATS = [
  { id: "hospitals", key: "total_hospitals", icon: "▦", label: "Total Hospitals", tone: "lavender" },
  { id: "donors", key: "total_donors", icon: "♟", label: "Total Donors", tone: "mint" },
  { id: "alerts", key: "pending_requests", icon: "♧", label: "Active Alerts", tone: "peach" },
];

const NAVIGATION = [
  { label: "Dashboard", icon: "⌂", to: "/admin" },
  { label: "Manage Hospitals", icon: "▦", to: "/admin/hospitals" },
  { label: "Manage Users", icon: "♟", to: "/admin/users" },
  { label: "Verify Hospitals", icon: "◉", to: "/admin/verify-hospitals" },
  { label: "System Alerts", icon: "♧", to: "/admin/alerts" },
  { label: "Reports", icon: "▤", to: "/admin/reports" },
  { label: "Settings", icon: "⚙", to: "/admin/settings" },
];

function timeAgo(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Recently";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function activityIcon(action = "") {
  if (action.includes("failed") || action.includes("sos")) return { icon: "♧", tone: "red" };
  if (action.includes("hospital")) return { icon: "▦", tone: "green" };
  if (action.includes("user") || action.includes("donor")) return { icon: "♟", tone: "blue" };
  return { icon: "✓", tone: "green" };
}

export default function AdminDashboard({ onViewAllApprovals, onViewAllActivity }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getDashboardReport(),
      getHospitals({ verifiedOnly: false }),
      getAuditLogs({ limit: 10 }),
    ])
      .then(([report, hospitals, audit]) => {
        if (!active) return;
        setSummary(report);
        setPendingHospitals(hospitals.filter((hospital) => !hospital.is_verified));
        setActivity(audit.logs);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load administrator dashboard.");
      });
    return () => { active = false; };
  }, []);

  return (
    <PortalLayout
      role="admin"
      userName={user?.full_name || "Admin"}
      userRole="System Admin"
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.full_name || "Admin"}`}
      navigation={NAVIGATION}
      onLogout={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    >
      <div className="admin-dashboard">
        {error && <p className="admin-feedback" role="alert">{error}</p>}

        <section className="admin-stat-grid" aria-label="Key figures">
          {STATS.map((stat) => (
            <article key={stat.id} className={`admin-stat admin-stat--${stat.tone}`}>
              <span className="admin-stat-icon" aria-hidden="true">{stat.icon}</span>
              <div>
                <span className="admin-stat-label">{stat.label}</span>
                <strong className="admin-stat-value">{summary ? summary[stat.key] : "—"}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panels">
          <article className="admin-panel">
            <header className="admin-panel-header">
              <div>
                <h2>Pending Hospital Approvals</h2>
                <span className="admin-panel-accent" />
              </div>
              <button type="button" onClick={onViewAllApprovals}>View all</button>
            </header>
            {pendingHospitals.length ? (
              <div className="admin-approval-list">
                {pendingHospitals.slice(0, 4).map((hospital) => (
                  <div className="admin-approval-row" key={hospital.id}>
                    <span className="admin-row-icon is-pending" aria-hidden="true">▦</span>
                    <strong>{hospital.name}</strong>
                    <span className="admin-pending-badge">Pending</span>
                  </div>
                ))}
              </div>
            ) : <p className="admin-empty">No hospitals are waiting for approval.</p>}
          </article>

          <article className="admin-panel">
            <header className="admin-panel-header">
              <div>
                <h2>Recent System Activity</h2>
                <span className="admin-panel-accent" />
              </div>
              <button type="button" onClick={onViewAllActivity} aria-label="View all system activity">···</button>
            </header>
            {activity.length ? (
              <div className="admin-activity-list">
                {activity.slice(0, 4).map((entry) => {
                  const icon = activityIcon(entry.action);
                  return (
                    <div className="admin-activity-row" key={entry.audit_id}>
                      <span className={`admin-row-icon is-${icon.tone}`} aria-hidden="true">{icon.icon}</span>
                      <div>
                        <strong>{entry.description}</strong>
                        <small>{timeAgo(entry.created_at)}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="admin-empty">No recent system activity is available.</p>}
          </article>
        </section>
      </div>
    </PortalLayout>
  );
}
