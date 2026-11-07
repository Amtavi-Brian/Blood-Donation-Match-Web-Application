
import { useEffect, useState } from "react";
import { getMyDonations } from "../../services/donorService";
import { getHospitals } from "../../services/hospitalService";

function DonationHistory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getMyDonations(), getHospitals()])
      .then(([records, hospitals]) => {
        if (!active) return;
        const hospitalsById = new Map(hospitals.map((hospital) => [hospital.id, hospital]));
        setDonations(records.map((record) => {
          const hospital = hospitalsById.get(record.hospital_id);
          return {
            id: record.donation_id,
            date: record.donated_at.slice(0, 10),
            hospital: hospital?.name || "Hospital",
            location: hospital?.city || "Location unavailable",
            bloodGroup: record.blood_type,
            units: record.quantity,
            status: record.verified ? "Verified" : "Unverified",
          };
        }));
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load donation history.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.hospital.toLowerCase().includes(search.toLowerCase()) ||
      donation.date.includes(search);

    const matchesFilter =
      filter === "All" || donation.status === filter;

    return matchesSearch && matchesFilter;
  });

  const completed = donations.filter(
    (donation) => donation.status === "Verified"
  ).length;

  const totalUnits = donations
    .filter((donation) => donation.status === "Verified")
    .reduce((total, donation) => total + donation.units, 0);

  const styles = {
    page: {
      padding: "30px",
      background: "#f8f9fc",
      minHeight: "100vh",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
      color: "#1f2937",
    },
    heading: {
      fontSize: "28px",
      fontWeight: "700",
      marginBottom: "8px",
    },
    subtitle: {
      color: "#6b7280",
      marginBottom: "28px",
    },
    stats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "18px",
      marginBottom: "28px",
    },
    card: {
      background: "white",
      padding: "22px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
    number: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#991b1b",
      margin: "8px 0",
    },
    controls: {
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      marginBottom: "20px",
    },
    input: {
      padding: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "14px",
      flex: "1",
      minWidth: "200px",
    },
    select: {
      padding: "12px",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      background: "white",
      fontSize: "14px",
    },
    tableWrapper: {
      background: "white",
      borderRadius: "12px",
      padding: "20px",
      overflowX: "auto",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "650px",
    },
    th: {
      textAlign: "left",
      padding: "14px",
      background: "#f9fafb",
      color: "#6b7280",
      fontSize: "13px",
    },
    td: {
      padding: "16px 14px",
      borderBottom: "1px solid #eee",
      fontSize: "14px",
    },
    empty: {
      textAlign: "center",
      padding: "35px",
      color: "#6b7280",
    },
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Donation History</h1>
      <p style={styles.subtitle}>
        Keep track of your previous blood donations and their status.
      </p>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {loading && <p role="status">Loading donation history…</p>}

      <div style={styles.stats}>
        <div style={styles.card}>
          <div>Total Donations</div>
          <div style={styles.number}>{donations.length}</div>
          <small style={{ color: "#6b7280" }}>Recorded donations</small>
        </div>

        <div style={styles.card}>
          <div>Completed Donations</div>
          <div style={styles.number}>{completed}</div>
          <small style={{ color: "#6b7280" }}>Successful donations</small>
        </div>

        <div style={styles.card}>
          <div>Blood Units Donated</div>
          <div style={styles.number}>{totalUnits}</div>
          <small style={{ color: "#6b7280" }}>Units successfully donated</small>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search hospital or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Donations</option>
          <option value="Verified">Verified</option>
          <option value="Unverified">Unverified</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <h3 style={{ marginTop: 0, marginBottom: "18px" }}>
          Your Donation Records
        </h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Hospital</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Blood Group</th>
              <th style={styles.th}>Units</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={styles.empty}>Loading donation records…</td></tr>
            ) : filteredDonations.length > 0 ? (
              filteredDonations.map((donation) => (
                <tr key={donation.id}>
                  <td style={styles.td}>{donation.date}</td>
                  <td style={styles.td}>{donation.hospital}</td>
                  <td style={styles.td}>{donation.location}</td>
                  <td style={styles.td}>
                    <strong style={{ color: "#991b1b" }}>
                      {donation.bloodGroup}
                    </strong>
                  </td>
                  <td style={styles.td}>{donation.units}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          donation.status === "Verified"
                            ? "#dcfce7"
                            : "#fef3c7",
                        color:
                          donation.status === "Verified"
                            ? "#166534"
                            : "#92400e",
                      }}
                    >
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={styles.empty}>
                  No donation records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonationHistory;
