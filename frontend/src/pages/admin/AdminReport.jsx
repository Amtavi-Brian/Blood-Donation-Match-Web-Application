import { useEffect, useState } from "react";
import { getDashboardReport, getDonorReport, getHospitalReport } from "../../services/reportService";

const metrics = [
  ["total_users", "Registered users"],
  ["total_donors", "Donors"],
  ["active_donors", "Active donors"],
  ["total_hospitals", "Hospitals"],
  ["verified_hospitals", "Verified hospitals"],
  ["total_donations", "Donation records"],
  ["verified_donations", "Verified donations"],
  ["pending_requests", "Pending blood requests"],
  ["fulfilled_requests", "Fulfilled requests"],
  ["total_blood_stock_quantity", "Blood stock units"],
  ["low_stock_items", "Low-stock items"],
];

export default function AdminReport() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getDashboardReport(), getDonorReport(), getHospitalReport()])
      .then(([dashboard, donors, hospitals]) => {
        if (active) setReport({ ...dashboard, ...donors, ...hospitals });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load reports.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main style={{ background: "#f6f7fb", minHeight: "100%", padding: 24 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ color: "#0b2142", marginBottom: 4 }}>System reports</h1>
        <p style={{ color: "#7a8494" }}>Live aggregate metrics from the BloodLink API.</p>
      </header>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {loading ? <p role="status">Loading reports…</p> : report && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {metrics.map(([key, label]) => (
            <article key={key} style={{ background: "#fff", border: "1px solid #eceff4", borderRadius: 12, padding: 18 }}>
              <span style={{ display: "block", color: "#7a8494", fontSize: 13 }}>{label}</span>
              <strong style={{ display: "block", color: "#0b2142", fontSize: 28, marginTop: 8 }}>
                {report[key] ?? "—"}
              </strong>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
