import { useState } from "react";
import Card from "../../componenets/ui/Card";

const initialSettings = {
  donorCooldownDays: 56,
  searchRadiusKm: 25,
  sosExpiryHours: 6,
  smsReminders: true,
  emailReminders: true,
  autoAlertLowStock: true,
  requireHospitalApproval: true,
  auditLogging: true,
};

const roles = [
  {
    role: "Donor",
    access: "Own profile, availability, donation history, SOS responses",
  },
  {
    role: "Hospital staff",
    access: "Blood requests, stock, donor search (approximate locations)",
  },
  {
    role: "System admin",
    access:
      "Hospital approval, user management, alerts, configuration. No donor medical data",
  },
  { role: "Reviewer / auditor", access: "Read-only access to audit events" },
];

const css = `
.as-root{--navy:#0b2142;--red:#d0101e;--text:#1c2430;--muted:#7a8494;--border:#eceff4;--bg:#f6f7fb;--mint:#dff5ec;--mint-t:#2e9e6b;
  background:var(--bg);min-height:100%;padding:24px;color:var(--text);font-family:inherit}
.as-head h1{margin:0;font-size:22px;color:var(--navy)}
.as-head p{margin:4px 0 18px;color:var(--muted);font-size:13px}
.as-notice{background:var(--mint);color:var(--mint-t);padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
.as-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-bottom:16px}
.as-field{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);font-size:13px}
.as-field:last-child{border-bottom:none}
.as-label small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.as-num{width:80px;border:1px solid var(--border);border-radius:8px;padding:6px 8px;font-size:13px;text-align:right;outline:none}
.as-num:focus{border-color:var(--navy)}
.as-switch{position:relative;width:40px;height:22px;flex-shrink:0}
.as-switch input{opacity:0;width:100%;height:100%;margin:0;position:absolute;cursor:pointer;z-index:1}
.as-slider{position:absolute;inset:0;background:#cfd5de;border-radius:999px;transition:background .15s}
.as-slider::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .15s}
.as-switch input:checked + .as-slider{background:var(--red)}
.as-switch input:checked + .as-slider::after{transform:translateX(18px)}
.as-role{padding:12px 0;border-bottom:1px solid var(--border);font-size:13px}
.as-role:last-child{border-bottom:none}
.as-role strong{display:block;color:var(--navy);margin-bottom:2px}
.as-role span{color:var(--muted);font-size:12px}
.as-footer{display:flex;gap:10px}
.as-btn{border-radius:8px;padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer;background:#fff;border:1px solid var(--border);color:var(--navy)}
.as-btn.solid{background:var(--red);color:#fff;border-color:var(--red)}
`;

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="as-field">
      <div className="as-label">
        {label}
        {hint && <small>{hint}</small>}
      </div>
      <label className="as-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="as-slider" />
      </label>
    </div>
  );
}

function NumberField({ label, hint, value, onChange }) {
  return (
    <div className="as-field">
      <div className="as-label">
        {label}
        {hint && <small>{hint}</small>}
      </div>
      <input
        className="as-num"
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function AdminSettings() {
  const [saved, setSaved] = useState(initialSettings);
  const [form, setForm] = useState(initialSettings);
  const [notice, setNotice] = useState("");

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    setSaved(form);
    setNotice("Settings saved. Change recorded in the audit log.");
  };

  const reset = () => {
    setForm(saved);
    setNotice("");
  };

  return (
    <div className="as-root">
      <style>{css}</style>

      <div className="as-head">
        <h1>Settings</h1>
        <p>Manage system configuration, notifications and role access.</p>
      </div>

      {notice && <div className="as-notice">{notice}</div>}

      <div className="as-grid">
        <Card title="Donation Rules" subtitle="Matching and eligibility">
          <NumberField
            label="Donor cooldown (days)"
            hint="Informational reminder interval"
            value={form.donorCooldownDays}
            onChange={set("donorCooldownDays")}
          />
          <NumberField
            label="Search radius (km)"
            hint="Approximate locations only"
            value={form.searchRadiusKm}
            onChange={set("searchRadiusKm")}
          />
          <NumberField
            label="SOS expiry (hours)"
            value={form.sosExpiryHours}
            onChange={set("sosExpiryHours")}
          />
        </Card>

        <Card title="Notifications" subtitle="Reminders and alerts">
          <Toggle
            label="SMS reminders"
            checked={form.smsReminders}
            onChange={set("smsReminders")}
          />
          <Toggle
            label="Email reminders"
            checked={form.emailReminders}
            onChange={set("emailReminders")}
          />
          <Toggle
            label="Auto-alert on low stock"
            checked={form.autoAlertLowStock}
            onChange={set("autoAlertLowStock")}
          />
        </Card>

        <Card title="Security" subtitle="Access and auditing">
          <Toggle
            label="Require hospital approval"
            hint="New hospitals stay pending until verified"
            checked={form.requireHospitalApproval}
            onChange={set("requireHospitalApproval")}
          />
          <Toggle
            label="Audit logging"
            hint="Record significant admin actions"
            checked={form.auditLogging}
            onChange={set("auditLogging")}
          />
        </Card>

        <Card title="Roles" subtitle="What each role can access">
          {roles.map((r) => (
            <div className="as-role" key={r.role}>
              <strong>{r.role}</strong>
              <span>{r.access}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="as-footer">
        <button type="button" className="as-btn solid" onClick={save}>
          Save changes
        </button>
        <button type="button" className="as-btn" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
