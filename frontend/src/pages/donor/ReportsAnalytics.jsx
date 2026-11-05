
import React, { useState } from 'react';
import './ReportsAnalytics.css';

const monthlyData = [
  { month: 'May', donations: 18 },
  { month: 'Jun', donations: 25 },
  { month: 'Jul', donations: 20 },
  { month: 'Aug', donations: 32 },
  { month: 'Sep', donations: 27 },
  { month: 'Oct', donations: 40 },
];

const bloodGroups = [
  { group: 'O+', count: 45, percent: 90 },
  { group: 'A+', count: 32, percent: 64 },
  { group: 'B+', count: 25, percent: 50 },
  { group: 'AB+', count: 18, percent: 36 },
  { group: 'O-', count: 15, percent: 30 },
  { group: 'A-', count: 10, percent: 20 },
];

const recentActivity = [
  { hospital: 'Kenyatta National Hospital', type: 'O+', date: '20 Oct 2026', status: 'Completed' },
  { hospital: 'Nairobi Hospital', type: 'A+', date: '15 Oct 2026', status: 'Completed' },
  { hospital: 'Aga Khan Hospital', type: 'B+', date: '10 Oct 2026', status: 'Pending' },
  { hospital: 'MP Shah Hospital', type: 'O+', date: '05 Oct 2026', status: 'Completed' },
];

function ReportsAnalytics() {
  const [period, setPeriod] = useState('Last 6 months');

  const totalDonations = monthlyData.reduce(
    (total, item) => total + item.donations,
    0
  );

  const maxDonations = Math.max(...monthlyData.map(item => item.donations));

  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div>
          <h2>Reports & Analytics</h2>
          <p>Track donation performance and blood donation insights.</p>
        </div>

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
            <h3>{totalDonations}</h3>
            <span>Across all recorded months</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon green-icon">❤️</div>
          <div>
            <p>Lives Impacted</p>
            <h3>225</h3>
            <span>Estimated lives reached</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon blue-icon">👥</div>
          <div>
            <p>Active Donors</p>
            <h3>148</h3>
            <span>Registered active donors</span>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="report-icon orange-icon">🏥</div>
          <div>
            <p>Partner Hospitals</p>
            <h3>12</h3>
            <span>Participating facilities</span>
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
              <strong>85%</strong>
              <p>Completed</p>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot pending-dot"></span>
            <div>
              <strong>10%</strong>
              <p>Pending</p>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot cancelled-dot"></span>
            <div>
              <strong>5%</strong>
              <p>Cancelled</p>
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
                        activity.status === 'Completed'
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

      <p className="reports-demo-note">
        These are demonstration figures. Live reports will be populated from
        the BloodLink database when backend integration is complete.
      </p>
    </div>
  );
}

export default ReportsAnalytics;
