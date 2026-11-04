import { useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";

const initialAlerts = [
  {
    id: 1,
    type: "SOS",
    severity: "high",
    title: "SOS alert: O+ needed urgently",
    detail: "Kenyatta National Hospital, Nairobi",
    time: "1 hour ago",
    status: "active",
  },
  {
    id: 2,
    type: "Security",
    severity: "high",
    title: "Repeated failed admin logins",
    detail: "5 attempts from one device",
    time: "3 hours ago",
    status: "active",
  },
  {
    id: 3,
    type: "Stock",
    severity: "medium",
    title: "Low stock warning: O-",
    detail: "Critically low in Nairobi",
    time: "1 day ago",
    status: "active",
  },
  {
    id: 4,
    type: "Notification",
    severity: "medium",
    title: "SMS delivery failed",
    detail: "12 reminders failed to deliver",
    time: "1 day ago",
    status: "active",
  },
  {
    id: 5,
    type: "Account",
    severity: "low",
    title: "User reported",
    detail: "Report on account fake77@mailinator.com",
    time: "2 days ago",
    status: "resolved",
  },
];

const filters = ["All", "Active", "Resolved"];

const severityBadge = {
  high: { status: "cancelled", label: "High" },
  medium: { status: "pending", label: "Medium" },
  low: { status: "fulfilled", label: "Low" },
};

const css = `
.sa-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;--mint:#dff5ec;--mint-t:#2e9e6b;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.sa-head h1{margin:0;font-size:22px;color:var(--navy)}
.sa-head p{margin:4px 0 18px;color:var(--muted);font-size:13px}
.sa-notice{background:var(--mint);color:var(--mint-t);padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
.sa-bar{display:flex;gap:8px;margin-bottom:14px}
.sa-tab{border:1px solid var(--border);background:#fff;color:var(--muted);padding:6px 14px;border-radius:999px;font-size:13px;cursor:pointer}
.sa-tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.sa-list{display:flex;flex-direction:column;gap:12px}
.sa-row{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border:1px solid var(--border);border-left:4px solid var(--border);border-radius:14px;padding:14px 18px;flex-wrap:wrap}
.sa-row.high{border-left-color:var(--red)}
.sa-row.medium{border-left-color:#f08c1a}
.sa-row.low{border-left-color:var(--mint-t)}
.sa-row.resolved{opacity:.65}
.sa-info{min-width:240px;flex:1}
.sa-title{font-weight:600;color:var(--navy);margin-bottom:4px}
.sa-meta{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 14px}
.sa-type{background:#ece9fb;color:#6c5ce7;padding:1px 8px;border-radius:999px}
.sa-actions{display:flex;align-items:center;gap:10px}
.sa-btn{border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;border:1px solid var(--border);color:var(--navy)}
.sa-empty{background:#fff;border:1px dashed var(--border);border-radius:14px;padding:28px;text-align:center;color:var(--muted)}
`;

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");

  const resolve = (a) => {
    setAlerts((list) =>
      list.map((x) => (x.id === a.id ? { ...x, status: "resolved" } : x)),
    );
    setNotice(
      `"${a.title}" marked as resolved. Action recorded in the audit log.`,
    );
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const visible = alerts.filter(
    (a) => filter === "All" || a.status === filter.toLowerCase(),
  );

  return (
    <div className="sa-root">
      <style>{css}</style>

      <div className="sa-head">
        <h1>System Alerts</h1>
        <p>Monitor SOS, security, stock and notification alerts.</p>
      </div>

      {notice && <div className="sa-notice">{notice}</div>}

      <div className="sa-bar">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`sa-tab${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <Card title="Alerts" subtitle={`${activeCount} active`}>
        {visible.length === 0 ? (
          <div className="sa-empty">No alerts to show.</div>
        ) : (
          <div className="sa-list">
            {visible.map((a) => (
              <div
                className={`sa-row ${a.severity}${a.status === "resolved" ? " resolved" : ""}`}
                key={a.id}
              >
                <div className="sa-info">
                  <div className="sa-title">{a.title}</div>
                  <div className="sa-meta">
                    <span className="sa-type">{a.type}</span>
                    <span>{a.detail}</span>
                    <span>{a.time}</span>
                  </div>
                </div>
                <div className="sa-actions">
                  <StatusBadge
                    status={severityBadge[a.severity].status}
                    label={severityBadge[a.severity].label}
                  />
                  {a.status === "active" ? (
                    <button
                      type="button"
                      className="sa-btn"
                      onClick={() => resolve(a)}
                    >
                      Mark resolved
                    </button>
                  ) : (
                    <span className="sa-meta">Resolved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
