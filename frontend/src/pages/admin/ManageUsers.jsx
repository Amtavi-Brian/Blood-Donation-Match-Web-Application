import { useState } from "react";
import Card from "../../componenets/ui/Card";
import StatusBadge from "../../componenets/ui/StatusBadge";

const initialUsers = [
  {
    id: 1,
    name: "Lisa Ngacha",
    email: "lisa.ngacha@example.com",
    role: "Donor",
    county: "Nairobi",
    status: "active",
  },
  {
    id: 2,
    name: "Peter Otieno",
    email: "peter.otieno@example.com",
    role: "Donor",
    county: "Kisumu",
    status: "active",
  },
  {
    id: 3,
    name: "Amina Yusuf",
    email: "amina.yusuf@example.com",
    role: "Donor",
    county: "Mombasa",
    status: "suspended",
  },
  {
    id: 4,
    name: "Kenyatta Hospital Staff",
    email: "bloodbank@knh.or.ke",
    role: "Hospital",
    county: "Nairobi",
    status: "active",
  },
  {
    id: 5,
    name: "Aga Khan Lab",
    email: "lab@akuh.org",
    role: "Hospital",
    county: "Nairobi",
    status: "active",
  },
  {
    id: 6,
    name: "Test Account 77",
    email: "fake77@mailinator.com",
    role: "Donor",
    county: "Nairobi",
    status: "active",
  },
];

const filters = ["All", "Donor", "Hospital"];

const badgeFor = {
  active: { status: "fulfilled", label: "Active" },
  suspended: { status: "cancelled", label: "Suspended" },
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
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState("");

  const toggleStatus = (u) => {
    const next = u.status === "active" ? "suspended" : "active";
    setUsers((list) =>
      list.map((x) => (x.id === u.id ? { ...x, status: next } : x)),
    );
    setNotice(
      `${u.name} ${next === "active" ? "reactivated" : "suspended"}. Action recorded in the audit log.`,
    );
  };

  const remove = (u) => {
    setUsers((list) => list.filter((x) => x.id !== u.id));
    setConfirmId(null);
    setNotice(`${u.name} removed. Action recorded in the audit log.`);
  };

  const q = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (filter === "All" || u.role === filter) &&
      (!q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)),
  );

  return (
    <div className="mu-root">
      <style>{css}</style>

      <div className="mu-head">
        <h1>Manage Users</h1>
        <p>
          Suspend or remove accounts, including fake or duplicate registrations.
        </p>
      </div>

      {notice && <div className="mu-notice">{notice}</div>}

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
                <th>County</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="mu-empty">
                    No users found.
                  </td>
                </tr>
              )}
              {visible.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="mu-name">{u.name}</div>
                    <div className="mu-sub">{u.email}</div>
                  </td>
                  <td>
                    <span
                      className={`mu-role${u.role === "Hospital" ? " hospital" : ""}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.county}</td>
                  <td>
                    <StatusBadge
                      status={badgeFor[u.status].status}
                      label={badgeFor[u.status].label}
                    />
                  </td>
                  <td>
                    <div className="mu-actions">
                      {confirmId === u.id ? (
                        <>
                          <button
                            type="button"
                            className="mu-btn solid"
                            onClick={() => remove(u)}
                          >
                            Confirm remove
                          </button>
                          <button
                            type="button"
                            className="mu-btn"
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="mu-btn"
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status === "active" ? "Suspend" : "Reactivate"}
                          </button>
                          <button
                            type="button"
                            className="mu-btn danger"
                            onClick={() => setConfirmId(u.id)}
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
