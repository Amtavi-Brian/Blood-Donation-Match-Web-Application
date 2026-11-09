import { useEffect, useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";
import { getUsers } from "../../services/adminService";
import {
  authorizeHospitalStaff,
  getHospitals,
  registerHospital,
  revokeHospitalStaff,
  setHospitalVerification,
  updateHospital,
} from "../../services/hospitalService";

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
.mh-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.mh-form label{display:grid;gap:5px;font-size:12px;color:var(--muted)}
.mh-form input,.mh-form select{min-width:0;padding:9px;border:1px solid var(--border);border-radius:8px;font:inherit;color:var(--text)}
.mh-staff{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));align-items:end;gap:12px;margin-top:18px}
`;

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    registration_number: "",
    address: "",
    city: "",
    contact_phone: "",
  });

  useEffect(() => {
    let active = true;
    Promise.all([getHospitals({ verifiedOnly: false }), getUsers()])
      .then(([items, users]) => {
        if (!active) return;
        setHospitals(items);
        setStaffUsers(users.filter((user) => user.role === "hospital_staff"));
        setSelectedHospitalId(String(items[0]?.id ?? ""));
      })
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

  const createHospital = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await registerHospital(hospitalForm);
      setHospitals((list) => [created, ...list]);
      setSelectedHospitalId(String(created.id));
      setHospitalForm({ name: "", registration_number: "", address: "", city: "", contact_phone: "" });
      setNotice(`${created.name} was registered. Verify it before staff can use hospital services.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to register the hospital.");
    } finally {
      setBusy(false);
    }
  };

  const saveHospital = async (event) => {
    event.preventDefault();
    if (!editingHospital) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateHospital(editingHospital.id, {
        name: editingHospital.name,
        address: editingHospital.address,
        city: editingHospital.city,
        contact_phone: editingHospital.contact_phone,
      });
      setHospitals((list) => list.map((item) => item.id === updated.id ? updated : item));
      setEditingHospital(null);
      setNotice(`${updated.name} details were updated.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update hospital details.");
    } finally {
      setBusy(false);
    }
  };

  const changeStaffAuthorization = async (authorized) => {
    if (!selectedHospitalId || !selectedStaffId) return;
    setBusy(true);
    setError("");
    setNotice("");
    const staffUser = staffUsers.find((user) => String(user.id) === selectedStaffId);
    const hospital = hospitals.find((item) => String(item.id) === selectedHospitalId);
    try {
      if (authorized) {
        await authorizeHospitalStaff(selectedHospitalId, selectedStaffId);
      } else {
        await revokeHospitalStaff(selectedHospitalId, selectedStaffId);
      }
      setNotice(`${staffUser?.full_name || "Staff account"} ${
        authorized ? "was authorized for" : "was removed from"
      } ${hospital?.name || "the hospital"}.`);
    } catch (requestError) {
      setError(requestError.message || `Unable to ${authorized ? "authorize" : "revoke"} hospital staff.`);
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
  const selectedHospital = hospitals.find((hospital) => String(hospital.id) === selectedHospitalId);
  const selectedStaff = staffUsers.find((staff) => String(staff.id) === selectedStaffId);
  const canAuthorizeStaff = Boolean(
    selectedHospital?.is_verified &&
    selectedStaff?.is_active &&
    selectedStaff?.is_email_verified,
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

      <Card title="Register a hospital" subtitle="New hospitals must be verified before their staff can manage requests or inventory.">
        <form className="mh-form" onSubmit={createHospital}>
          <label>Hospital name
            <input required minLength={2} maxLength={200} value={hospitalForm.name} onChange={(event) => setHospitalForm({ ...hospitalForm, name: event.target.value })} />
          </label>
          <label>Registration number
            <input required minLength={2} maxLength={100} value={hospitalForm.registration_number} onChange={(event) => setHospitalForm({ ...hospitalForm, registration_number: event.target.value })} />
          </label>
          <label>Address
            <input required minLength={5} value={hospitalForm.address} onChange={(event) => setHospitalForm({ ...hospitalForm, address: event.target.value })} />
          </label>
          <label>City
            <input required minLength={2} maxLength={100} value={hospitalForm.city} onChange={(event) => setHospitalForm({ ...hospitalForm, city: event.target.value })} />
          </label>
          <label>Contact phone
            <input required type="tel" minLength={7} maxLength={30} value={hospitalForm.contact_phone} onChange={(event) => setHospitalForm({ ...hospitalForm, contact_phone: event.target.value })} />
          </label>
          <button className="mh-btn solid" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Register hospital"}
          </button>
        </form>
      </Card>

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
                        onClick={() => setEditingHospital(editingHospital?.id === h.id ? null : {
                          id: h.id,
                          name: h.name,
                          address: h.address,
                          city: h.city,
                          contact_phone: h.contact_phone,
                        })}
                      >
                        {editingHospital?.id === h.id ? "Close edit" : "Edit"}
                      </button>
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

      {editingHospital && (
        <Card title={`Edit ${hospitals.find((hospital) => hospital.id === editingHospital.id)?.name || "hospital"}`}>
          <form className="mh-form" onSubmit={saveHospital}>
            {["name", "address", "city", "contact_phone"].map((field) => (
              <label key={field}>
                {field.replaceAll("_", " ")}
                <input
                  required
                  value={editingHospital[field]}
                  onChange={(event) => setEditingHospital({ ...editingHospital, [field]: event.target.value })}
                />
              </label>
            ))}
            <button className="mh-btn solid" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save hospital"}
            </button>
          </form>
        </Card>
      )}

      <Card title="Hospital staff access" subtitle="Authorize or revoke an existing hospital staff account.">
        {staffUsers.length === 0 ? (
          <p>No hospital staff accounts exist yet. Create one in Manage Users first.</p>
        ) : (
          <div className="mh-staff">
            <label className="mh-form">
              Hospital
              <select value={selectedHospitalId} onChange={(event) => setSelectedHospitalId(event.target.value)}>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name} — {hospital.city}</option>
                ))}
              </select>
            </label>
            <label className="mh-form">
              Staff account
              <select value={selectedStaffId} onChange={(event) => setSelectedStaffId(event.target.value)}>
                <option value="">Select a staff account</option>
                {staffUsers.map((staff) => (
                  <option
                    key={staff.id}
                    value={staff.id}
                  >
                    {staff.full_name} · {staff.email}
                    {!staff.is_email_verified ? " · email unverified" : !staff.is_active ? " · inactive" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="mh-actions">
              <button type="button" className="mh-btn solid" disabled={busy || !selectedHospitalId || !selectedStaffId || !canAuthorizeStaff} onClick={() => changeStaffAuthorization(true)}>
                Authorize staff
              </button>
              <button type="button" className="mh-btn danger" disabled={busy || !selectedHospitalId || !selectedStaffId} onClick={() => changeStaffAuthorization(false)}>
                Revoke access
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
