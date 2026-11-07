import { Link } from "react-router-dom";
import Card from "../../componenets/ui/Card";

export default function AdminSettings() {
  return (
    <main style={{ background: "#f6f7fb", minHeight: "100%", padding: 24 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ color: "#0b2142", marginBottom: 4 }}>System settings</h1>
        <p style={{ color: "#7a8494" }}>Configuration and access controls for the BloodLink service.</p>
      </header>
      <p role="status" style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 14 }}>
        Runtime settings are managed through the backend deployment environment. This application does not expose a settings API, so changes cannot be safely saved from this page.
      </p>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card title="Hospital verification" subtitle="Review and update verified status">
          <p>Hospital approval is handled through the hospital verification workflow.</p>
          <Link to="/admin/verify-hospitals">Review hospitals</Link>
        </Card>
        <Card title="User access" subtitle="Manage account activation">
          <p>Administrators can activate or deactivate accounts using the supported user management API.</p>
          <Link to="/admin/users">Manage users</Link>
        </Card>
        <Card title="Audit events" subtitle="Review administrative activity">
          <p>Recorded system events are available in the audit log.</p>
          <Link to="/admin/alerts">View audit events</Link>
        </Card>
      </section>
    </main>
  );
}
