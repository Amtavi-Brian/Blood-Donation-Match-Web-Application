import { useEffect, useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";
import { getHospitals, setHospitalVerification } from "../../services/hospitalService";

const badgeFor = {
  active: { status: "fulfilled", label: "Active" },
  suspended: { status: "cancelled", label: "Suspended" },
};

const css = `
.mh-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;--mint:#dff5ec;--mint-t:#2e9e6b;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.mh-head h1{margin:0;font-size:22px;color:var(--navy)}
.mh-head p{margin:4px 0 18px;color:var(--muted);font-size:13px}
.mh-notice{background:var(--mint);color:var(--mint-t);padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
.mh-search{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;min-width:220px;outline:none}
.mh-search:focus{border-color:var(--navy)}
.mh-wrap{overflow-x:auto}
.mh-table{width:100%;border-collapse:collapse;font-size:13px}
.mh-table th{text-align:left;color:var(--muted);font-weight:600;padding:10px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
.mh-table td{padding:14px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.mh-name{font-weight:600;color:var(--navy)}
.mh-sub{color:var(--muted);font-size:12px}
.mh-actions{display:flex;gap:8px;flex-wrap:wrap}
.mh-btn{border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;border:1px solid var(--border);color:var(--navy)}
.mh-btn.danger{color:var(--red);border-color:var(--red)}
.mh-btn.solid{background:var(--red);color:#fff;border-color:var(--red)}
.mh-empty{padding:28px;text-align:center;color:var(--muted)}
`;

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getHospitals({ verifiedOnly: false })
      .then((items) => { if (active) setHospitals(items); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load hospitals."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggleStatus = async (hospital) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await setHospitalVerification(hospital.id, !hospital.is_verified);
      setHospitals((list) => list.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.name} ${updated.is_verified ? "verified" : "unverified"}.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update hospital verification.");
    } finally {
      setBusy(false);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = hospitals.filter(
    (h) =>
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q),
  );

  return (
    <div className="mh-root">
      <style>{css}</style>

      <div className="mh-head">
        <h1>Manage Hospitals</h1>
        <p>Review registered hospitals and update their verification status.</p>
      </div>

      {notice && <div className="mh-notice">{notice}</div>}
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <Card
        title="Registered Hospitals"
        subtitle={`${visible.length} of ${hospitals.length} shown`}
        action={
          <input
            className="mh-search"
            type="search"
            placeholder="Search name or county"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <div className="mh-wrap">
          <table className="mh-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>City</th>
                <th>Registration number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="mh-empty">Loading hospitals…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="mh-empty">
                    No hospitals found.
                  </td>
                </tr>
              )}
              {visible.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className="mh-name">{h.name}</div>
                    <div className="mh-sub">{h.contact_phone}</div>
                  </td>
                  <td>{h.city}</td>
                  <td>{h.registration_number}</td>
                  <td>
                    <StatusBadge
                      status={badgeFor[h.is_verified ? "active" : "suspended"].status}
                      label={badgeFor[h.is_verified ? "active" : "suspended"].label}
                    />
                  </td>
                  <td>
                    <div className="mh-actions">
                      <button
                        type="button"
                        className="mh-btn"
                        disabled={busy}
                        onClick={() => toggleStatus(h)}
                      >
                        {h.is_verified ? "Revoke verification" : "Verify"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
