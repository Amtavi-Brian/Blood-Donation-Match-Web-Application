import { useState } from "react";
import Card from "../../componenets/ui/Card";

const ranges = {
  "7 days": {
    stats: [
      { label: "New Donors", value: 38 },
      { label: "Blood Requests", value: 21 },
      { label: "Donations Recorded", value: 17 },
      { label: "SOS Alerts", value: 4 },
    ],
    bloodDemand: [
      { type: "O+", pct: 32 },
      { type: "A+", pct: 21 },
      { type: "B+", pct: 18 },
      { type: "O-", pct: 12 },
      { type: "A-", pct: 9 },
      { type: "AB+", pct: 8 },
    ],
    notifications: [
      { label: "Delivered", value: 142 },
      { label: "Submitted", value: 18 },
      { label: "Queued", value: 6 },
      { label: "Failed", value: 9 },
      { label: "Unknown", value: 3 },
    ],
  },
  "30 days": {
    stats: [
      { label: "New Donors", value: 164 },
      { label: "Blood Requests", value: 96 },
      { label: "Donations Recorded", value: 71 },
      { label: "SOS Alerts", value: 15 },
    ],
    bloodDemand: [
      { type: "O+", pct: 30 },
      { type: "A+", pct: 22 },
      { type: "B+", pct: 17 },
      { type: "O-", pct: 13 },
      { type: "A-", pct: 10 },
      { type: "AB+", pct: 8 },
    ],
    notifications: [
      { label: "Delivered", value: 610 },
      { label: "Submitted", value: 54 },
      { label: "Queued", value: 12 },
      { label: "Failed", value: 37 },
      { label: "Unknown", value: 11 },
    ],
  },
};

const css = `
.ar-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.ar-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.ar-head h1{margin:0;font-size:22px;color:var(--navy)}
.ar-head p{margin:4px 0 0;color:var(--muted);font-size:13px}
.ar-tabs{display:flex;gap:8px}
.ar-tab{border:1px solid var(--border);background:#fff;color:var(--muted);padding:6px 14px;border-radius:999px;font-size:13px;cursor:pointer}
.ar-tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.ar-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:18px}
.ar-stat{background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px}
.ar-stat span{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.ar-stat strong{font-size:26px;color:var(--navy)}
.ar-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.ar-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px}
.ar-bar-label{width:64px;color:var(--text);flex-shrink:0}
.ar-track{flex:1;height:10px;background:var(--border);border-radius:999px;overflow:hidden}
.ar-fill{height:100%;background:var(--red);border-radius:999px}
.ar-fill.navy{background:var(--navy)}
.ar-val{width:44px;text-align:right;color:var(--muted);flex-shrink:0}
.ar-note{margin-top:14px;font-size:12px;color:var(--muted)}
`;

export default function AdminReport() {
  const [range, setRange] = useState("7 days");
  const data = ranges[range];
  const maxNotif = Math.max(...data.notifications.map((n) => n.value));

  return (
    <div className="ar-root">
      <style>{css}</style>

      <div className="ar-head">
        <div>
          <h1>Reports</h1>
          <p>System-wide activity summary. Aggregate figures only.</p>
        </div>
        <div className="ar-tabs">
          {Object.keys(ranges).map((r) => (
            <button
              key={r}
              type="button"
              className={`ar-tab${range === r ? " active" : ""}`}
              onClick={() => setRange(r)}
            >
              Last {r}
            </button>
          ))}
        </div>
      </div>

      <div className="ar-stats">
        {data.stats.map((s) => (
          <div className="ar-stat" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      <div className="ar-grid">
        <Card title="Blood Types in Demand" subtitle="Share of requests">
          {data.bloodDemand.map((b) => (
            <div className="ar-bar-row" key={b.type}>
              <span className="ar-bar-label">{b.type}</span>
              <div className="ar-track">
                <div className="ar-fill" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="ar-val">{b.pct}%</span>
            </div>
          ))}
        </Card>

        <Card title="Notification Delivery" subtitle="By status">
          {data.notifications.map((n) => (
            <div className="ar-bar-row" key={n.label}>
              <span className="ar-bar-label">{n.label}</span>
              <div className="ar-track">
                <div
                  className="ar-fill navy"
                  style={{ width: `${(n.value / maxNotif) * 100}%` }}
                />
              </div>
              <span className="ar-val">{n.value}</span>
            </div>
          ))}
          <div className="ar-note">
            Matches are potential matches only, not clinical compatibility.
          </div>
        </Card>
      </div>
    </div>
  );
}
