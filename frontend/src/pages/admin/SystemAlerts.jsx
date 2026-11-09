import { useEffect, useMemo, useState } from "react";
import Card from "../../componenets/ui/Card";
import { getAuditLog, getAuditLogCount, getAuditLogs } from "../../services/adminService";

const filters = ["All", "Security", "Requests", "Hospitals", "Accounts"];

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
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getAuditLogs({ limit: 100 }), getAuditLogCount()])
      .then(([response, count]) => {
        if (!active) return;
        setLogs(response.logs);
        setTotalCount(count.total_audit_logs);
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load audit events."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function showDetails(auditId) {
    setError("");
    setLoadingDetail(true);
    try {
      setSelectedLog(await getAuditLog(auditId));
    } catch (detailError) {
      setError(detailError.message || "Unable to load audit event details.");
    } finally {
      setLoadingDetail(false);
    }
  }

  const alerts = useMemo(() => logs.map((entry) => {
    const action = entry.action.toLowerCase();
    const type = action.includes("login") ? "Security"
      : action.includes("request") ? "Requests"
        : action.includes("hospital") ? "Hospitals" : "Accounts";
    return {
      id: entry.audit_id,
      type,
      title: entry.action.replaceAll("_", " "),
      detail: entry.description,
      time: new Date(entry.created_at).toLocaleString(),
    };
  }), [logs]);
  const visible = alerts.filter((alert) => filter === "All" || alert.type === filter);

  return (
    <div className="sa-root">
      <style>{css}</style>

      <div className="sa-head">
        <h1>Audit Events</h1>
        <p>Review recent recorded system events from the audit log.</p>
      </div>

      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

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

      <Card title="Recent events" subtitle={`${alerts.length} of ${totalCount} audit events loaded`}>
        {loading ? (
          <div className="sa-empty">Loading audit events…</div>
        ) : visible.length === 0 ? (
          <div className="sa-empty">No alerts to show.</div>
        ) : (
          <div className="sa-list">
            {visible.map((a) => (
              <div
                className="sa-row"
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
                  <button type="button" className="sa-btn" disabled={loadingDetail} onClick={() => showDetails(a.id)}>
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedLog && (
          <section aria-label="Audit event details" style={{ marginTop: 16, padding: 16, border: "1px solid var(--border)", borderRadius: 10 }}>
            <h3>Audit event #{selectedLog.audit_id}</h3>
            <p>{selectedLog.description}</p>
            <p>User: {selectedLog.user_id ?? "System"} · Entity: {selectedLog.entity_type} #{selectedLog.entity_id ?? "—"}</p>
            <p>IP address: {selectedLog.ip_address || "Not recorded"} · {new Date(selectedLog.created_at).toLocaleString()}</p>
            <button type="button" className="sa-btn" onClick={() => setSelectedLog(null)}>Close details</button>
          </section>
        )}
      </Card>
    </div>
  );
}
