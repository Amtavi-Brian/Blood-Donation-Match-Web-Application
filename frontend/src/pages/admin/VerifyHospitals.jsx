import { useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";

const initialHospitals = [
  {
    id: 1,
    name: "Nairobi West Hospital",
    county: "Nairobi",
    license: "KMPDC-10234",
    contact: "admin@nairobiwest.co.ke",
    submitted: "02 Nov 2026",
    status: "pending",
  },
  {
    id: 2,
    name: "Mbagathi Hospital",
    county: "Nairobi",
    license: "KMPDC-20871",
    contact: "records@mbagathi.go.ke",
    submitted: "01 Nov 2026",
    status: "pending",
  },
  {
    id: 3,
    name: "Coast General Hospital",
    county: "Mombasa",
    license: "KMPDC-30455",
    contact: "info@coastgeneral.go.ke",
    submitted: "30 Oct 2026",
    status: "pending",
  },
  {
    id: 4,
    name: "Kenyatta National Hospital",
    county: "Nairobi",
    license: "KMPDC-00012",
    contact: "bloodbank@knh.or.ke",
    submitted: "24 Oct 2026",
    status: "approved",
  },
  {
    id: 5,
    name: "Sunrise Clinic",
    county: "Kiambu",
    license: "KMPDC-99001",
    contact: "sunrise@mail.com",
    submitted: "20 Oct 2026",
    status: "rejected",
  },
];

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
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
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [tab, setTab] = useState("pending");
  const [notice, setNotice] = useState("");

  const decide = (hospital, status) => {
    setHospitals((list) =>
      list.map((h) => (h.id === hospital.id ? { ...h, status } : h)),
    );
    setNotice(`${hospital.name} ${status}. Action recorded in the audit log.`);
  };

  const visible = hospitals.filter((h) => h.status === tab);
  const count = (key) => hospitals.filter((h) => h.status === key).length;

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

      <Card
        title="Hospital Registrations"
        subtitle={`${visible.length} ${tab}`}
      >
        {visible.length === 0 ? (
          <div className="vh-empty">No {tab} hospitals.</div>
        ) : (
          <div className="vh-list">
            {visible.map((h) => (
              <div className="vh-row" key={h.id}>
                <div className="vh-info">
                  <div className="vh-name">{h.name}</div>
                  <div className="vh-meta">
                    <span>{h.county}</span>
                    <span>Licence: {h.license}</span>
                    <span>{h.contact}</span>
                    <span>Submitted {h.submitted}</span>
                  </div>
                </div>
                <div className="vh-actions">
                  <StatusBadge
                    status={badgeFor[h.status].status}
                    label={badgeFor[h.status].label}
                  />
                  {h.status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="vh-btn vh-approve"
                        onClick={() => decide(h, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="vh-btn vh-reject"
                        onClick={() => decide(h, "rejected")}
                      >
                        Reject
                      </button>
                    </>
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
