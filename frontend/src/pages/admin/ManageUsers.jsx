import { useEffect, useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";
import {
  createHospitalStaffAccount,
  getUsers,
  updateUserActivation,
} from "../../services/adminService";

const filters = ["All", "Donor", "Hospital"];

const badgeFor = {
  active: { status: "fulfilled", label: "Active" },
  inactive: { status: "cancelled", label: "Inactive" },
};

const css = `
.mu-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;--mint:#dff5ec;--mint-t:#2e9e6b;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.mu-head h1{margin:0;font-size:22px;color:var(--navy)}
.mu-head p{margin:4px 0 18px;color:var(--muted);font-size:13px}
.mu-notice{background:var(--mint);color:var(--mint-t);padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
.mu-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.mu-tab{border:1px solid var(--border);background:#fff;color:var(--muted);padding:6px 14px;border-radius:999px;font-size:13px;cursor:pointer}
.mu-tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.mu-search{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;min-width:220px;outline:none}
.mu-search:focus{border-color:var(--navy)}
.mu-wrap{overflow-x:auto}
.mu-table{width:100%;border-collapse:collapse;font-size:13px}
.mu-table th{text-align:left;color:var(--muted);font-weight:600;padding:10px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
.mu-table td{padding:14px 12px;border-bottom:1px solid var(--border);vertical-align:middle}
.mu-name{font-weight:600;color:var(--navy)}
.mu-sub{color:var(--muted);font-size:12px}
.mu-role{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;background:#ece9fb;color:#6c5ce7}
.mu-role.hospital{background:#fdeedd;color:#f08c1a}
.mu-actions{display:flex;gap:8px;flex-wrap:wrap}
.mu-btn{border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;border:1px solid var(--border);color:var(--navy)}
.mu-btn.danger{color:var(--red);border-color:var(--red)}
.mu-btn.solid{background:var(--red);color:#fff;border-color:var(--red)}
.mu-empty{padding:28px;text-align:center;color:var(--muted)}
`;

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  useEffect(() => {
    let active = true;
    getUsers()
      .then((result) => { if (active) setUsers(result); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load users."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggleStatus = async (user) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateUserActivation(user.id, !user.is_active);
      setUsers((list) => list.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.full_name} is now ${updated.is_active ? "active" : "inactive"}.`);
    } catch (requestError) {
      setError(requestError.message || "Unable to update this account.");
    } finally {
      setBusy(false);
    }
  };

  const createStaffAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await createHospitalStaffAccount({
        ...staffForm,
        phone_number: staffForm.phone_number || null,
      });
      setUsers((list) => [created, ...list.filter((user) => user.id !== created.id)]);
      setStaffForm({ full_name: "", email: "", phone_number: "", password: "" });
      setNotice(
        `Staff account created for ${created.full_name}. They must verify their email, then be authorized for a hospital in Manage Hospitals.`,
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to create the hospital staff account.");
    } finally {
      setBusy(false);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (filter === "All" ||
        (filter === "Donor" && u.role === "donor") ||
        (filter === "Hospital" && u.role === "hospital_staff")) &&
      (!q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)),
  );

  return (
    <div className="mu-root">
      <style>{css}</style>

      <div className="mu-head">
        <h1>Manage Users</h1>
        <p>
          Review registered users and activate or deactivate accounts.
        </p>
      </div>

      {notice && <div className="mu-notice">{notice}</div>}
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      <Card title="Create hospital staff account" subtitle="The staff member must verify their email before signing in.">
        <form
          onSubmit={createStaffAccount}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}
        >
          <label>
            Full name
            <input
              required
              minLength={2}
              maxLength={150}
              value={staffForm.full_name}
              onChange={(event) => setStaffForm({ ...staffForm, full_name: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={staffForm.email}
              onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })}
            />
          </label>
          <label>
            Phone number
            <input
              type="tel"
              maxLength={30}
              value={staffForm.phone_number}
              onChange={(event) => setStaffForm({ ...staffForm, phone_number: event.target.value })}
            />
          </label>
          <label>
            Temporary password
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={staffForm.password}
              onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })}
            />
          </label>
          <button className="mu-btn solid" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
      </Card>

      <div className="mu-bar">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`mu-tab${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <input
          className="mu-search"
          type="search"
          placeholder="Search name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card
        title="User Accounts"
        subtitle={`${visible.length} of ${users.length} shown`}
      >
        <div className="mu-wrap">
          <table className="mu-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email verification</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="mu-empty">Loading users…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="mu-empty">
                    No users found.
                  </td>
                </tr>
              )}
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="mu-name">{u.full_name}</div>
                    <div className="mu-sub">{u.email}</div>
                  </td>
                  <td>
                    <span
                      className={`mu-role${u.role === "hospital_staff" ? " hospital" : ""}`}
                    >
                      {u.role === "hospital_staff" ? "Hospital staff" : u.role}
                    </span>
                  </td>
                  <td>{u.is_email_verified ? "Verified" : "Unverified"}</td>
                  <td>
                    <StatusBadge
                      status={badgeFor[u.is_active ? "active" : "inactive"].status}
                      label={badgeFor[u.is_active ? "active" : "inactive"].label}
                    />
                  </td>
                  <td>
                    <div className="mu-actions">
                      <button
                        type="button"
                        className="mu-btn"
                        disabled={busy}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
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
