import { useEffect, useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";
import { getHospitals, setHospitalVerification } from "../../services/hospitalService";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

const badgeFor = {
  pending: { status: "pending", label: "Pending" },
  approved: { status: "fulfilled", label: "Approved" },
  rejected: { status: "cancelled", label: "Rejected" },
};

const css = `
.vh-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;--mint:#dff5ec;--mint-t:#2e9e6b;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.vh-head h1{margin:0;font-size:22px;color:var(--navy)}
.vh-head p{margin:4px 0 18px;color:var(--muted);font-size:13px}
.vh-tabs{display:flex;gap:8px;margin-bottom:16px}
.vh-tab{border:1px solid var(--border);background:#fff;color:var(--muted);padding:7px 16px;border-radius:999px;font-size:13px;cursor:pointer}
.vh-tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.vh-notice{background:var(--mint);color:var(--mint-t);padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
.vh-list{display:flex;flex-direction:column;gap:12px}
.vh-row{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px;flex-wrap:wrap}
.vh-info{min-width:240px;flex:1}
.vh-name{font-weight:600;color:var(--navy);margin-bottom:4px}
.vh-meta{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 16px}
.vh-actions{display:flex;align-items:center;gap:10px}
.vh-btn{border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}
.vh-approve{background:var(--red);color:#fff}
.vh-reject{background:#fff;color:var(--red);border:1px solid var(--red)}
.vh-empty{background:#fff;border:1px dashed var(--border);border-radius:14px;padding:32px;text-align:center;color:var(--muted);font-size:14px}
`;

export default function VerifyHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [tab, setTab] = useState("pending");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getHospitals({ verifiedOnly: false })
      .then((items) => { if (active) setHospitals(items); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load hospital registrations."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const decide = async (hospital, isVerified) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await setHospitalVerification(hospital.id, isVerified);
      setHospitals((list) => list.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.name} ${isVerified ? "approved" : "approval revoked"}.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update hospital verification.");
    } finally {
      setBusy(false);
    }
  };

  const visible = hospitals.filter((hospital) => hospital.is_verified === (tab === "approved"));
  const count = (key) => hospitals.filter((hospital) => hospital.is_verified === (key === "approved")).length;

  return (
    <div className="vh-root">
      <style>{css}</style>

      <div className="vh-head">
        <h1>Verify Hospitals</h1>
        <p>
          Review registration details and approve or reject hospital accounts.
        </p>
      </div>

      <div className="vh-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`vh-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({count(t.key)})
          </button>
        ))}
      </div>

      {notice && <div className="vh-notice">{notice}</div>}
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <Card
        title="Hospital Registrations"
        subtitle={`${visible.length} ${tab}`}
      >
        {loading ? (
          <div className="vh-empty">Loading hospital registrations…</div>
        ) : visible.length === 0 ? (
          <div className="vh-empty">No {tab} hospitals.</div>
        ) : (
          <div className="vh-list">
            {visible.map((h) => {
              const status = h.is_verified ? "approved" : "pending";
              return (
              <div className="vh-row" key={h.id}>
                <div className="vh-info">
                  <div className="vh-name">{h.name}</div>
                  <div className="vh-meta">
                    <span>{h.city}</span>
                    <span>Registration: {h.registration_number}</span>
                    <span>{h.contact_phone}</span>
                    <span>Submitted {new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="vh-actions">
                  <StatusBadge
                    status={badgeFor[status].status}
                    label={badgeFor[status].label}
                  />
                  {!h.is_verified && (
                      <button
                        type="button"
                        className="vh-btn vh-approve"
                        disabled={busy}
                        onClick={() => decide(h, true)}
                      >
                        Approve
                      </button>
                  )}
                </div>
              </div>
            );})}
          </div>
        )}
      </Card>
    </div>
  );
}
