import { useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";

const initialHospitals = [
  {
    id: 1,
    name: "Kenyatta National Hospital",
    county: "Nairobi",
    contact: "bloodbank@knh.or.ke",
    requests: 12,
    status: "active",
  },
  {
    id: 2,
    name: "Aga Khan University Hospital",
    county: "Nairobi",
    contact: "lab@akuh.org",
    requests: 8,
    status: "active",
  },
  {
    id: 3,
    name: "Nairobi Hospital",
    county: "Nairobi",
    contact: "bloodbank@nairobihospital.org",
    requests: 5,
    status: "active",
  },
  {
    id: 4,
    name: "Coast General Hospital",
    county: "Mombasa",
    contact: "info@coastgeneral.go.ke",
    requests: 3,
    status: "suspended",
  },
  {
    id: 5,
    name: "Kiambu Level 5 Hospital",
    county: "Kiambu",
    contact: "records@kiambuhosp.go.ke",
    requests: 2,
    status: "active",
  },
];

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
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState("");

  const toggleStatus = (h) => {
    const next = h.status === "active" ? "suspended" : "active";
    setHospitals((list) =>
      list.map((x) => (x.id === h.id ? { ...x, status: next } : x)),
    );
    setNotice(
      `${h.name} ${next === "active" ? "reactivated" : "suspended"}. Action recorded in the audit log.`,
    );
  };

  const remove = (h) => {
    setHospitals((list) => list.filter((x) => x.id !== h.id));
    setConfirmId(null);
    setNotice(`${h.name} removed. Action recorded in the audit log.`);
  };

  const q = query.trim().toLowerCase();
  const visible = hospitals.filter(
    (h) =>
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.county.toLowerCase().includes(q),
  );

  return (
    <div className="mh-root">
      <style>{css}</style>

      <div className="mh-head">
        <h1>Manage Hospitals</h1>
        <p>View, suspend or remove registered hospital accounts.</p>
      </div>

      {notice && <div className="mh-notice">{notice}</div>}

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
                <th>County</th>
                <th>Requests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
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
                    <div className="mh-sub">{h.contact}</div>
                  </td>
                  <td>{h.county}</td>
                  <td>{h.requests}</td>
                  <td>
                    <StatusBadge
                      status={badgeFor[h.status].status}
                      label={badgeFor[h.status].label}
                    />
                  </td>
                  <td>
                    <div className="mh-actions">
                      {confirmId === h.id ? (
                        <>
                          <button
                            type="button"
                            className="mh-btn solid"
                            onClick={() => remove(h)}
                          >
                            Confirm remove
                          </button>
                          <button
                            type="button"
                            className="mh-btn"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="mh-btn"
                            onClick={() => toggleStatus(h)}
                          >
                            {h.status === "active" ? "Suspend" : "Reactivate"}
                          </button>
                          <button
                            type="button"
                            className="mh-btn danger"
                            onClick={() => setConfirmId(h.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
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
