import { useEffect, useState } from "react";
import StatusBadge from "../../componenets/ui/StatusBadge";
import { getDashboardReport } from "../../services/reportService";
import { getHospitals } from "../../services/hospitalService";
import { getAuditLogs } from "../../services/adminService";

const STATS = [
  {
    id: "hospitals",
    key: "total_hospitals",
    icon: "🏥",
    label: "Total Hospitals",
    tone: "lavender",
  },
  { id: "donors", key: "total_donors", icon: "👥", label: "Total Donors", tone: "mint" },
  { id: "alerts", key: "pending_requests", icon: "🔔", label: "Pending Requests", tone: "peach" },
];

const css = `
.ad {
  --ad-navy: #0b2142;
  --ad-red: #d0101e;
  --ad-text: #1c2430;
  --ad-muted: #7a8494;
  --ad-border: #eceff4;
  --ad-lavender: #ece9fb;
  --ad-lavender-ink: #6c5ce7;
  --ad-mint: #dff5ec;
  --ad-mint-ink: #2e9e6b;
  --ad-peach: #fdeedd;
  --ad-peach-ink: #f08c1a;
  padding: 24px;
  background: #f6f7fb;
  min-height: 100vh;
  color: var(--ad-text);
  display: grid;
  gap: 20px;
  align-content: start;
}
.ad__title { margin: 0; font-size: 22px; font-weight: 700; color: var(--ad-navy); }
.ad__welcome { margin: 4px 0 0; font-size: 14px; color: var(--ad-muted); }

.ad__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.ad__stat { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 14px; }
.ad__stat--lavender { background: var(--ad-lavender); }
.ad__stat--mint { background: var(--ad-mint); }
.ad__stat--peach { background: var(--ad-peach); }
.ad__stat-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; background: #fff; }
.ad__stat--lavender .ad__stat-label { color: var(--ad-lavender-ink); }
.ad__stat--mint .ad__stat-label { color: var(--ad-mint-ink); }
.ad__stat--peach .ad__stat-label { color: var(--ad-peach-ink); }
.ad__stat-label { display: block; font-size: 12px; font-weight: 600; }
.ad__stat-value { display: block; font-size: 26px; font-weight: 700; color: var(--ad-navy); line-height: 1.2; }

.ad__panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
.ad__panel { background: #fff; border: 1px solid var(--ad-border); border-radius: 14px; padding: 18px; }
.ad__panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ad__panel-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--ad-navy); }
.ad__link { border: none; background: none; padding: 0; font-size: 12px; font-weight: 600; color: var(--ad-red); cursor: pointer; }

.ad__row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--ad-border); }
.ad__row:last-child { border-bottom: none; }
.ad__row-main { display: flex; align-items: center; gap: 12px; }
.ad__avatar { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: #fdecec; color: var(--ad-red); font-size: 15px; }
.ad__name { margin: 0; font-size: 14px; font-weight: 600; }
.ad__time { margin: 2px 0 0; font-size: 12px; color: var(--ad-muted); }
.ad__act-icon { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; }
.ad__act-icon--green { background: #dff5ec; color: var(--ad-mint-ink); }
.ad__act-icon--red { background: #fdecec; color: var(--ad-red); }
.ad__act-icon--blue { background: #e6f0ff; color: #2f6fe4; }
.ad__empty { text-align: center; color: var(--ad-muted); font-size: 14px; padding: 20px 0; }
`;

function AdminDashboard({ onViewAllApprovals, onViewAllActivity }) {
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
    <main className="ad">
      <style>{css}</style>

      <header>
        <h1 className="ad__title">Admin Dashboard</h1>
        <p className="ad__welcome">Welcome, Admin</p>
      </header>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <section className="ad__stats" aria-label="Key figures">
        {STATS.map((s) => (
          <article key={s.id} className={`ad__stat ad__stat--${s.tone}`}>
            <div className="ad__stat-icon" aria-hidden="true">
              {s.icon}
            </div>
            <div>
              <span className="ad__stat-label">{s.label}</span>
              <strong className="ad__stat-value">{summary ? summary[s.key] : "—"}</strong>
            </div>
          </article>
        ))}
      </section>

      <div className="ad__panels">
        <section className="ad__panel" aria-label="Pending hospital approvals">
          <div className="ad__panel-head">
            <h2 className="ad__panel-title">Pending Hospital Approvals</h2>
            <button
              type="button"
              className="ad__link"
              onClick={onViewAllApprovals}
            >
              View all
            </button>
          </div>

          {pendingHospitals.length === 0 ? (
            <p className="ad__empty">No hospitals waiting for approval.</p>
          ) : (
            pendingHospitals.slice(0, 5).map((h) => (
              <div key={h.id} className="ad__row">
                <div className="ad__row-main">
                  <span className="ad__avatar" aria-hidden="true">
                    🏥
                  </span>
                  <p className="ad__name">{h.name}</p>
                </div>
                <StatusBadge status="pending" label="Pending" />
              </div>
            ))
          )}
        </section>

        <section className="ad__panel" aria-label="Recent system activity">
          <div className="ad__panel-head">
            <h2 className="ad__panel-title">Recent System Activity</h2>
            <button
              type="button"
              className="ad__link"
              onClick={onViewAllActivity}
            >
              View all
            </button>
          </div>

          {activity.map((entry) => (
            (() => {
              const a = {
                id: entry.audit_id,
                icon: entry.action.includes("hospital") ? "🏥" : "👤",
                tone: entry.action.includes("failed") ? "red" : "green",
                title: entry.description,
                time: new Date(entry.created_at).toLocaleString(),
              };
              return (
            <div key={a.id} className="ad__row">
              <div className="ad__row-main">
                <span
                  className={`ad__act-icon ad__act-icon--${a.tone}`}
                  aria-hidden="true"
                >
                  {a.icon}
                </span>
                <div>
                  <p className="ad__name">{a.title}</p>
                  <p className="ad__time">{a.time}</p>
                </div>
              </div>
            </div>
              );
            })()
          ))}
          {activity.length === 0 && <p className="ad__empty">No recent activity is available.</p>}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
