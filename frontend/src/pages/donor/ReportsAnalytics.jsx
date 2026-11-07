
import { useEffect, useMemo, useState } from 'react';
import './ReportsAnalytics.css';
import { getMyDonations } from '../../services/donorService';
import { getHospitals } from '../../services/hospitalService';

function ReportsAnalytics() {
  const [period, setPeriod] = useState('Last 6 months');
  const [donations, setDonations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getMyDonations(), getHospitals()])
      .then(([records, hospitalList]) => {
        if (!active) return;
        setDonations(records);
        setHospitals(hospitalList);
      })
      .catch((loadError) => { if (active) setError(loadError.message || 'Unable to load donor analytics.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredDonations = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (period === 'Last 30 days') cutoff.setDate(now.getDate() - 30);
    else if (period === 'This year') cutoff.setMonth(0, 1);
    else cutoff.setMonth(now.getMonth() - 5, 1);
    return donations.filter((donation) => new Date(donation.donated_at) >= cutoff);
  }, [donations, period]);

  const monthlyData = useMemo(() => {
    const months = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const month = new Date();
      month.setDate(1);
      month.setMonth(month.getMonth() - offset);
      const key = `${month.getFullYear()}-${month.getMonth()}`;
      months.push({
        key,
        month: month.toLocaleDateString(undefined, { month: 'short' }),
        donations: filteredDonations.filter((item) => {
          const date = new Date(item.donated_at);
          return `${date.getFullYear()}-${date.getMonth()}` === key && item.verified;
        }).length,
      });
    }
    return months;
  }, [filteredDonations]);

  const bloodGroups = useMemo(() => {
    const counts = new Map();
    filteredDonations.forEach((donation) => {
      counts.set(donation.blood_type, (counts.get(donation.blood_type) || 0) + 1);
    });
    const max = Math.max(1, ...counts.values());
    return [...counts].map(([group, count]) => ({
      group,
      count,
      percent: Math.round((count / max) * 100),
    }));
  }, [filteredDonations]);

  const recentActivity = useMemo(() => filteredDonations
    .slice()
    .sort((a, b) => new Date(b.donated_at) - new Date(a.donated_at))
    .slice(0, 5)
    .map((donation) => ({
      hospital: hospitals.find((item) => item.id === donation.hospital_id)?.name || `Hospital #${donation.hospital_id}`,
      type: donation.blood_type,
      date: new Date(donation.donated_at).toLocaleDateString(),
      status: donation.verified ? 'Verified' : 'Unverified',
    })), [filteredDonations, hospitals]);

  const verifiedDonations = filteredDonations.filter((item) => item.verified);
  const pendingDonations = filteredDonations.filter((item) => !item.verified);
  const totalUnits = verifiedDonations.reduce((total, item) => total + item.quantity, 0);
  const maxDonations = Math.max(1, ...monthlyData.map((item) => item.donations));

  if (error && !loading) {
    return (
      <div className="reports-page">
        <h2>My Donation History</h2>
        <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div>
          <h2>My Donation History</h2>
          <p>Insights calculated from your recorded donation history.</p>
        </div>
        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
        {loading && <p role="status">Loading your donation analytics…</p>}

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="reports-period"
        >
          <option>Last 6 months</option>
          <option>Last 30 days</option>
          <option>This year</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="reports-stats">
        <div className="report-stat-card">
          <div className="report-icon red-icon">🩸</div>
          <div>
            <p>Total Donations</p>
            <h3>{filteredDonations.length}</h3>
            <span>Records in selected period</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon green-icon">❤️</div>
          <div>
            <p>Verified Units</p>
            <h3>{totalUnits}</h3>
            <span>Units in verified records</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon blue-icon">👥</div>
          <div>
            <p>Awaiting Verification</p>
            <h3>{pendingDonations.length}</h3>
            <span>Unverified donation records</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon orange-icon">🏥</div>
          <div>
            <p>Blood Groups</p>
            <h3>{new Set(filteredDonations.map((item) => item.blood_type)).size}</h3>
            <span>In your donation records</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="reports-charts">
        <section className="report-panel donation-trend">
          <div className="panel-heading">
            <div>
              <h3>Donation Trends</h3>
              <p>Monthly donations over time</p>
            </div>
            <span className="chart-legend">
              <i></i> Donations
            </span>
          </div>

          <div className="bar-chart">
            {monthlyData.map((item) => (
              <div className="bar-column" key={item.month}>
                <span className="bar-value">{item.donations}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(item.donations / maxDonations) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="bar-month">{item.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="report-panel blood-group-panel">
          <div className="panel-heading">
            <div>
              <h3>Donations by Blood Group</h3>
              <p>Distribution across blood types</p>
            </div>
          </div>

          <div className="blood-group-list">
            {bloodGroups.map((item) => (
              <div className="blood-group-row" key={item.group}>
                <strong>{item.group}</strong>
                <div className="blood-progress">
                  <div style={{ width: `${item.percent}%` }}></div>
                </div>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Status breakdown */}
      <section className="report-panel status-panel">
        <div className="panel-heading">
          <div>
            <h3>Donation Status</h3>
            <p>Overview of recorded donation activities</p>
          </div>
        </div>

        <div className="status-summary">
          <div className="status-item">
            <span className="status-dot completed-dot"></span>
            <div>
              <strong>{verifiedDonations.length}</strong>
              <p>Verified records</p>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot pending-dot"></span>
            <div>
              <strong>{pendingDonations.length}</strong>
              <p>Awaiting verification</p>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot cancelled-dot"></span>
            <div>
              <strong>{filteredDonations.length}</strong>
              <p>Total records</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="report-panel activity-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Donation Activity</h3>
            <p>Latest recorded donation activities</p>
          </div>
        </div>

        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Blood Group</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentActivity.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.hospital}</td>
                  <td>
                    <span className="blood-type-badge">{activity.type}</span>
                  </td>
                  <td>{activity.date}</td>
                  <td>
                    <span
                      className={`activity-status ${
                        activity.status === 'Verified'
                          ? 'activity-completed'
                          : 'activity-pending'
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!loading && filteredDonations.length === 0 && <p>No donation records were found for this period.</p>}
    </div>
  );
}

export default ReportsAnalytics;
